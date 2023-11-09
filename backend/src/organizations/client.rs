use std::env::VarError;

use aws_sdk_cognitoidentityprovider as cognitoidentityprovider;
use cognitoidentityprovider::error::SdkError;
use cognitoidentityprovider::operation::create_user_pool_client::{CreateUserPoolClientError, CreateUserPoolClientOutput};
use cognitoidentityprovider::types::OAuthFlowType;
use actix_web::{Responder, web};
use crate::{HttpResponse, user};
use crate::diesel::QueryDsl;
use diesel::insert_into;
use crate::diesel::ExpressionMethods;
use crate::diesel::RunQueryDsl;
use crate::diesel::SelectableHelper;
use super::super::Pool;
use super::models::{self, OrganizationDetails, NewOrganizationDetails, Config};
use super::super::schema::organization_details::dsl as dsl;
use crate::user::models::{CreateUserRequest};
use crate::user::client::create_user;
use crate::errors::ServiceError;
use uuid::Uuid;
use log::{error};


fn get_user_pool_id() -> Result<String, VarError> {
    // At some point we will have to update this so that it can be dynamic
    // and change based on if the user_pool_id has too many app clients already
    std::env::var("USER_POOL_ID")
}

pub async fn add_organization(
    db: web::Data<Pool>,
    item: web::Json<models::CreateOrganizationRequest>
) -> impl Responder {
    let organization_id = &Uuid::new_v4().to_string();
    let user_pool_id = get_user_pool_id()?;
    let create_client_result = create_user_pool_client( user_pool_id.clone(), &item.subdomain)
    .await?;

    let create_admin_request = CreateUserRequest {
        user_pool_id: user_pool_id,
        email: item.admin_email.clone(),
        first_name: item.admin_first_name.clone(),
        last_name: item.admin_last_name.clone(),
        organization_id: organization_id.to_string(),
        role: user::models::UserRole::Admin,
        title: None,
        manager_id: None,
    };

    let _create_admin_result = create_user(db.clone(), create_admin_request).await?;

    let new_org_details = NewOrganizationDetails {
        id: &organization_id,
        name: &item.organization_name,
        subdomain: &item.subdomain,
        user_pool_id: create_client_result.user_pool_client().unwrap().user_pool_id(),
        user_pool_client_id: create_client_result.user_pool_client().unwrap().client_id()
    };

    insert_organization_details(db, new_org_details)
    .map(|insert_result| HttpResponse::Created().json(insert_result))
    .map_err(|err|<diesel::result::Error as Into<ServiceError>>::into(err))
}

pub async fn get_org_config(
    db: web::Data<Pool>,
    path:web::Path<String>
) -> impl Responder {
    let subdomain = path.into_inner();
    web::block(move || fetch_organization_by_subdomain(db, subdomain))
        .await
        .map(|result| match result {
            Ok(org_details) => {
                let config = Config {
                    user_pool_client_id:  org_details.user_pool_client_id.unwrap_or_default(),
                    user_pool_id: org_details.user_pool_id.unwrap_or_default()
                };
                HttpResponse::Ok().json(config)
            }
            Err(e) => {
                error!("Error getting org details by subdomain {}", e);
                HttpResponse::NotFound().finish()
            }
        })
        .map_err(|err| err)
}

async fn create_user_pool_client(user_pool_id: String, subdomain: &str) -> Result<CreateUserPoolClientOutput, ServiceError> {
    let config: aws_config::SdkConfig = ::aws_config::load_from_env().await;
    let client = cognitoidentityprovider::Client::new(&config);
    let callback_url = format!("https://{subdomain}.pagopeople.com/");
    let staging_callback_url = format!("https://{subdomain}.staging.pagopeople.com/");
    let response = client.create_user_pool_client()
        .user_pool_id(user_pool_id)
        .client_name(format!("AppClient-{subdomain}"))
        .generate_secret(false)
        .allowed_o_auth_flows(OAuthFlowType::Code)
        .allowed_o_auth_flows(OAuthFlowType::Implicit)
        .supported_identity_providers("COGNITO".to_string())
        .callback_ur_ls(callback_url.clone())
        .callback_ur_ls(staging_callback_url.clone())
        .logout_ur_ls(callback_url.clone())
        .set_allowed_o_auth_scopes(Some(vec![
            "email".to_string(),
            "openid".to_string(),
            "profile".to_string(),
            "phone".to_string(),
            "aws.cognito.signin.user.admin".to_string()
        ]))
        .set_write_attributes(Some(vec!["given_name".to_string(), "family_name".to_string(), "email".to_string(), "custom:tenantId".to_string()]))
        .send()
        .await
        .map_err(|e| {
            error!("Error creating user pool: {}", e);
            ServiceError::InternalServerError
        })?;
    Ok(response)
}

pub async fn get_organizations(db: web::Data<Pool>) -> impl Responder {
    web::block(move || get_all_organizations(db))
        .await
        .map(|tenants| HttpResponse::Ok().json(tenants.ok().unwrap()))
        .map_err(|err| err)
}

pub async fn get_organization(
    db: web::Data<Pool>,
    path: web::Path<String>
) -> impl Responder {
    let organization_id = path.into_inner();
    web::block(move || fetch_organization_by_id(db, organization_id))
        .await
        .map(|tenants| match tenants {
            Ok(tenant) => {
                HttpResponse::Ok().json(tenant)
            },
            Err(e) => {
                HttpResponse::NotFound().json(e.to_string())
            }
        })
        .map_err(|err| err)
}

fn get_all_organizations(pool: web::Data<Pool>) -> Result<Vec<OrganizationDetails>, diesel::result::Error> {
    let mut conn = pool.get().unwrap();
    dsl::organization_details.load::<OrganizationDetails>(&mut conn)
    
}

pub fn fetch_organization_by_id(pool: web::Data<Pool>, organization_id: String) -> Result<OrganizationDetails, diesel::result::Error>  {
    let mut conn = pool.get().unwrap();
    dsl::organization_details.filter(dsl::id.eq(organization_id)).select(OrganizationDetails::as_select()).first::<models::OrganizationDetails>(&mut conn)
}

fn fetch_organization_by_subdomain(
    db: web::Data<Pool>,
    subdomain: String
) -> Result<OrganizationDetails, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    dsl::organization_details.filter(dsl::subdomain.eq(subdomain)).select(OrganizationDetails::as_select()).first::<models::OrganizationDetails>(&mut conn)
}

fn insert_organization_details(
    db: web::Data<Pool>,
    item: NewOrganizationDetails<'_>,
) -> Result<OrganizationDetails, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    let res = insert_into(dsl::organization_details).values(&item).get_result(&mut conn);
    res
}
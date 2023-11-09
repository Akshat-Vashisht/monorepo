#![allow(dead_code)]
use actix_web::cookie::{Cookie, CookieBuilder, SameSite, Expiration};
use actix_web::cookie::time::{OffsetDateTime};
use aws_sdk_cognitoidentityprovider as cognitoidentityprovider;
use cognitoidentityprovider::error::SdkError;
use cognitoidentityprovider::operation::admin_create_user::{AdminCreateUserOutput, AdminCreateUserError};
use cognitoidentityprovider::types::builders::AttributeTypeBuilder;
use aws_sdk_s3::operation::get_object::GetObjectOutput;

use actix_web::{web, HttpResponse};

use super::super::Pool;
use super::super::schema::users::dsl as dsl;
use super::models::CognitoUser;
use crate::user::models::*;
use diesel::insert_into;
use crate::diesel::RunQueryDsl;
use crate::diesel::ExpressionMethods;
use crate::diesel::SelectableHelper;
use crate::diesel::BoolExpressionMethods;
use crate::diesel::QueryDsl;
use crate::errors::ServiceError;
use csv::StringRecord;
use convert_case::Casing;
use convert_case::Case;
use crate::organizations;
use actix_web::Responder;
use log::{error, info};
use crate::auth::Claims;


pub async fn get_all_users (
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let organization_id = current_user.organization_id.clone();
    
    web::block(move || fetch_all_users_by_org(&db, &organization_id))
    .await
    .map(|result| match result {
        Ok(users) => {
            HttpResponse::Ok().json(users)
        }
        Err(e) => {
            error!("Error getting all users for org: {}", e);
            HttpResponse::InternalServerError().finish()
        }
    })
    .map_err(|_e| {
        error!("Blocking error getting all users for org");
        ServiceError::InternalServerError
    })
}

pub async fn add_user(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
    add_user_req: web::Json<AddUserRequest>,
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    if current_user.role != UserRole::Admin && current_user.role != UserRole::SystemAdmin {
        error!("Only admins can add users {}", current_user.role);
        return Err(ServiceError::ForbiddenError)
    }

    let org_details = organizations::client::fetch_organization_by_id(db.clone(), current_user.organization_id.clone())
        .map_err(|e| {
            error!("Error getting org details to add user: {}", e);
            e
        })?;
    
    let create_user_request = CreateUserRequest {
        user_pool_id: org_details.user_pool_id.unwrap(),
        organization_id: current_user.organization_id.clone(),
        email: add_user_req.email.clone(),
        first_name: add_user_req.first_name.clone(),
        last_name: add_user_req.last_name.clone(),
        role: add_user_req.role.clone(),
        title: None,
        manager_id: None
    };

   match create_user(db, create_user_request).await {
    Ok(user) => { Ok(HttpResponse::Ok().json(user)) }
    Err(_) => { Err(ServiceError::InternalServerError) }
   }
}

pub async fn create_user (
    db: web::Data<Pool>,
    req: CreateUserRequest
) -> Result<User, ServiceError> {
    let cognito_result = create_cognito_user(req.clone()).await?;
    let sub = cognito_result.user().unwrap().attributes().unwrap().iter().find(|&attribute| attribute.name().unwrap_or_default().eq("sub")).unwrap().value().unwrap();
    let insert_result = insert_user(db, req, sub)?;
    Ok(insert_result)
}

pub async fn update_user (
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
    req: web::Json<UpdateUserRequest>,
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    if current_user.role != UserRole::Admin && current_user.role != UserRole::SystemAdmin {
        error!("Only admins can update users {}", current_user.role);
        return Err(ServiceError::ForbiddenError)
    }

    let org_details = organizations::client::fetch_organization_by_id(db.clone(), current_user.organization_id.clone())
    .map_err(|e| {
        error!("Error getting org details to add user: {}", e);
        e
    })?;

    let _ = update_cognito_user(org_details.user_pool_id.unwrap(), req.clone()).await?;

    update_db_user(&db, &current_user.organization_id, req.clone().into())
    .map(|user| { Ok(HttpResponse::Ok().json(user)) })
    .map_err(|e| {
        error!("Error updating user in db {}", e);
        ServiceError::InternalServerError
    })?
    
}

pub async fn masquerade_user(
    db: web::Data<Pool>,
    path:web::Path<String>,
    user_claims_option: Option<web::ReqData<Claims>>,
) -> impl Responder {
    let user_claims = user_claims_option.ok_or(ServiceError::BadRequest("User claims not found".to_string()))?;
    if user_claims.role != "Admin" && user_claims.role != "SystemAdmin" {
        error!("Only admins can masquerade {}", user_claims.role);
        return Ok(HttpResponse::Forbidden().finish());
    }

    let masquerade_user_id = path.into_inner();
    if user_claims.sub == masquerade_user_id {
        let cookie = Cookie::build("masquerade_user_id", user_claims.sub.clone())
            .path("/")
            .same_site(SameSite::None)
            .secure(true)
            .expires(Expiration::from(Some(OffsetDateTime::from_unix_timestamp(0).unwrap())))
            .finish();
        return Ok(HttpResponse::Ok().cookie(cookie).finish());
    }


    match fetch_user_by_id(&db, &user_claims.organization_id, &masquerade_user_id) {
        Ok(_) => {
            let cookie = Cookie::build("masquerade_user_id", masquerade_user_id)
            .path("/")
            .same_site(SameSite::None)
            .secure(true)
            .finish();
            Ok(HttpResponse::Ok().cookie(cookie).finish())
        }
        Err(e) => {
            error!("Error getting masquerade user {}", e);
            Err(ServiceError::InternalServerError)
        }
    }
}

pub async fn get_user_by_id (
    db: web::Data<Pool>,
    organization_id: &str,
    user_id: &str
) -> Result<User, ServiceError> {
    fetch_user_by_id(&db, organization_id, user_id).map_err(|err| err.into())
}

pub async fn create_cognito_user(
    req: CreateUserRequest,
) -> Result<AdminCreateUserOutput, ServiceError> {
    let config: aws_config::SdkConfig = ::aws_config::load_from_env().await;
    let client = cognitoidentityprovider::Client::new(&config);
    let builder: AttributeTypeBuilder = Default::default();
    let response = client.admin_create_user()
        .user_pool_id(req.user_pool_id)
        .username(req.email.clone())
        .set_user_attributes(Some(vec![
            builder.clone()
                .name("email".to_string())
                .value(req.email)
                .build(),
            builder.clone()
                .name("custom:userRole".to_string())
                .value(req.role.to_string())
                .build(),
            builder.clone()
                .name("custom:tenantId".to_string())
                .value(req.organization_id)
                .build(),
            builder.clone()
                .name("given_name".to_string())
                .value(req.first_name)
                .build(),
            builder.clone()
                .name("family_name".to_string())
                .value(req.last_name)
                .build()
        ]))
        .send()
        .await
        .map_err(|e| {
            error!("Error creating user: {}", e);
            ServiceError::InternalServerError
        })?;
    Ok(response)
}

fn insert_user (
    db: web::Data<Pool>, 
    req: CreateUserRequest, sub: &str
) -> Result<User, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    let new_user = NewUser{
        id: sub,
        first_name: &req.first_name,
        last_name: &req.last_name,
        email: &req.email,
        organization_id: &req.organization_id,
        role: &req.role.to_string(),
        title: req.title.as_deref(),
        manager_id: req.manager_id.as_deref(),
    };

    let res = insert_into(dsl::users).values(&new_user).get_result(&mut conn);
    res
}

fn update_user_manager (
    db: &web::Data<Pool>,
    user_id: String,
    manager_id: String
) -> Result<User, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    diesel::update(dsl::users)
    .set(
        dsl::manager_id.eq(manager_id)
    )
    .filter(dsl::id.eq(user_id))
    .get_result(&mut conn)
}

fn update_db_user (
    db: &web::Data<Pool>,
    organization_id: &str,
    req: UpdateDbUserRequest
) -> Result<User, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    let user_id = req.id.clone();
    diesel::update(dsl::users)
    .set(req)
    .filter(dsl::id.eq(user_id).and(dsl::organization_id.eq(organization_id)))
    .get_result(&mut conn)
}

async fn update_cognito_user(
    user_pool_id: String,
    req: UpdateUserRequest
) -> Result<(), ServiceError> {
    let config: aws_config::SdkConfig = ::aws_config::load_from_env().await;
    let client = cognitoidentityprovider::Client::new(&config);
    let mut attribute_types = vec![];

    req.email.map(|email| { attribute_types.push(attribute_type("email", email))});
    req.first_name.map(|first_name| { attribute_types.push(attribute_type("given_name", first_name))});
    req.last_name.map(|last_name| { attribute_types.push(attribute_type("family_name", last_name))});
    req.user_role.map(|role| { attribute_types.push(attribute_type("custom:userRole", role.to_string()))});
    
    if attribute_types.len() == 0 {
        info!("No cognito attributes being updated. Skipping");
        return Ok(());
    }

    client.admin_update_user_attributes()
    .set_username(Some(req.id))
    .set_user_pool_id(Some(user_pool_id))
    .set_user_attributes(Some(attribute_types))
    .send()
    .await
    .map(|_| {
        info!("Updated user in cognito");
         Ok(())
    })
    .map_err(|e| {
        error!("Error updating user in cognito {}", e);
        ServiceError::InternalServerError
    })?
}

fn fetch_all_users_by_org (
    db: &web::Data<Pool>,
    organization_id: &str
) -> Result<Vec<User>, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    dsl::users
        .filter(dsl::organization_id.eq(organization_id))
        .load(&mut conn)
}

pub fn fetch_user_by_id (
    db: &web::Data<Pool>,
    organization_id: &str,
    user_id: &str
) -> Result<User, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    dsl::users
        .filter(dsl::id.eq(user_id)
            .and(dsl::organization_id.eq(organization_id)))
        .select(User::as_select())
        .first::<User>(&mut conn)
}

pub async fn get_cognito_user(
    db: web::Data<Pool>,
    organization_id: String,
    user_id: &str,
) -> Result<CognitoUser, ServiceError> {
    let org_details = organizations::client::fetch_organization_by_id(db, organization_id)
    .map_err(|e| {
        error!("Error getting org details: {}", e);
        e
    })?;

    fetch_user_from_cognito(user_id, &org_details.user_pool_id.unwrap_or_default()).await
}

async fn fetch_user_from_cognito (
    user_id: &str,
    user_pool_id: &str
) -> Result<CognitoUser, ServiceError> {
    let config: aws_config::SdkConfig = ::aws_config::load_from_env().await;
    let client = cognitoidentityprovider::Client::new(&config);
    client.admin_get_user()
    .username(user_id)
    .user_pool_id(user_pool_id)
    .send()
    .await
    .map(|result| {
        let attributes = result.user_attributes.unwrap_or_default();
        let cognito_user = CognitoUser {
            sub: get_attribute_with_name(&attributes, "sub").unwrap().value.unwrap().to_string(),
            given_name: get_attribute_with_name(&attributes, "given_name").unwrap().value.unwrap().to_string(),
            family_name: get_attribute_with_name(&attributes, "family_name").unwrap().value.unwrap().to_string(),
            email: get_attribute_with_name(&attributes, "email").unwrap().value.unwrap().to_string(),
            organization_id: get_attribute_with_name(&attributes, "custom:tenantId").unwrap().value.unwrap().to_string(),
            role: get_attribute_with_name(&attributes, "custom:userRole").unwrap().value.unwrap().to_string()
        };
        Ok(cognito_user)
    })
    .map_err(|e| {
        error!("Error getting user from cognito: {}", e);
        ServiceError::InternalServerError
    })?
}

fn get_attribute_with_name(
    attributes: &Vec<cognitoidentityprovider::types::AttributeType>,
    name: &str
) -> Option<cognitoidentityprovider::types::AttributeType> {
    attributes.into_iter().find(|at| { at.name.as_deref().unwrap_or_default().eq(name) }).cloned()
}

fn attribute_type (
    name: &str,
    value: String
) -> cognitoidentityprovider::types::AttributeType {
    cognitoidentityprovider::types::AttributeType::builder()
    .set_name(Some(name.to_string()))
    .set_value(Some(value))
    .build()
}

pub fn fetch_user_by_email (
    db: &web::Data<Pool>,
    email: String
) -> Result<User, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    dsl::users
        .filter(dsl::email.eq(email))
        .select(User::as_select())
        .first::<User>(&mut conn)
}

#[derive(serde::Deserialize, serde::Serialize, std::fmt::Debug)]
pub struct Row {
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub title: Option<String>,
    pub manager_email: Option<String>
}

fn get_create_user_request(
    row: &Row, 
    organization_id: String, 
    user_pool_id: String
) -> CreateUserRequest {
    CreateUserRequest { 
        user_pool_id,
        organization_id, 
        email: row.email.clone(),
        first_name: row.first_name.clone(), 
        last_name: row.last_name.clone(), 
        role: UserRole::User, 
        title: row.title.clone(), 
        manager_id: None
    }
} 

pub async fn parse_file_upload(
    db: &web::Data<Pool>,
    output: GetObjectOutput,
    organization_id: &str,
) -> Result<(), ServiceError> {
    info!("Parsing org data file");
    let contents = output.body.collect()
    .await
    .map_err(|e| {
        error!("Error reading bytes from file {}", e.to_string());
        ServiceError::InternalServerError
    })?;

    let bytes = contents.into_bytes();
    let t = std::str::from_utf8(&bytes).map_err(|e| {
        error!("Error converting bytes to string {}", e.to_string());
        ServiceError::InternalServerError
    })?;

    let mut rdr = csv::Reader::from_reader(t.as_bytes());
    let file_headers = rdr.headers().map_err(|e| {
        error!("Error getting headers {}", e.to_string());
        ServiceError::InternalServerError
    })?;

    let normalized_headers = normalize_headers(file_headers);
    rdr.set_headers(normalized_headers);
    let iter: csv::DeserializeRecordsIter<'_, &[u8], Row> = rdr.deserialize();

    
    let mut count = 0;

    let organization_details = &organizations::client::fetch_organization_by_id(db.clone(), organization_id.to_string())
    .map_err(|e| {
        error!("Error getting org with id {}: {}", organization_id, e);
        e
    })?;
    
    let mut processed_rows: Vec<Row> = vec![];
    for line in iter {
        count += 1;
        if line.is_err() {
            error!("Error parsing line {}: {}", count, line.unwrap_err());
            continue;
        }
        let row = line.unwrap();
        match fetch_user_by_email(&db, row.email.clone()) {
            Ok(_user) => { processed_rows.push(row); }
            Err(diesel::result::Error::NotFound) => {
                info!("Creating user for {}", row.email);
                let create_user_request = get_create_user_request(
                    &row, 
                    organization_id.to_string(), 
                    organization_details.user_pool_id.as_ref().unwrap().to_string()
                );
                let _ = create_user(db.clone(),create_user_request)
                    .await
                    .map(|_usr| processed_rows.push(row))
                    .map_err(|e| error!("Error creating user {}", e.to_string()));
                
            }
            Err(e) => {
                error!("Error fetching user by email {}", e);
                continue;
            }
        }  
        count += 1;
    }

    for row in processed_rows.iter() {
        let manager_id = match &row.manager_email {
            Some(email) => {
                match fetch_user_by_email(db, email.to_string()) {
                    Ok(manager) => {
                        Some(manager.id)
                    }
                    Err(e) => {
                        error!("Error getting manager: {}", e);
                        None
                    }
                }
            }
            None => {
                None
            }
        };

        if manager_id.is_none() {
            continue;
        }

        match fetch_user_by_email(&db, row.email.clone()) {
            Ok(user) => {
                if user.manager_id != manager_id {
                    let _ = update_user_manager(db, user.id.clone(), manager_id.unwrap())
                    .map(|_| info!("Updated manager for user {}", user.id))
                    .map_err(|e| error!("Error updating manager for user {}: {}", user.id, e));
                }
            }
            Err(e) => {
                error!("Error fetching user by email to update manager {}", e);
            }
        }  
    }
    Ok(())
}

fn normalize_headers(sr: &StringRecord) -> StringRecord {
    let mut res = StringRecord::new();
    for f in sr.iter() {
        res.push_field(f.to_case(Case::Snake).as_str());
    }
    res
}

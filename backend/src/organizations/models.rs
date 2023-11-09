use serde::{Deserialize, Serialize};
use aws_sdk_cognitoidentityprovider::operation::create_user_pool_client::{CreateUserPoolClientOutput};

#[derive(Serialize, Deserialize)]
pub struct CreateOrganizationRequest {
    pub organization_name: String,
    pub subdomain: String,
    pub admin_first_name: String,
    pub admin_last_name: String,
    pub admin_email: String
}

#[derive(Serialize, Deserialize)]
pub struct Config {
    pub user_pool_id: String,
    pub user_pool_client_id: String
}

#[derive(Serialize, Deserialize)]
pub struct CreateOrganizationResponse {
    pub user_pool_id: String,
    pub user_pool_client_id: String,
}

impl std::convert::From<CreateUserPoolClientOutput> for CreateOrganizationResponse {
    fn from(value: CreateUserPoolClientOutput) -> Self {
        CreateOrganizationResponse { 
            user_pool_id: value.user_pool_client().unwrap().user_pool_id().unwrap().to_string(), 
            user_pool_client_id: value.user_pool_client().unwrap().client_id().unwrap().to_string()
        }
    }
}

#[derive(Insertable, Debug)]
#[diesel(table_name = crate::schema::organization_details)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct NewOrganizationDetails<'a> {
    pub id: &'a str,
    pub name: &'a str,
    pub subdomain: &'a str,
    pub user_pool_id: Option<&'a str>,
    pub user_pool_client_id: Option<&'a str>,
}

#[derive(Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = crate::schema::organization_details)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct OrganizationDetails {
    pub id: String,
    pub name: String,
    pub subdomain: String,
    pub user_pool_id: Option<String>,
    pub user_pool_client_id: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}
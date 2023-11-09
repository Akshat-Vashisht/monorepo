use derive_more::Display;
use serde::{Deserialize, Serialize};
use log::error;

#[derive(Debug, Display, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum UserRole {
    #[display(fmt = "User")]
    User,

    #[display(fmt = "Admin")]
    Admin,

    #[display(fmt = "System Admin")]
    SystemAdmin
}

impl Into<UserRole> for std::string::String {
    fn into(self) -> UserRole {
        match self.as_str() {
            "User" => { UserRole::User },
            "Admin" => { UserRole::Admin },
            "SystemAdmin" => { UserRole::SystemAdmin },
            _ => {
                error!("Unrecognized role. Returning default. {}", self);
                UserRole::User
            }
        }
    }
}
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AddUserRequest {
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub role: UserRole
}


#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UpdateUserRequest {
    pub id: String,
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub user_role: Option<UserRole>
}

#[derive(AsChangeset)]
#[diesel(table_name = crate::schema::users)]
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UpdateDbUserRequest {
    pub id: String,
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub role: Option<String>
}

impl Into<UpdateDbUserRequest> for UpdateUserRequest {
    fn into(self) -> UpdateDbUserRequest {
        UpdateDbUserRequest { 
            id: self.id, 
            email: self.email, 
            first_name: self.first_name, 
            last_name: self.last_name,
            role: self.user_role.map(|ur| ur.to_string()),
         }
    }
}

#[derive(Debug, Clone)]
pub struct CreateUserRequest {
    pub user_pool_id: String,
    pub email: String,
    pub organization_id: String,
    pub first_name: String,
    pub last_name: String,
    pub role: UserRole,
    pub title: Option<String>,
    pub manager_id: Option<String>
}


#[derive(Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = crate::schema::users)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct User {
    pub id: String,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub organization_id: String,
    pub role: String,
    pub title: Option<String>,
    pub manager_id: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CognitoUser {
    pub sub: String,
    pub given_name: String,
    pub family_name: String,
    pub email: String,
    pub organization_id: String,
    pub role: String
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentUser {
    pub id: String,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub organization_id: String,
    pub role: UserRole,
    // If this is set then the user with id masquerading_user_id
    // is masquerading as the user above.
    pub masquerading_user_id: Option<String>
}

#[derive(Insertable, Debug)]
#[diesel(table_name = crate::schema::users)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct NewUser<'a> {
    pub id: &'a str,
    pub first_name: &'a str,
    pub last_name: &'a str,
    pub email: &'a str,
    pub organization_id: &'a str,
    pub role: &'a str,
    pub title: Option<&'a str>,
    pub manager_id: Option<&'a str>,
}

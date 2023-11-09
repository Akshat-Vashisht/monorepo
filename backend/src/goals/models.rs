
use serde::{Deserialize, Serialize};
use diesel::prelude::*;

#[derive(Queryable, QueryableByName, Selectable, Serialize, Deserialize)]
#[diesel(table_name = crate::schema::organization_goals)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct OrganizationGoal {
    pub id: String,
    pub organization_id: String,
    pub name: String,
    pub description: String,
    pub status: i32,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Insertable, Debug)]
#[diesel(table_name = crate::schema::organization_goals)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct InsertOrganizationGoal<'a> {
    pub id: &'a str,
    pub organization_id: &'a str,
    pub name: &'a str,
    pub description: &'a str,
    pub status: &'a i32,
}

#[derive(Serialize, Deserialize)]
pub struct CreateGoalRequest {
    pub name: String,
    pub description: String
}
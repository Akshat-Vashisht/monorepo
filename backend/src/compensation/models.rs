use serde::{Deserialize, Serialize};
use diesel::prelude::*;

#[derive(Queryable, QueryableByName, Selectable, Serialize, Deserialize)]
#[diesel(table_name = crate::schema::compensation)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Compensation {
    pub user_id: String,
    pub organization_id: String,
    pub base_pay: i32,
    pub variable_pay: Option<i32>,
    pub target_commissions: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime
}

#[derive(Insertable, Debug)]
#[diesel(table_name = crate::schema::compensation)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct InsertCompensation<'a> {
    pub user_id: &'a str,
    pub organization_id: &'a str,
    pub base_pay: &'a i32,
    pub variable_pay: Option<&'a i32>,
    pub target_commissions: Option<&'a i32>,
}

#[derive(Serialize, Deserialize)]
pub struct CreateCompensationRequest {
    email: String,
    base_pay: f64,
    variable_pay: Option<f64>,
    target_commissions: Option<f64>
}

#[derive(Serialize, Deserialize)]
pub struct CompensationResponse {
    pub user_id: String,
    pub organization_id: String,
    pub base_pay: f64,
    pub variable_pay: Option<f64>,
    pub target_commissions: Option<f64>,
    pub payband: Option<Payband>,
    pub percentile: Option<f64>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime
}

#[derive(Serialize, Deserialize)]
pub struct BudgetDataResponse {
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub score: Option<f64>,
    pub manager_name: Option<String>,
    pub base_pay: Option<f64>,
    pub target_commissions: Option<f64>,
    pub variable_pay: Option<f64>
}

#[derive(Serialize, Deserialize)]
pub struct PaybandResponse {
    pub user_id: String,
    pub organization_id: String,
    pub base_pay: f64,
    pub variable_pay: Option<f64>,
    pub target_commissions: Option<f64>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime
}


#[derive(Queryable, QueryableByName, Selectable, Serialize, Deserialize, Clone)]
#[diesel(table_name = crate::schema::paybands)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Payband {
    pub organization_id: String,
    pub title: String,
    pub high: i32,
    pub mid: i32,
    pub low: i32,
    pub created_at: chrono::NaiveDateTime
}


#[derive(Insertable, Debug)]
#[diesel(table_name = crate::schema::paybands)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct InsertPayband<'a> {
    pub title: &'a str,
    pub organization_id: &'a str,
    pub high: &'a i32,
    pub mid: &'a i32,
    pub low: &'a i32
}

#[derive(Serialize, Deserialize)]
pub struct BudgetData {
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub manager_name: Option<String>,
    pub base_pay: Option<f64>,
    pub score: f64,
    pub replaceability_score: Option<f64>,
    pub target_commissions: Option<f64>,
    pub variable_pay: Option<f64>
}

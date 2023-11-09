
use serde::{Deserialize, Serialize};
use diesel::prelude::*;

// #[derive(Queryable, QueryableByName, Selectable, Serialize, Deserialize)]
// pub struct EmployeeReviewScore {
//     pub organization_id: String,
//     pub employee_id: String,
//     pub project_size: i32,
//     pub score: f64,
//     pub submitted_at: chrono::NaiveDateTime,
// }

#[derive(Queryable, QueryableByName, Selectable, Serialize, Deserialize, Clone)]
#[diesel(table_name = crate::schema::project_review_scores)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct ProjectReviewScore {
    pub organization_id: String,
    pub user_id: String,
    pub employee_review_id: String,
    pub manager_review_id: String,
    pub score: f64,
    pub project_size: i32,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Insertable, Debug)]
#[diesel(table_name = crate::schema::project_review_scores)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct InsertProjectReviewScore<'a> {
    pub organization_id: &'a str,
    pub user_id: &'a str,
    pub employee_review_id: &'a str,
    pub manager_review_id: &'a str,
    pub score: &'a f64,
    pub project_size: &'a i32
}


#[derive(Queryable, QueryableByName, Selectable, Serialize, Deserialize)]
#[diesel(table_name = crate::schema::employee_scores)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct EmployeeScore {
    pub organization_id: String,
    pub employee_id: String,
    pub score: f64,
    pub replaceability_score: Option<f64>,
    pub updated_at: chrono::NaiveDateTime,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Insertable, Debug)]
#[diesel(table_name = crate::schema::employee_scores)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct InsertEmployeeScore {
    pub organization_id: String,
    pub employee_id: String,
    pub score: f64,
    pub replaceability_score: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct ReviewSummary {
    pub review_id: String,
    pub employee_score_impact: f64,
    pub score: f64,
    pub submitted_at: chrono::NaiveDateTime
}

#[derive(Serialize, Deserialize)]
pub struct ProjectSizeReviewSummary {
    pub project_size: i32,
    pub average_score: f64,
    pub employee_score_impact: f64,
    pub recent_reviews: Vec<ReviewSummary>
}

#[derive(Serialize, Deserialize)]
pub struct PerformanceSummary {
    pub user_id: String,
    pub first_name: String,
    pub last_name: String,
    pub title: Option<String>,
    pub employee_score: f64,
    pub replaceability_score: Option<f64>,
    pub review_summaries: Vec<ProjectSizeReviewSummary>
}


use serde::{Deserialize, Serialize};
use diesel::prelude::*;


#[derive(Serialize, Deserialize)]
pub struct CreateReviewRequest {
    pub id: Option<String>,
    pub project_name: String,
    pub project_description: String,
    pub project_size: i32,
    pub schema_id: String,
    pub responses: serde_json::Value
}

#[derive(Serialize, Deserialize)]
pub struct GetReviewsResponse {
    pub completed_reviews: Vec<ProjectReview>,
    pub requested_reviews: Vec<ProjectReview>
}



#[derive(Queryable, QueryableByName, Selectable, Serialize, Deserialize, Clone)]
#[diesel(table_name = crate::schema::project_reviews)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct ProjectReview {
    pub id: String,
    pub organization_id: String,
    pub submitted_by: String,
    pub project_name: String,
    pub project_description: String,
    pub project_size: i32,
    pub status: String,
    pub schema_id: String,
    pub responses: serde_json::Value,
    pub original_review_id: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub submitted_at: Option<chrono::NaiveDateTime>
}

#[derive(Insertable, Debug)]
#[diesel(table_name = crate::schema::project_reviews)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct InsertProjectReview<'a> {
    pub id: &'a str,
    pub organization_id: &'a str,
    pub submitted_by: &'a str,
    pub project_name: &'a str,
    pub project_description: &'a str,
    pub project_size: &'a i32,
    pub schema_id: &'a str,
    pub status: &'a str,
    pub responses: &'a serde_json::Value,
    pub original_review_id: Option<&'a str>,
    pub submitted_at: Option<&'a chrono::NaiveDateTime>,
}


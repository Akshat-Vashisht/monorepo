use std::vec;

use chrono::Utc;
use actix_web::{Responder, web};
use crate::{HttpResponse, user};
use crate::diesel::QueryDsl;
use diesel::{insert_into};
use crate::diesel::ExpressionMethods;
use crate::diesel::RunQueryDsl;
use crate::diesel::SelectableHelper;
use crate::diesel::BoolExpressionMethods;
use super::super::Pool;
use super::models::{self, ProjectReview, InsertProjectReview, GetReviewsResponse};
use crate::schema::project_reviews::dsl as dsl;
use crate::schema::users::dsl as users_dsl;
use crate::user::models::{User, CurrentUser};
use crate::errors::ServiceError;
use uuid::Uuid;
use crate::auth::Claims;
use log::{error};

pub async fn get_all_reviews_for_user(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let user_id = current_user.id.clone();

    web::block(move || fetch_all_reviews_for_user(db, user_id))
        .await
        .map(|result| match result {
            Ok(reviews) => {
                let mut completed_reviews: Vec<ProjectReview> = vec![];
                let mut requested_reviews: Vec<ProjectReview> = vec![];

                for review in reviews.iter() {
                    match review.status.as_str() {
                        "SUBMITTED" => { completed_reviews.push(review.clone()); }
                        "REQUESTED" => { requested_reviews.push(review.clone()); }
                        _ => { error!("Unrecognized review status"); }
                    }
                }
                
                let resp = GetReviewsResponse {
                    completed_reviews,
                    requested_reviews,
                };
                HttpResponse::Ok().json(resp)
            }
            Err(e) => {
                error!("Error getting reviews for user: {}", e);
                HttpResponse::InternalServerError().finish()
            }
        
        })
        .map_err(|err| ServiceError::BadRequest(err.to_string()))
}

pub async fn get_review_by_id(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
    path: web::Path<String>
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let user_id = current_user.id.clone();
    let review_id = path.into_inner();
    // TODO: Update with permissioning on who can view the review
    web::block(move || fetch_review_by_id(db, review_id))
        .await
        .map(|review| match review {
            Ok(r) => {
                if r.submitted_by != user_id {
                    return HttpResponse::Forbidden().json("Only user that submitted review can view");
                }
                HttpResponse::Ok().json(r)
            },
            Err(e) => {
                HttpResponse::NotFound().json(e.to_string())
            }
        })
        .map_err(|err| ServiceError::BadRequest(err.to_string()))
}

pub async fn add_review(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
    item: web::Json<models::CreateReviewRequest>
) -> Result<HttpResponse, ServiceError> {

    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    if current_user.masquerading_user_id.is_some() {
        return Ok(HttpResponse::Forbidden().json("Cannot add review while masquerading"));
    }
    let user_id = &current_user.id;
    let review_id = &Uuid::new_v4().to_string();
    let submitted_at =  &Utc::now().naive_utc();
    let insert_project_review_request = InsertProjectReview {
        id: &review_id,
        organization_id: &current_user.organization_id,
        submitted_by: user_id,
        project_name: &item.project_name,
        project_description: &item.project_description,
        project_size: &item.project_size,
        status: &"SUBMITTED".to_string(),
        schema_id: &item.schema_id,
        responses: &item.responses,
        original_review_id: None,
        submitted_at: Some(submitted_at)
    };
    
    let insert_result = insert_project_review(db.clone(), insert_project_review_request)
    .map_err(|err: diesel::result::Error|<diesel::result::Error as Into<ServiceError>>::into(err))?;
    let manager_schema_id = get_manager_schema_id(&item.schema_id);
    let _ = add_manager_review_request(
        db, 
        user_id.to_string(),
        current_user.organization_id.clone(),
        review_id.to_string(), 
        &manager_schema_id,
        item
    ).await.map_err(|e| {
        error!("Error saving manager review: {}", e);
        e
    });

    Ok(HttpResponse::Created().json(insert_result))
}

pub async fn add_manager_responses(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
    item: web::Json<models::CreateReviewRequest>,
    path: web::Path<String>
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let user_id = current_user.id.clone();
    let original_review_id = path.into_inner();
    let submitted_at =  Utc::now().naive_utc();

    // This will raise an error if there is no existing review for this review_id with the 
    // submitted_by as the user_id who made the request.
    let manager_review = fetch_manager_review_for_review_id(db.clone(), original_review_id, user_id)?;

    save_responses(db, &item.responses, submitted_at, manager_review.id)
    .map(|insert_result| HttpResponse::Created().json(insert_result))
    .map_err(|err|<diesel::result::Error as Into<ServiceError>>::into(err))
}

fn get_manager_schema_id(direct_report_schema_id: &str) -> String {
    match direct_report_schema_id {
        "endproj" => { "endproj_manager".to_string() },
        "midproj" => { "midproj_manager".to_string() },
        "ongoing" => { "ongoing_manager".to_string() },
        _ => { "Unknown".to_string() }
    }
}


// Called to create a review in requested status that should generate a notification
// for the manager and show up in the request section of a managers review page
async fn add_manager_review_request(
    db: web::Data<Pool>,
    user_id: String,
    organization_id: String,
    original_review_id: String,
    schema_id: &str,
    item: web::Json<models::CreateReviewRequest>
) -> Result<ProjectReview, ServiceError> {
    let user = user::client::get_user_by_id(db.clone(), &organization_id, &user_id).await?;
    let review_id = &Uuid::new_v4().to_string();
    let responses = serde_json::from_str("{}").unwrap();
    if user.manager_id == None {
        return Err(ServiceError::BadRequest("No manager found for user".to_string()));
    }
    let insert_project_review_request = InsertProjectReview {
        id: &review_id,
        organization_id: &organization_id,
        submitted_by: user.manager_id.as_deref().unwrap(),
        project_name: &item.project_name,
        project_description: &item.project_description,
        project_size: &item.project_size,
        status: &"REQUESTED".to_string(),
        responses: &responses,
        schema_id,
        original_review_id: Some(&original_review_id),
        submitted_at: None
    };
    
    insert_project_review(db, insert_project_review_request)
    .map_err(|err|<diesel::result::Error as Into<ServiceError>>::into(err))
}

fn fetch_all_reviews_for_user(
    pool: web::Data<Pool>,
    user_id: String
) -> Result<Vec<ProjectReview>, diesel::result::Error> {
    let mut conn = pool.get().unwrap();
    dsl::project_reviews.filter(dsl::submitted_by.eq(user_id)).load::<models::ProjectReview>(&mut conn)
}

pub fn fetch_review_by_id(
    pool: web::Data<Pool>,
    review_id: String
) -> Result<ProjectReview, diesel::result::Error> {
    let mut conn = pool.get().unwrap();
    dsl::project_reviews
        .filter(
            dsl::id.eq(review_id)
        )
        .select(ProjectReview::as_select())
        .first::<models::ProjectReview>(&mut conn)
}

fn insert_project_review(
    db: web::Data<Pool>,
    item: InsertProjectReview<'_>,
) -> Result<ProjectReview, diesel::result::Error> {
    
    let mut conn = db.get().unwrap();
    let res = insert_into(dsl::project_reviews).values(&item).get_result(&mut conn);
    res
}

fn save_responses(
    db: web::Data<Pool>,
    responses: &serde_json::Value,
    submitted_at: chrono::NaiveDateTime,
    manager_review_id: String
) -> Result<ProjectReview, diesel::result::Error> {
    
    let mut conn = db.get().unwrap();
    diesel::update(dsl::project_reviews)
    .set((
        dsl::responses.eq(responses),
        dsl::submitted_at.eq(submitted_at),
        dsl::status.eq("SUBMITTED")
    ))
    .filter(dsl::id.eq(manager_review_id))
    .get_result(&mut conn)
}


fn fetch_manager_review_for_review_id(
    db: web::Data<Pool>,
    original_review_id: String,
    manager_id: String
) -> Result<ProjectReview, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    dsl::project_reviews
        .filter(
            dsl::original_review_id.eq(original_review_id)
            .and(dsl::submitted_by.eq(manager_id))
        )
        .select(ProjectReview::as_select())
        .first::<models::ProjectReview>(&mut conn)
}


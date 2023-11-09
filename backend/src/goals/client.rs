use actix_web::{Responder, web, HttpResponse};
use crate::errors::ServiceError;
use crate::schema::organization_goals::dsl as dsl;
use crate::auth::Claims;
use crate::goals::models::{CreateGoalRequest, InsertOrganizationGoal, OrganizationGoal};
use crate::diesel::QueryDsl;
use crate::diesel::RunQueryDsl;
use crate::diesel::BoolExpressionMethods;
use crate::diesel::ExpressionMethods;
use crate::user::models::CurrentUser;
use diesel::{insert_into, SelectableHelper};
use uuid::Uuid;
use log::{error};

use super::super::Pool;

pub async fn add_goal(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
    req: web::Json<CreateGoalRequest>
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let organization_id = &current_user.organization_id;
    let id = &Uuid::new_v4().to_string();
    let insert_goal_req = InsertOrganizationGoal {
        id,
        organization_id,
        name: &req.name,
        description: &req.description,
        status: &1,
    };

    insert_goal(db, insert_goal_req)
    .map(|goal| HttpResponse::Ok().json(goal))
    .map_err(|err| {
        error!("Error inserting goal {}", err);
        ServiceError::InternalServerError
    })
}

pub async fn get_goals(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let organization_id = current_user.organization_id.clone();

    web::block(move || fetch_goals(db, organization_id))
    .await
    .map(|result| match result {
        Ok(goals) => {
            HttpResponse::Ok().json(goals)
        }
        Err(err) => {
            HttpResponse::InternalServerError().json(err.to_string())
        }
    })
    .map_err(|err| {
        error!("Error getting goals {}", err);
        ServiceError::InternalServerError
    })
}

pub async fn get_goal_by_id(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
    path: web::Path<String>
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let organization_id = current_user.organization_id.clone();
    let goal_id = path.into_inner();
   
    web::block(move || fetch_goal_by_id(db, organization_id, goal_id))
    .await
    .map(|result| match result {
        Ok(goal) => {
            HttpResponse::Ok().json(goal)
        }
        Err(err) => {
            HttpResponse::InternalServerError().json(err.to_string())
        }
    })
    .map_err(|err| {
        error!("Error getting goal {}", err);
        ServiceError::InternalServerError
    })
}

pub fn fetch_goals(
    db: web::Data<Pool>,
    organization_id: String
) -> Result<Vec<OrganizationGoal>, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    dsl::organization_goals
        .filter(
            dsl::organization_id.eq(organization_id)
        )
        .load(&mut conn)
}

pub fn fetch_goal_by_id(
    db: web::Data<Pool>,
    organization_id: String,
    review_id: String
) -> Result<OrganizationGoal, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    dsl::organization_goals
        .filter(
            dsl::organization_id.eq(organization_id)
            .and(dsl::id.eq(review_id))
        ).select(OrganizationGoal::as_select())
        .first::<OrganizationGoal>(&mut conn)
}

pub fn insert_goal(
    db: web::Data<Pool>,
    item: InsertOrganizationGoal<'_>
) -> Result<OrganizationGoal, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    insert_into(dsl::organization_goals).values(&item).get_result(&mut conn)
}


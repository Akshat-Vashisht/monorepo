use super::models::EmployeeScore;
use super::models::InsertEmployeeScore;
use super::models::ProjectSizeReviewSummary;
use super::review_scoring;
use std::collections::HashMap;
use actix_web::{Responder, web};
use chrono::NaiveDateTime;
use chrono::Utc;
use diesel::upsert::excluded;
use diesel::upsert::on_constraint;
use log::warn;
use crate::errors::ServiceError;
use crate::{HttpResponse};
use diesel::{insert_into, QueryDsl};
use crate::diesel::JoinOnDsl;

use crate::diesel::ExpressionMethods;
use crate::diesel::RunQueryDsl;
use super::super::Pool;
use crate::reviews;
use crate::reviews::models::{ProjectReview};
use crate::schema::project_review_scores::dsl as rs_dsl;
use crate::schema::employee_scores::dsl as es_dsl;
use crate::schema::project_reviews::dsl as review_dsl;
use crate::schema::users::dsl as users_dsl;
use crate::scoring::models::{InsertProjectReviewScore, ProjectReviewScore};
use crate::diesel::BoolExpressionMethods;
use crate::Claims;
use log::{info, error};
use crate::user::models::{User, CurrentUser};
use crate::scoring::models::ReviewSummary;
use crate::scoring::models::PerformanceSummary;

const EXISTENTIAL_WEIGHT: f64 = 20.0;
const LARGE_WEIGHT: f64 = 10.0;
const MEDIUM_WEIGHT: f64 = 5.0;
const SMALL_WEIGHT: f64 = 1.0;

trait RoundTwo {
    fn round_two(self) -> Self;
}

impl RoundTwo for f64 {
    fn round_two(self) -> Self {
        (100.0 * self).round() / 100.0
    }
}

pub async fn get_unscored(
    db: web::Data<Pool>
) -> impl Responder {
    web::block(move || fetch_unscored_completed_reviews(db))
    .await
    .map(|reviews| match reviews {
        Ok(r) => {
            HttpResponse::Ok().json(r)
        },
        Err(e) => {
            HttpResponse::NotFound().json(e.to_string())
        }
    })
}

pub async fn add_score_for_completed_reviews(
    db: web::Data<Pool>
) -> impl Responder {
    web::block({let db_clone = db.clone(); move || fetch_unscored_completed_reviews(db_clone)})
    .await
    .map(|completed_manager_reviews| match completed_manager_reviews {
        Ok(manager_reviews) => {
            let mut scores = vec![];
            for manager_review in  manager_reviews.iter() {
                let res = reviews::client::fetch_review_by_id(db.clone(), manager_review.original_review_id.clone().unwrap())
                .map(|employee_review| {
                    let (employee_score, manager_score) = review_scoring::calculate_scores_for_reviews(&employee_review, manager_review);
                    let insert_score_req = InsertProjectReviewScore {
                        employee_review_id: &employee_review.id,
                        manager_review_id: &manager_review.id,
                        score: &employee_score,
                        project_size: &employee_review.project_size,
                        organization_id: &employee_review.organization_id,
                        user_id: &employee_review.submitted_by
                    };

                    let _ = insert_review_score(&db, insert_score_req)
                    .map(|result| info!("Inserted score for reviewId: {}", result.employee_review_id))
                    .map_err(|err| error!("Error inserting score {}", err));

                    let insert_manager_score_req = InsertProjectReviewScore {
                        employee_review_id: &employee_review.id,
                        manager_review_id: &manager_review.id,
                        score: &manager_score,
                        project_size: &employee_review.project_size,
                        organization_id: &employee_review.organization_id,
                        user_id: &manager_review.submitted_by
                    };

                    let _ = insert_review_score(&db, insert_manager_score_req)
                    .map(|result| info!("Inserted score for reviewId: {}", result.employee_review_id))
                    .map_err(|err| error!("Error inserting score {}", err));


                    scores.push(employee_score);
                    scores.push(manager_score);

                })
                .map_err( |err| err);
                match res {
                    Ok(_) => {},
                    Err(_) => {}
                }
                
            };
            HttpResponse::Ok().json(scores)
        },
        Err(e) => {
            HttpResponse::InternalServerError().json(e.to_string())
        }
    })
}


pub async fn update_employee_scores(
    db: web::Data<Pool>
) -> impl Responder {
    web::block({let db_clone = db.clone(); move || fetch_employee_review_scores(db_clone)})
    .await
    .map(|employee_review_scores| match employee_review_scores {
        Ok(review_scores_all_employees) => {
            // Ideally the query can use inner join so these don't have to be optional but they should be there.
            let mut scores_by_employee = HashMap::<String, Vec<&ProjectReviewScore>>::new();
            let mut reviews_by_employee = HashMap::<String, Vec<&ProjectReview>>::new();
            for (review_score, review_opt, manager_review_opt) in review_scores_all_employees.iter() {
                let review = review_opt.as_ref().unwrap();
                let manager_review = manager_review_opt.as_ref().unwrap();
                if scores_by_employee.contains_key(&(review.submitted_by)) {
                    scores_by_employee
                    .get_mut(&(review.submitted_by))
                    .unwrap()
                    .push(review_score);
                } else {
                    scores_by_employee.insert(review.submitted_by.clone(), vec!(review_score));
                }
                if reviews_by_employee.contains_key(&(review.submitted_by)) {
                    reviews_by_employee
                    .get_mut(&(review.submitted_by))
                    .unwrap()
                    .push(manager_review);
                } else {
                    reviews_by_employee.insert(review.submitted_by.clone(), vec!(manager_review));
                }
            }

            let mut scores_to_insert: Vec<InsertEmployeeScore> = vec![];

            for (employee_id, review_scores) in scores_by_employee.iter() {
                let score = calculate_employee_score(review_scores);
                let replaceability_score = calculate_replaceability_score(reviews_by_employee.get(employee_id).unwrap());
                scores_to_insert.push(InsertEmployeeScore {
                    organization_id: review_scores[0].organization_id.clone(),
                    employee_id: employee_id.clone(),
                    score: score,
                    replaceability_score: Some(replaceability_score),
                });
            }

            upsert_employee_scores(&db, scores_to_insert)
            .map(|inserted_scores| HttpResponse::Ok().json(inserted_scores))
            .map_err(|e| {
                error!("Error inserting employee scores {}", e.to_string());
                ServiceError::InternalServerError
            })

        }
        Err(_e) => {
            Err(ServiceError::InternalServerError)
        }
    })
}

struct PerformanceData {
    pub first_name: String,
    pub last_name: String,
    pub title: Option<String>,
    pub score: f64,
    pub replaceability_score: Option<f64>,
    pub review_scores: Vec<ProjectReviewScore>
}

pub async fn get_performance_summary(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let organization_id = current_user.organization_id.clone();
    let user_id = current_user.id.clone();

    web::block({let db_clone = db.clone(); move || fetch_summary_data(db_clone, organization_id, user_id)})
    .await
    .map(|result| match result {
        Ok(data) => {
            let all_review_scores: Vec<ProjectReviewScore> = vec![];
            if data.len() < 1 {
                warn!("Got no review scores back for user");
                return HttpResponse::NoContent().finish();
            }
            let (user, _prs_opt, es_opt) = &data[0];
            let mut performance_data = PerformanceData { 
                first_name: user.first_name.clone(),
                last_name: user.last_name.clone(),
                title: user.title.clone(),
                score: es_opt.as_ref().map_or(5.0, |es| es.score),
                replaceability_score: es_opt.as_ref().map_or(None, |es| es.replaceability_score),
                review_scores: all_review_scores
            };
            
            for (_, review_score_opt, _ ) in data.iter() {
                if review_score_opt.is_some() {
                    performance_data.review_scores.push(review_score_opt.as_ref().unwrap().clone());
                }
            }

            let review_summaries = calculate_summary(&performance_data.review_scores);
            let performance_summary = PerformanceSummary {
                user_id: user.id.clone(),
                first_name: performance_data.first_name,
                last_name: performance_data.last_name,
                title: performance_data.title,
                employee_score: performance_data.score,
                replaceability_score: performance_data.replaceability_score,
                review_summaries,
            };
            HttpResponse::Ok().json(performance_summary)
        }
        Err(e) => {
            error!("Error getting direct report summary {}", e);
            HttpResponse::InternalServerError().finish()
        }
    })
    .map_err(|e| {
        error!("Blocking error getting performance data {}", e);
        ServiceError::InternalServerError
    })

}

pub async fn get_direct_report_summary(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let organization_id = current_user.organization_id.clone();
    let user_id = current_user.id.clone();

    web::block({let db_clone = db.clone(); move || fetch_direct_report_summary_data(db_clone, organization_id, user_id)})
    .await
    .map(|result| match result {
        Ok(performance_data) => {
            let mut scores_by_employee = HashMap::<String, PerformanceData>::new();
            
            // Group together reviews by user.
            for (user, review_scores_opt, employee_score_opt) in performance_data.iter() {
                // If the employee score is none then that means either there are no review scores or 
                // the employee score has not been updated yet. Either way we should just skip
                if employee_score_opt.is_none() {
                    continue;
                }

                if scores_by_employee.contains_key(&user.id) {
                    scores_by_employee
                    .get_mut(&user.id)
                    .unwrap()
                    .review_scores
                    .push(review_scores_opt.as_ref().unwrap().clone());
                } else {
                    scores_by_employee.insert(user.id.clone(), PerformanceData{
                        first_name: user.first_name.clone(),
                        last_name: user.last_name.clone(),
                        title: user.title.clone(),
                        score: employee_score_opt.as_ref().unwrap().score,
                        replaceability_score: employee_score_opt.as_ref().unwrap().replaceability_score,
                        review_scores: vec![review_scores_opt.as_ref().unwrap().clone()]
                    });
                }
            }

            let performance_summaries: Vec<PerformanceSummary> = scores_by_employee.iter().map(|(user_id, performance_data)| {
                let review_summaries = calculate_summary(&performance_data.review_scores);
                return PerformanceSummary {
                    user_id: user_id.clone(),
                    first_name: performance_data.first_name.clone(),
                    last_name: performance_data.last_name.clone(),
                    title: performance_data.title.clone(),
                    employee_score: performance_data.score,
                    replaceability_score: performance_data.replaceability_score,
                    review_summaries
                }
            }).collect();
            HttpResponse::Ok().json(performance_summaries)
        }
        Err(e) => {
            error!("Error getting direct report summary {}", e);
            HttpResponse::InternalServerError().finish()
        }
    })
    .map_err(|e| {
        error!("Blocking error getting direct report summar {}", e);
        ServiceError::InternalServerError
    })
}

fn get_project_size_weight(project_size: &i32) -> f64 {
    match project_size {
        1 => { EXISTENTIAL_WEIGHT }
        2 => { LARGE_WEIGHT }
        3 => { MEDIUM_WEIGHT }
        4 => { SMALL_WEIGHT }
        _ => {
            error!("Unexpected project size {}", project_size);
            0.0
        }
    }
}

fn calculate_summary(
    review_scores: &Vec<ProjectReviewScore>
) -> Vec<ProjectSizeReviewSummary> {
    let mut all_weighted_total = 0.0;
    
    let mut scores_by_size = HashMap::<i32, Vec<ProjectReviewScore>>::new();

    // Group the reviews for a user together by size.
    for rs in review_scores.iter() {
        all_weighted_total += rs.score * get_project_size_weight(&rs.project_size);
        if scores_by_size.contains_key(&rs.project_size) {
            scores_by_size.get_mut(&rs.project_size).unwrap().push(rs.clone())
        } else {
            scores_by_size.insert(rs.project_size, vec![rs.clone()]);
        }
    }

    let size_review_summaries: Vec<ProjectSizeReviewSummary> = scores_by_size.iter().map(|(size, rs)| {
        let mut review_scores = rs.clone();
        review_scores.sort_by(|a,b| b.created_at.cmp(&a.created_at));
        let mut size_total = 0.0;
        let review_summaries: Vec<ReviewSummary> =  review_scores.iter().map(|review_score| {
            let weighted_score = review_score.score * get_project_size_weight(size);
            size_total += weighted_score;
            ReviewSummary {
                review_id: review_score.employee_review_id.clone(),
                employee_score_impact: (weighted_score / all_weighted_total).round_two(),
                score: (review_score.score).round_two(),
                submitted_at: review_score.created_at
            }
        }).collect();

        ProjectSizeReviewSummary {
            project_size: *size,
            average_score: (size_total / (review_scores.len() as f64) / get_project_size_weight(size)).round_two(),
            employee_score_impact: (size_total / all_weighted_total).round_two(),
            recent_reviews: review_summaries
        }
    }).collect();
    size_review_summaries
}

fn calculate_employee_score(
    review_scores: &Vec<&ProjectReviewScore>, 
) -> f64 {
    let mut score_sum = 0.0;
    let mut weight_sum = 0.0;

    for rs in review_scores {
        match rs.project_size {
            1 => {
                score_sum += rs.score * EXISTENTIAL_WEIGHT;
                weight_sum += EXISTENTIAL_WEIGHT;
            }
            2 => {
                score_sum += rs.score * LARGE_WEIGHT;
                weight_sum += LARGE_WEIGHT;
            }
            3 => {
                score_sum += rs.score * MEDIUM_WEIGHT;
                weight_sum += MEDIUM_WEIGHT;
            }
            4 => {
                score_sum += rs.score * SMALL_WEIGHT;
                weight_sum += SMALL_WEIGHT;
            }
            _ => {
                error!("Unexpected project size {}", rs.project_size);
            }
        }
    }

    // Return number rounded to nearest one-hundreths 
    (score_sum / weight_sum).round_two()
}

fn calculate_replaceability_score(reviews: &Vec<&ProjectReview>) -> f64 {
    let mut project_reviews = reviews.clone();
    project_reviews.sort_by(|a,b| b.submitted_at.cmp(&a.submitted_at));

    let mut recent_count = 0;
    let mut recent_weight = 0.0;
    let mut recent_total = 0.0;
    let mut total_weight = 0.0;
    let mut total = 0.0;

    for review in project_reviews.iter() {
        let r_score_opt: Option<f64> = match review.responses.get("employeeSubstituteScore") {
            Some(&serde_json::Value::Number(ref s)) => {
                s.as_f64()
            }
            _ => {
                None
            }
        };

        r_score_opt.map(|r_score| {
            let diff = Utc::now().signed_duration_since(review.submitted_at.unwrap_or_default().and_utc()).num_days();
            let days_in_a_year = 365;
            let weight = get_project_size_weight(&review.project_size);
            if diff < days_in_a_year && recent_count < 5 {
                recent_count += 1;
                recent_weight += weight;
                recent_total += weight * r_score;
            }

            total_weight += weight;
            total += weight * r_score;
        });

    }
    (total / total_weight) + (recent_total / recent_weight)
}

fn fetch_unscored_completed_reviews(
    db: web::Data<Pool>,
) -> Result<Vec<ProjectReview>, diesel::result::Error> {
    let mut conn = db.get().unwrap();

    let sql_query_str = "
        WITH completed_reviews AS (
            SELECT * 
            FROM project_reviews
            WHERE original_review_id IS NOT NULL
            AND submitted_at IS NOT NULL
        )
        SELECT *
        FROM completed_reviews cr
        LEFT JOIN project_review_scores prs
        ON (cr.id = manager_review_id
            or cr.id = employee_review_id)
        WHERE prs.employee_review_id IS NULL;
    ".to_string();

    diesel::sql_query(sql_query_str).load::<ProjectReview>(&mut conn)
}


fn fetch_employee_review_scores(
    db: web::Data<Pool>
) -> Result<Vec<(ProjectReviewScore, Option<ProjectReview>, Option<ProjectReview>)>, diesel::result::Error> {
    use crate::schema::project_reviews as schema_reviews;

    let mut conn = db.get().unwrap();
    let (reviews1, reviews2) = diesel::alias!(schema_reviews as reviews1, schema_reviews as reviews2);

    rs_dsl::project_review_scores
    // could not figure out how to get an inner join to work here.
    .left_join(reviews1.on(rs_dsl::employee_review_id.eq(reviews1.field(review_dsl::id))))
    .left_join(reviews2.on(rs_dsl::manager_review_id.eq(reviews2.field(review_dsl::id))))
    .get_results(&mut conn)
}


fn insert_review_score(
    db: &web::Data<Pool>,
    item: InsertProjectReviewScore<'_>,
) -> Result<ProjectReviewScore, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    let res = insert_into(rs_dsl::project_review_scores).values(&item).get_result(&mut conn);
    res
}

fn upsert_employee_scores(
    db: &web::Data<Pool>,
    scores: Vec<InsertEmployeeScore>
) -> Result<Vec<EmployeeScore>, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    let res = insert_into(es_dsl::employee_scores)
    .values(&scores)
    .on_conflict(on_constraint("employee_scores_pkey"))
    .do_update()
    .set((
        es_dsl::score.eq(excluded(es_dsl::score)), 
        es_dsl::replaceability_score.eq(excluded(es_dsl::replaceability_score))
    ))
    .get_results(&mut conn);
    res
}

fn fetch_summary_data(
    db: web::Data<Pool>,
    organization_id: String,
    user_id: String
) -> Result<Vec<(User, Option<ProjectReviewScore>, Option<EmployeeScore>)>, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    users_dsl::users
    .filter(users_dsl::organization_id.eq(organization_id.clone()))
    .filter(users_dsl::id.eq(user_id))
    .left_join(rs_dsl::project_review_scores.on(
        rs_dsl::organization_id.eq(organization_id.clone())
        .and(users_dsl::id.eq(rs_dsl::user_id))
    ))
    .left_join(es_dsl::employee_scores.on(
        users_dsl::id.eq(es_dsl::employee_id)
        .and(es_dsl::organization_id.eq(organization_id))
    ))
    .get_results(&mut conn)
}


fn fetch_direct_report_summary_data(
    db: web::Data<Pool>,
    organization_id: String,
    user_id: String
) -> Result<Vec<(User, Option<ProjectReviewScore>, Option<EmployeeScore>)>, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    users_dsl::users
    .filter(users_dsl::organization_id.eq(organization_id.clone()))
    .filter(users_dsl::manager_id.eq(user_id))
    .left_join(rs_dsl::project_review_scores.on(
        rs_dsl::organization_id.eq(organization_id.clone())
        .and(users_dsl::id.eq(rs_dsl::user_id))
    ))
    .left_join(es_dsl::employee_scores.on(
        users_dsl::id.eq(es_dsl::employee_id)
        .and(es_dsl::organization_id.eq(organization_id))
    ))
    .get_results(&mut conn)
}






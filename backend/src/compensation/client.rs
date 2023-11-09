use actix_web::{Responder, web, HttpResponse};
use aws_sdk_s3::operation::get_object::GetObjectOutput;
use csv::StringRecord;
use crate::errors::ServiceError;
use crate::schema::compensation::dsl as comp_dsl;
use crate::schema::paybands::dsl as paybands_dsl;
use crate::schema::users::dsl as users_dsl;
use crate::schema::employee_scores::dsl as es_dsl;
use crate::auth::Claims;
use crate::diesel::QueryDsl;
use crate::diesel::RunQueryDsl;
use crate::diesel::BoolExpressionMethods;
use crate::diesel::ExpressionMethods;
use convert_case::{Case, Casing};
use diesel::{insert_into, SelectableHelper};
use log::{error, info};
use crate::user;
use crate::compensation;
use crate::errors::FileProcessingError;
use crate::scoring::models::EmployeeScore;
use crate::user::models::*;
use crate::diesel::JoinOnDsl;
use statrs::distribution::ContinuousCDF;
use super::models::BudgetData;
use super::models::{InsertCompensation, Compensation, Payband, InsertPayband, CompensationResponse};
use super::super::Pool;
use crate::diesel::PgExpressionMethods;
use diesel::sql_types::{Nullable, Text};


pub async fn get_compensation(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let organization_id = current_user.organization_id.clone();

    web::block(move || fetch_compensation_for_org(db, organization_id))
    .await
    .map(|result| match result {
        Ok(org_compensation) => {
            HttpResponse::Ok().json(org_compensation)
        }
        Err(err) => {
            HttpResponse::InternalServerError().json(err.to_string())
        }
    })
    .map_err(|err| {
        error!("Error getting compensation for org {}", err);
        ServiceError::InternalServerError
    })
}

pub async fn get_compensation_by_user_id(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let organization_id = current_user.organization_id.clone();
    let user_id = current_user.id.clone();

    web::block(move || get_comp_data_for_user(&db, &user_id, &organization_id))
    .await
    .map(|result| match result {
        Ok((compensation, payband_opt)) => {
            let percentile = match &payband_opt {
                Some(pb) => {
                    let sd = (((pb.mid - pb.low) as f64 / 0.675) + ((pb.high - pb.mid) as f64 / 0.675)) / 2.0;
                    match statrs::distribution::Normal::new(pb.mid as f64, sd) {
                        Ok(norm) => {
                            Some(norm.cdf(compensation.base_pay as f64))
                        }
                        Err(e) => {
                            error!("Error getting normal function: {}", e);
                            None
                        }
                    }
                }
                None => {
                    None
                }
            };
            let comp = CompensationResponse {
                user_id: compensation.user_id.clone(),
                organization_id: compensation.organization_id.clone(),
                base_pay: (compensation.base_pay as f64) / 100.0,
                payband: payband_opt,
                percentile,
                variable_pay: compensation.variable_pay.map(|vp| (vp as f64) / 100.0),
                target_commissions: compensation.target_commissions.map(|tc| (tc as f64) / 100.0),
                created_at: compensation.created_at,
                updated_at: compensation.updated_at
            };
            HttpResponse::Ok().json(comp)
        }
        Err(diesel::result::Error::NotFound) => {
            HttpResponse::NotFound().finish()
        }
        Err(err) => {
            error!("Error get compensation for user {}", err);
            HttpResponse::InternalServerError().json(err.to_string())
        }
    })
    .map_err(|err| {
        error!("Error getting compensation by title {}", err);
        ServiceError::InternalServerError
    })
}

pub fn get_comp_data_for_user (
    db: &web::Data<Pool>,
    user_id: &str,
    organization_id: &str
) -> Result<(Compensation, Option<Payband>), diesel::result::Error> {
    let compensation = fetch_compensation_by_user_id(db, user_id, organization_id)?;
    match fetch_paybands_for_user(db, organization_id, user_id) {
        Ok(paybands) => {
            Ok((compensation, Some(paybands[0].clone())))
        }
        Err(e) => {
            error!("Error getting paybands for user: {}", e);
            Ok((compensation, None))
        }
    }
}

pub async fn get_paybands(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let organization_id = current_user.organization_id.clone();
    let user_id = current_user.id.clone();

    web::block(move || fetch_paybands_for_user(&db, &organization_id, &user_id))
    .await
    .map(|result| match result {
        Ok(paybands) => {
            // Eventually we will have multiple paybands per title (based on level, location etc)
            HttpResponse::Ok().json(paybands)
        }
        Err(err) => {
            HttpResponse::InternalServerError().json(err.to_string())
        }
    })
    .map_err(|err| {
        error!("Error getting paybands for org {}", err);
        ServiceError::InternalServerError
    })
}

pub async fn get_paybands_by_title(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
    path: web::Path<String>
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let organization_id = current_user.organization_id.clone();
    let title = path.into_inner();

    web::block(move || fetch_paybands_by_title(&db, &title, &organization_id))
    .await
    .map(|result| match result {
        Ok(org_compensation) => {
            HttpResponse::Ok().json(org_compensation)
        }
        Err(err) => {
            HttpResponse::InternalServerError().json(err.to_string())
        }
    })
    .map_err(|err| {
        error!("Error getting paybands by title {}", err);
        ServiceError::InternalServerError
    })
}

pub async fn get_budget_data(
    db: web::Data<Pool>,
    current_user_option: Option<web::ReqData<CurrentUser>>,
) -> impl Responder {
    let current_user = current_user_option.ok_or(ServiceError::BadRequest("current user not found".to_string()))?;
    let organization_id = current_user.organization_id.clone();
    // TODO: Replace with enums
    if current_user.role != UserRole::Admin && current_user.role != UserRole::SystemAdmin {
        error!("Only admins {}", current_user.role);
        return Ok(HttpResponse::Forbidden().finish());
    }

    web::block(move || fetch_budget_data(&db, organization_id))
    .await
    .map(|result| match result {
        Ok(data) => {
            let resp: Vec<BudgetData> = data.iter().map(|(user, manager_opt, comp_opt, score_opt)| {
                let (base_pay, target_commissions, variable_pay) = comp_opt.as_ref().map_or((None, None, None), |c| {
                    (
                        Some((c.base_pay as f64) / 100.0),
                        (c.target_commissions.map(|tc| (tc as f64) / 100.0)),
                        (c.variable_pay.map(|vp| (vp as f64) / 100.0))
                    )

                });
                return BudgetData {
                    email: user.email.clone(),
                    first_name: user.first_name.clone(),
                    last_name: user.last_name.clone(),
                    manager_name: manager_opt.as_ref().map(|m| format!("{} {}", m.first_name, m.last_name)),
                    base_pay,
                    target_commissions,
                    variable_pay,
                    score: score_opt.as_ref().map_or(0.0, |s| s.score),
                    replaceability_score: score_opt.as_ref().map_or(None, |s| s.replaceability_score)
                };
            }).collect();
            HttpResponse::Ok().json(resp)
        }
        Err(err) => {
            error!("Error getting budget data {}", err);
            HttpResponse::InternalServerError().json(err.to_string())
        }
    })
    .map_err(|err| {
        error!("Error getting budget data {}", err);
        ServiceError::InternalServerError
    })
}

fn fetch_compensation_for_org(
    pool: web::Data<Pool>,
    organization_id: String
) -> Result<Vec<Compensation>, diesel::result::Error> {
    let mut conn = pool.get().unwrap();
    comp_dsl::compensation.filter(comp_dsl::organization_id.eq(organization_id)).load::<Compensation>(&mut conn)
}

fn fetch_compensation_by_user_id(
    pool: &web::Data<Pool>,
    user_id: &str,
    organization_id: &str
) -> Result<Compensation, diesel::result::Error> {
    let mut conn = pool.get().unwrap();
    comp_dsl::compensation
        .filter(
            comp_dsl::user_id.eq(user_id)
            .and(comp_dsl::organization_id.eq(organization_id))
        )
        .select(Compensation::as_select())
        .first::<Compensation>(&mut conn)
}

fn insert_compensation(
    db: web::Data<Pool>,
    item: InsertCompensation<'_>
) -> Result<Compensation, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    insert_into(comp_dsl::compensation).values(&item).get_result(&mut conn)
}

fn fetch_paybands_for_user(
    db: &web::Data<Pool>,
    organization_id: &str,
    user_id: &str
) -> Result<Vec<Payband>, diesel::result::Error> {
    let _conn = db.get().unwrap();
    let user = user::client::fetch_user_by_id(db, organization_id, user_id)?;
    if user.title.is_none() {
        error!("User has not title to look up payband");
        return Err(diesel::NotFound);
    }
    fetch_paybands_by_title(db, user.title.as_ref().unwrap(), organization_id)
}

fn fetch_paybands_by_title(
    pool: &web::Data<Pool>,
    title: &str,
    organization_id: &str
) -> Result<Vec<Payband>, diesel::result::Error> {
    let mut conn = pool.get().unwrap();
    paybands_dsl::paybands
        .filter(
            paybands_dsl::title.eq(title)
            .and(paybands_dsl::organization_id.eq(organization_id))
        )
        .load::<Payband>(&mut conn)
}

fn insert_paybands(
    db: web::Data<Pool>,
    item: InsertPayband<'_>
) -> Result<Payband, diesel::result::Error> {
    let mut conn = db.get().unwrap();
    insert_into(paybands_dsl::paybands).values(&item).get_result(&mut conn)
}

fn fetch_budget_data(
    db: &web::Data<Pool>,
    organization_id: String
) -> Result<Vec<(User, Option<User>, Option<Compensation>, Option<EmployeeScore>)>, diesel::result::Error> {
    use crate::schema::users as schema_users;
    sql_function! { fn coalesce(x: Nullable<Text>, y: Text) -> Text; };
    let mut conn: diesel::r2d2::PooledConnection<diesel::r2d2::ConnectionManager<diesel::PgConnection>> = db.get().unwrap();
    let (users1, users2) = diesel::alias!(schema_users as user1, schema_users as user2);
    users1
    .filter(users1.field(users_dsl::organization_id).eq(organization_id.clone()))
    .left_join(users2.on(users2.field(users_dsl::id).is_not_distinct_from(coalesce(users1.field(users_dsl::manager_id), "" ))))
    .left_join(comp_dsl::compensation.on(
        comp_dsl::organization_id.eq(organization_id.clone())
        .and(users1.field(users_dsl::id).eq(comp_dsl::user_id))
    ))
    .left_join(es_dsl::employee_scores.on(
        users1.field(users_dsl::id).eq(es_dsl::employee_id)
        .and(es_dsl::organization_id.eq(organization_id))
    ))
    .get_results(&mut conn)
}

#[derive(serde::Deserialize, serde::Serialize, std::fmt::Debug)]
pub struct Row {
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub base_pay: String,
    pub variable_pay: Option<String>,
    pub target_commissions: Option<String>,
    pub low: Option<String>,
    pub mid: Option<String>,
    pub high: Option<String>,
    pub title: Option<String>
}

pub async fn parse_file_upload(
    db: &web::Data<Pool>,
    output: GetObjectOutput,
    organization_id: &str,
) -> Result<Result<i32, csv::Error>, ServiceError> {

    let _contents = output.body.collect().await
        .map(|a| {
            let bytes = a.into_bytes();
            let t = std::str::from_utf8(&bytes).expect("std::fmt::Error");
            let mut rdr = csv::Reader::from_reader(t.as_bytes());
            let file_headers = rdr.headers()?;
            let normalized_headers = normalize_headers(file_headers);
            rdr.set_headers(normalized_headers);
            // println!("The headers {:?}", file_headers);
            let iter: csv::DeserializeRecordsIter<'_, &[u8], Row> = rdr.deserialize();
            let mut count = 1;
            for line in iter {
                match line {
                    Ok(row) => {
                        match process_row(&db, row, organization_id) {
                            Ok(_) => {
                                info!("Processed row {}", count);
                            }
                            Err(e) => {
                                error!("Something went wrong with row {}: {}", count, e.to_string());
                            }
                        }
                    }
                    Err(err) => {
                        println!("erred breh {}", err.to_string())
                    }
                }
                count += 1;
            }
            Ok::<i32, csv::Error>(1)
        })
        .map_err(|_err| ServiceError::InternalServerError);
    Ok(Ok(1))
}

fn normalize_headers(sr: &StringRecord) -> StringRecord {
    let mut res = StringRecord::new();
    for f in sr.iter() {
        res.push_field(f.to_case(Case::Snake).as_str());
    }
    res
}

#[allow(dead_code)]
struct ProcessedRow {
    pub compensation: Compensation,
    pub payband: Option<Payband>
}

fn convert_currency_str(currency_str: String) -> i32 {
    let as_float: f64 = currency_str
    .replace("$", "")
    .replace(",", "")
    .trim().parse::<f64>().unwrap() * 100.0;

    as_float.trunc() as i32
}

fn process_row(
    db: &web::Data<Pool>,
    row: Row,
    organization_id: &str
) -> Result<ProcessedRow, FileProcessingError> {
    let usr = user::client::fetch_user_by_email(db, row.email)
    .map_err(|_e| FileProcessingError::EmailNotFoundError)?;

    let vp = row.variable_pay.map(|vp| convert_currency_str(vp));
    let tc = row.target_commissions.map(|tc| convert_currency_str(tc)); 
    let insert_compensation = InsertCompensation {
        user_id: &usr.id,
        organization_id,
        base_pay: &convert_currency_str(row.base_pay),
        variable_pay: vp.as_ref(),
        target_commissions: tc.as_ref()
    };

    let compensation = compensation::client::insert_compensation(db.clone(), insert_compensation)
    .map_err(|e| FileProcessingError::InsertError(e.to_string()))?;

    if row.high.is_some() && row.mid.is_some() && row.low.is_some() && row.title.is_some() {
        let insert_payband = InsertPayband {
            organization_id,
            title: &row.title.unwrap_or_default(),
            high: &convert_currency_str(row.high.unwrap_or_default()),
            mid: &convert_currency_str(row.mid.unwrap_or_default()),
            low: &convert_currency_str(row.low.unwrap_or_default())
        };

        let payband = compensation::client::insert_paybands(db.clone(), insert_payband)
        .map_err(|e| FileProcessingError::InsertError(e.to_string()))?;

        return Ok(ProcessedRow {
            compensation, 
            payband: Some(payband) 
        });
    }
    
    return Ok(ProcessedRow { 
        compensation,
        payband: None 
    })
}


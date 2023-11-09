// use super::models::{TenantDetails, NewTenantDetails};
// use super::schema::tenant_details::dsl::*;
// use super::Pool;
// use crate::diesel::QueryDsl;
// use crate::diesel::RunQueryDsl;
// use actix_web::{web, Error, HttpResponse, ResponseError, Responder};
// use diesel::dsl::{delete, insert_into};
// use serde::{Deserialize, Serialize};
// use std::vec::Vec;
// use uuid::Uuid;

// #[derive(Debug, Serialize, Deserialize)]
// pub struct InputTenant {
//     pub first_name: String,
//     pub last_name: String,
//     pub email: String,
// }

// pub async fn get_tenants(db: web::Data<Pool>) -> impl Responder {
//     web::block(move || get_all_tenants(db))
//         .await
//         .map(|tenants| HttpResponse::Ok().json(tenants.ok().unwrap()))
//         .map_err(|err| err)
// }

// pub async fn add_tenant(
//     db: web::Data<Pool>,
//     item: web::Json<InputTenantDetails>,
// ) -> impl Responder {
//     web::block(move || insert_tenant(db, item))
//         .await
//         .map(|td| HttpResponse::Created().json(td.ok().unwrap()))
//         .map_err(|err| err)
// }

// fn get_all_tenants(pool: web::Data<Pool>) -> Result<Vec<TenantDetails>, diesel::result::Error> {

//     let mut conn = pool.get().unwrap();
//     let items = tenant_details.load::<TenantDetails>(&mut conn);
//     items
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct InputTenantDetails {
//     pub tenant_name: String,
// }

// fn insert_tenant(
//     db: web::Data<Pool>,
//     item: web::Json<InputTenantDetails>,
// ) -> Result<TenantDetails, diesel::result::Error> {
//     let mut conn = db.get().unwrap();
//     let new_tenant = NewTenantDetails {
//         tenant_id: &Uuid::new_v4().to_string(),
//         tenant_name: &item.tenant_name,
//     };
//     let res = insert_into(tenant_details).values(&new_tenant).get_result(&mut conn);
//     res
// }


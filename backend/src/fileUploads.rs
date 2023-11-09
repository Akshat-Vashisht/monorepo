use actix_web::{web, Responder, HttpResponse};
use log::{error };
use chrono::{Datelike, Utc};
use crate::errors::ServiceError;
use crate::auth::Claims;
use aws_sdk_s3::operation::put_object::PutObjectInput;
use aws_sdk_s3::presigning::PresigningConfig;
use std::time::Duration;

pub async fn get_org_upload_url(
    user_claims_option: Option<web::ReqData<Claims>>,
) -> impl Responder {
    let user_claims = user_claims_option.ok_or(ServiceError::BadRequest("User claims not found".to_string()))?;
    let organization_id = user_claims.organization_id.clone();
    let bucket = "pago-org-data-staging".to_string();
    let expires_in = Duration::new(60*10, 0);
    let cur_time = Utc::now();
    let time_str = format!("{}{}{}", cur_time.year(), cur_time.month(), cur_time.day());
    let file_name = format!("{}_org_{}", organization_id, time_str);
    let config = ::aws_config::load_from_env().await;
    let client = aws_sdk_s3::Client::new(&config);


    // Presigned requests can be made with the client directly
    client
        .put_object()
        .bucket(&bucket)
        .key(&file_name)
        .presigned(PresigningConfig::expires_in(expires_in).unwrap())
        .await
        .map_err(|e| {
            error!("Error creating presigned url: {}", e);
            ServiceError::InternalServerError
        })
        .map(|r| {
            HttpResponse::Ok().json(format!("{:?}", r.uri()))
        })
}


pub async fn get_comp_upload_url(
    user_claims_option: Option<web::ReqData<Claims>>,
) -> impl Responder {
    let user_claims = user_claims_option.ok_or(ServiceError::BadRequest("User claims not found".to_string()))?;
    let organization_id = user_claims.organization_id.clone();
    let bucket = "pago-comp-data-staging".to_string();
    let expires_in = Duration::new(60*10, 0);
    let cur_time = Utc::now();
    let time_str = format!("{}{}{}", cur_time.year(), cur_time.month(), cur_time.day());
    let file_name = format!("{}_comp_{}", organization_id, time_str);
    let config = ::aws_config::load_from_env().await;
    let client = aws_sdk_s3::Client::new(&config);


    // Presigned requests can be made with the client directly
    client
        .put_object()
        .bucket(&bucket)
        .key(&file_name)
        .presigned(PresigningConfig::expires_in(expires_in).unwrap())
        .await
        .map_err(|e| {
            error!("Error creating presigned url: {}", e);
            ServiceError::InternalServerError
        })
        .map(|r| {
            HttpResponse::Ok().json(format!("{:?}", r.uri()))
        })
}

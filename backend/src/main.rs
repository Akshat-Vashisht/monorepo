#[macro_use]
extern crate diesel;

use actix_web::cookie::Cookie;
use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager};

use std::env;

mod auth;
mod errors;
mod schema;
mod organizations;
mod user;
mod reviews;
mod scoring;
mod goals;
mod compensation;
#[allow(non_snake_case)]
mod snsSubscriber;
mod fileUploads;

use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder, dev::ServiceRequest, Error};
use actix_web_httpauth::middleware::HttpAuthentication;
use actix_web_httpauth::extractors::bearer::{BearerAuth, Config};
use actix_web_httpauth::extractors::AuthenticationError;
use actix_web::{HttpMessage};
use actix_web::middleware::Logger;
use actix_cors::Cors;
use crate::auth::Claims;
use env_logger;
use crate::web::Data;
use crate::r2d2::PooledConnection;
use log::error;

pub type Pool = r2d2::Pool<ConnectionManager<PgConnection>>;
// use serde::{Deserialize, Serialize};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!();
use crate::user::models::UserRole;


fn run_migrations(connection: &mut PooledConnection<ConnectionManager<diesel::PgConnection>>) -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {

    // This will run the necessary migrations.
    //
    // See the documentation for `MigrationHarness` for
    // all available methods.
    connection.run_pending_migrations(MIGRATIONS)?;

    Ok(())
}

#[get("/tenant/registration")]
async fn register_tenant(claims: Option<web::ReqData<Claims>>) -> impl Responder {
    // TODO: Implement the logic of the register_tenant lambda function here.
    print!("{}", claims.unwrap().sub);
    HttpResponse::Ok().body("Tenant registration endpoint")
}

#[post("/user")]
async fn create_user() -> impl Responder {
    // TODO: Implement the logic of the create_user lambda function here.
    HttpResponse::Ok().body("Create user endpoint")
}

async fn validator(
    req: ServiceRequest,
    credentials: BearerAuth
) -> Result<ServiceRequest, (Error, ServiceRequest)> {
    let config = req.app_data::<Config>()
    .cloned()
    .unwrap_or_default()
    .scope("defaultscopes");

    let db = req.app_data::<Data<Pool>>()
    .cloned()
    .unwrap();

    let masquerade_cookie_opt = req.cookie("masquerade_user_id");

    match auth::validate_token(credentials.token()).await {
        Ok(claims) => {
            req.extensions_mut().insert(claims.clone());
            let current_user = user::models::CurrentUser {
                id: claims.sub,
                first_name: claims.given_name,
                last_name: claims.family_name,
                email: claims.email,
                organization_id: claims.organization_id,
                role: claims.role.into(),
                masquerading_user_id: None
            };

            match masquerade_cookie_opt {
                Some(cookie) => {
                    if current_user.role != UserRole::Admin && current_user.role != UserRole::SystemAdmin {
                        error!("Only admins can masquerade: {}", current_user.role);
                        req.extensions_mut().insert(current_user);
                        return Ok(req);
                    }

                    match user::client::get_user_by_id(db, &current_user.organization_id.clone(), cookie.value()).await {
                        Ok(user) => {
                            let masquerade_user = user::models::CurrentUser {
                                id:user.id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                email: user.email,
                                organization_id: current_user.organization_id,
                                role: user.role.into(),
                                masquerading_user_id: Some(current_user.id)
                            };

                            req.extensions_mut().insert(masquerade_user);
                            Ok(req)
                        }
                        Err(e) => {
                            error!("Error getting masquerade user: {}", e);
                            req.extensions_mut().insert(current_user);
                            Ok(req)
                        }
                    }
                }
                None => {
                    req.extensions_mut().insert(current_user);
                    Ok(req)
                }
            }
        }
        Err(_) => Err((AuthenticationError::from(config).into(), req)),
    }
}

async fn healthcheck() -> impl Responder {
    HttpResponse::Ok().json("Healthy")
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();    
    std::env::set_var("RUST_LOG", "actix_web=debug");
    std::env::set_var("RUST_LOG", "debug");
    env_logger::init();
    let database_url: String = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let manager = ConnectionManager::<PgConnection>::new(database_url);
    let pool: Pool = r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create pool.");

    let _ = run_migrations(pool.get().as_mut().unwrap()).map_err(|e| {
        error!("Error running migrations: {}", e);
        std::io::Error::new(std::io::ErrorKind::ConnectionRefused, "Error running migrations")
    })?;

    HttpServer::new(move || {
        let auth = HttpAuthentication::bearer(validator);

        let config = web::scope("/config")
            .route("/{subdomain}", web::get().to(organizations::client::get_org_config));

        let users_service = web::scope("/users")
            .wrap(auth.clone())
            .route("", web::post().to(user::client::add_user))
            .route("/{user_id}", web::post().to(user::client::update_user))
            .route("/{user_id}/masquerade", web::post().to(user::client::masquerade_user))
            .route("", web::get().to(user::client::get_all_users));

        let orgs = web::scope("/tenants")
            .wrap(auth.clone())
            .route("", web::get().to(organizations::client::get_organizations))
            .route("", web::post().to(organizations::client::add_organization))
            .route("/upload_url", web::get().to(fileUploads::get_org_upload_url))
            .route("/{organization_id}", web::get().to(organizations::client::get_organization));
        
        let reviews_service = web::scope("/reviews")
            .wrap(auth.clone())
            .route("", web::get().to(reviews::client::get_all_reviews_for_user))
            .route("", web::post().to(reviews::client::add_review))
            .route("/{review_id}", web::get().to(reviews::client::get_review_by_id))
            .route("/{review_id}", web::post().to(reviews::client::add_manager_responses));
        
        let scoring_service = web::scope("/scoring")
            .wrap(auth.clone())
            .route("/employee", web::post().to(scoring::client::update_employee_scores))
            .route("/reviews", web::post().to(scoring::client::add_score_for_completed_reviews))
            .route("/summary/reports", web::get().to(scoring::client::get_direct_report_summary))
            .route("/summary", web::get().to(scoring::client::get_performance_summary));
        
        let goals_service = web::scope("/goals")
            .wrap(auth.clone())
            .route("", web::get().to(goals::client::get_goals))
            .route("", web::post().to(goals::client::add_goal))
            .route("/{goal_id}", web::get().to(goals::client::get_goal_by_id));
        
        let compensation_service = web::scope("/compensation")
            .wrap(auth.clone())
            .route("/budget", web::get().to(compensation::client::get_budget_data))
            .route("/paybands", web::get().to(compensation::client::get_paybands))
            .route("/paybands/{title}", web::get().to(compensation::client::get_paybands_by_title))
            .route("", web::get().to(compensation::client::get_compensation_by_user_id))
            .route("/upload_url", web::get().to(fileUploads::get_org_upload_url))
            .route("/{user_id}", web::get().to(compensation::client::get_compensation_by_user_id));

        let sns_topic_handler = web::scope("/sns_topic")
            .route("", web::post().to(snsSubscriber::topic_function));
        
        App::new()
            .wrap(Cors::permissive())
            .wrap(Logger::default())
            .app_data(Data::new(pool.clone()))
            .route("/health", web::get().to(healthcheck))
                .service(config)
                .service(users_service)
                .service(orgs)
                .service(reviews_service)
                .service(scoring_service)
                .service(goals_service)
                .service(compensation_service)
                .service(sns_topic_handler)
    })
    .bind(env::var("SERVER_URL").unwrap_or_else(|_| "0.0.0.0:8000".to_string()))?
    .run()
    .await
}

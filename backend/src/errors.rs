use actix_web::{error::ResponseError, HttpResponse};
use actix_web_httpauth::{extractors::AuthenticationError};
use derive_more::Display;
use serde::ser::StdError;
use aws_sdk_cognitoidentityprovider::error::SdkError;
use aws_sdk_cognitoidentityprovider::operation::create_user_pool_client::{CreateUserPoolClientError};
use aws_sdk_cognitoidentityprovider::operation::admin_create_user::{AdminCreateUserError};
use std::env::VarError;

#[derive(Debug, Display)]
pub struct AuthError(AuthenticationError<actix_web_httpauth::headers::www_authenticate::bearer::Bearer>);

impl ResponseError for AuthError {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::InternalServerError().json("Could not fetch JWKS")
    }
}

#[derive(Debug, Display)] 
pub enum FileProcessingError {
    #[display(fmt = "Email not found error")]
    EmailNotFoundError,

    #[display(fmt = "Parsing error: {}", _0)]
    ParseError(String),

    #[display(fmt = "Error saving to db: {}", _0)]
    InsertError(String),
}

#[derive(Debug, Display)]
pub enum ServiceError {
    #[display(fmt = "Internal Server Error")]
    InternalServerError,

    #[display(fmt = "Not found error")]
    NotFoundError,

    #[display(fmt = "BadRequest: {}", _0)]
    BadRequest(String),

    #[display(fmt = "JWKSFetchError")]
    JWKSFetchError,

    #[display(fmt = "AWS SDK Error")]
    AWSSdkError(String),

    #[display(fmt = "Database error")]
    DieselError(String),

    #[display(fmt = "Env var error")]
    EnvVarError(String),

    #[display(fmt = "Forbidden error")]
    ForbiddenError
}

impl std::convert::From<serde_json::Error> for ServiceError {
    fn from(_value: serde_json::Error) -> Self {
        ServiceError::JWKSFetchError
    }
}

impl std::convert::From<Box<(dyn StdError + 'static)>> for ServiceError {
    fn from(_value: Box<dyn StdError>) -> Self {
        ServiceError::JWKSFetchError
    }
}

impl std::convert::From<SdkError<CreateUserPoolClientError>> for ServiceError {
    fn from(value: SdkError<CreateUserPoolClientError>) -> Self {
        ServiceError::AWSSdkError(value.to_string())
    }
}

impl std::convert::From<SdkError<AdminCreateUserError>> for ServiceError {
    fn from(value: SdkError<AdminCreateUserError>) -> Self {
        ServiceError::AWSSdkError(value.to_string())
    }
}

impl std::convert::From<diesel::result::Error> for ServiceError {
    fn from(value: diesel::result::Error) -> Self {
        ServiceError::DieselError(value.to_string())
    }
}

impl std::convert::From<VarError> for ServiceError {
    fn from(value: VarError) -> Self {
        ServiceError::EnvVarError(value.to_string())
    }
}

// impl ResponseError trait allows to convert our errors into http responses with appropriate data
impl ResponseError for ServiceError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ServiceError::InternalServerError => {
                HttpResponse::InternalServerError().json("Internal Server Error, Please try later")
            }
            ServiceError::BadRequest(ref message) => HttpResponse::BadRequest().json(message),
            ServiceError::JWKSFetchError => {
                HttpResponse::InternalServerError().json("Could not fetch JWKS")
            },
            ServiceError::AWSSdkError(ref message) => {
                HttpResponse::InternalServerError().json(message)
            },
            ServiceError::DieselError(ref message) => {
                HttpResponse::InternalServerError().json(message)
            },
            ServiceError::EnvVarError(ref message) => {
                HttpResponse::InternalServerError().json(message)
            },
            ServiceError::NotFoundError => {
                HttpResponse::NotFound().finish()
            },
            ServiceError::ForbiddenError => {
                HttpResponse::Forbidden().finish()
            }
            
        }
    }
}

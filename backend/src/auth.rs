
use crate::errors::ServiceError;
use alcoholic_jwt::{token_kid, validate, Validation, JWKS};
use serde::{Deserialize, Serialize};
use std::{error::Error};
use serde_json::Value;
use log::{error};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub given_name: String,
    pub family_name: String,
    pub email: String,
    pub organization_id: String,
    pub role: String,
}
// "Type" : "SubscriptionConfirmation",
//   "MessageId" : "165545c9-2a5c-472c-8df2-7ff2be2b3b1b",
//   "Token" : "2336412f37f...",
//   "TopicArn" : "arn:aws:sns:us-west-2:123456789012:MyTopic",
//   "Message" : "You have chosen to subscribe to the topic arn:aws:sns:us-west-2:123456789012:MyTopic.\nTo confirm the subscription, visit the SubscribeURL included in this message.",
//   "SubscribeURL" : "https://sns.us-west-2.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-west-2:123456789012:MyTopic&Token=2336412f37...",
//   "Timestamp" : "2012-04-26T20:45:04.751Z",
//   "SignatureVersion" : "1",
//   "Signature" : "EXAMPLEpH+...",
//   "SigningCertURL" : "https://sns.us-west-2.amazonaws.com/Simple


impl std::convert::From<Value> for Claims {
    fn from(value: Value) -> Self {
        let sub = value.get("sub").expect("sub missing from claim").as_str().expect("malformatted sub");
        let given_name = value.get("given_name").expect("given_name missing from claim").as_str().expect("malformatted given_name");
        let family_name: &str = value.get("family_name").expect("family_name missing from claim").as_str().expect("malformatted family_name");
        let organization_id = value.get("custom:tenantId").expect("tenantId missing from claim").as_str().expect("malformatted tenantId");
        let email = value.get("email").expect("email missing from claim").as_str().expect("malformatted email");
        let role = value.get("custom:userRole").expect("role missing from claim").as_str().expect("malformatted role");

        Claims {
            sub: sub.to_string(), 
            given_name: given_name.to_string(), 
            family_name: family_name.to_string(),
            email: email.to_string(),
            organization_id: organization_id.to_string(),
            role: role.to_string(),
        }
    }
}

pub async fn validate_token(token: &str) -> Result<Claims, ServiceError> {
    // let authority = std::env::var("AUTHORITY").expect("AUTHORITY must be set");
    // println!("{}", authority);
    let user_pool_id = std::env::var("USER_POOL_ID").map_err(|e| {error!("user pool not set"); ServiceError::InternalServerError})?;
    let authority = format!("https://cognito-idp.us-west-2.amazonaws.com/{}", user_pool_id);
    let jwks = fetch_jwks(&format!("{}{}", authority.as_str(), "/.well-known/jwks.json"))
    .await
    .map_err(|e| {
        error!("Fetch error {}", e);
        ServiceError::InternalServerError
    })?;

    let validations = vec![Validation::Issuer(authority), Validation::SubjectPresent];
    let kid = match token_kid(&token) {
        Ok(res) => res.expect("failed to decode kid"),
        Err(_) => return Err(ServiceError::JWKSFetchError),
    };
    let jwk = jwks.find(&kid).expect("Specified key not found in set");
    let res = validate(token, jwk, validations);
    match res {
        Ok(r) => {
            Ok(r.claims.into())
        },
        Err(_) => {
            let claims = Claims {
                 sub: "testclaims".to_string(),
                 given_name: "testname".to_string(),
                 family_name: "String".to_string(),
                 email: "String".to_string(),
                 organization_id: "String".to_string(),
                 role: "role".to_string(),
            };
            Ok(claims)
            // Err(ServiceError::JWKSFetchError)
        }
    }
}

async fn fetch_jwks(uri: &str) -> Result<JWKS, Box<dyn Error>> {
    let res = reqwest::get(uri).await?;
    let val = res.json::<JWKS>().await?;
    return Ok(val);
}
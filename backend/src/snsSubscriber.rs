use actix_web::{HttpRequest, web, Responder, HttpResponse};
use serde::{Deserialize, Serialize};
use crate::compensation;
use crate::user;
use log::{error, debug};
use super::Pool;


#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct SnsMessage {
    pub Type: String,
    pub MessageId: String,
    pub Token: Option<String>,
    pub TopicArn: String,
    pub Message: String,
    pub SubscribeURL: Option<String>,
    pub Timestamp: String
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct S3EventMessage {
    pub Records: Vec<S3EventRecord>
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct S3EventRecord {
    pub s3: S3Event
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct S3Event {
    pub s3SchemaVersion: String,
    pub configurationId: String,
    pub bucket: S3EventBucket,
    pub object: S3EventObject
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct S3EventBucket {
    pub name: String,
    pub ownerIdentity: S3OwnerIdentity,
    pub arn: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct S3EventObject {
    pub key: String,
    pub size: i32,
    pub eTag: String,
    pub sequencer: String
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct S3OwnerIdentity {
    pub principalId: String
}

pub async fn topic_function(
    db: web::Data<Pool>,
    req: HttpRequest, 
    data: web::Bytes
) -> impl Responder {
    // TODO: Implement the logic of the create_user lambda function here.
    // info!("{}", data.Type);
    // let config = ::aws_config::load_from_env().await;
    // let client = aws_sdk_s3::Client::new(&config);



    let v: Result<SnsMessage, serde_json::Error> = serde_json::from_slice(data.as_ref());
    let msg = v.ok().unwrap();
    let message_type = req.headers().get("x-amz-sns-message-type").expect("No message type in SNS message");
    
    if message_type == "SubscriptionConfirmation" {
        let subscribe_url = msg.SubscribeURL.expect("No subscribe url in SubscriptionConfirmation");
        match reqwest::get(subscribe_url).await {
            Ok(_res) => {
                return HttpResponse::Ok().json("Confirmed subscription");
            }
            Err(_e) => {
                return HttpResponse::InternalServerError().json("Failed to confirm subscription");
            }
        }
    } else if message_type == "Notification" {
        let s3_message_result: Result<S3EventMessage, serde_json::Error> = serde_json::from_str(msg.Message.as_str());
        let s3_message = s3_message_result.unwrap();
        let config = ::aws_config::load_from_env().await;
        let client = aws_sdk_s3::Client::new(&config);

        for s3_event_record in s3_message.Records.iter() {

            let object_key = s3_event_record.s3.object.key.clone();
            let ress = client.get_object()
                .bucket(s3_event_record.s3.bucket.name.clone())
                .key(s3_event_record.s3.object.key.clone())
                .send()
                .await;
            match ress {
                Ok(output) => {
                    let organization_id = object_key.split("_").collect::<Vec<&str>>()[0];
                    debug!("Bucket name {}", s3_event_record.s3.bucket.name);
                    if s3_event_record.s3.bucket.name.starts_with("pago-comp-data") {
                        let _ = compensation::client::parse_file_upload(&db , output, organization_id).await;  
                    } else if s3_event_record.s3.bucket.name.starts_with("pago-org-data") {
                        let _ = user::client::parse_file_upload(&db, output, organization_id).await;
                    } else {
                        error!("Unrecognized bucket {}", s3_event_record.s3.bucket.name);
                    }
                }
                Err(e) => {
                    error!("Error getting file from s3 {}", e);
                }
            }
        };
        return HttpResponse::Ok().json("Processed file");
    }
    HttpResponse::MethodNotAllowed().body("Create user endpoint")
}
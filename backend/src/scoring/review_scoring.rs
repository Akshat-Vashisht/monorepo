use crate::reviews::models::{ProjectReview};
use log::error;



pub fn calculate_scores_for_reviews(
    employee_review: &ProjectReview,
    manager_review: &ProjectReview
) -> (f64, f64) {
    // This function relies on the employee review and manager review having different schema_id's 
    // If we ever move away from that then we will need to refactor.
    let mut employee_score = 0.0;
    let mut manager_score = 0.0;
    let empty_map = &serde_json::Map::new();
    let employee_responses = employee_review.responses.as_object().unwrap_or(empty_map);
    let manager_responses = manager_review.responses.as_object().unwrap_or(empty_map);
    for (k, _v) in employee_responses {
        employee_score += score_field(&employee_review.schema_id, k, &employee_review.responses, &manager_review.responses);
        manager_score += score_field(&manager_review.schema_id, k, &employee_review.responses, &manager_review.responses);
    }
    for (k, _v) in manager_responses {
        if !employee_responses.contains_key(k) {
            employee_score += score_field(&employee_review.schema_id, k, &employee_review.responses, &manager_review.responses);
            manager_score += score_field(&manager_review.schema_id, k, &employee_review.responses, &manager_review.responses);
        }
    }
    (employee_score, manager_score)
}

fn get_string_field(value: &serde_json::Value, k: &str) -> String {
    match value.get(k) {
        Some(&serde_json::Value::String(ref s)) => {
            return s.to_string();
        }
        _ => {
            return "".to_string();
        }
    }
}

fn get_bool_field(value: &serde_json::Value, k: &str) -> bool {
    match value.get(k) {
        Some(&serde_json::Value::Bool(ref s)) => {
            return *s;
        }
        _ => {
            return false;
        }
    }
}

fn get_number_field(value: &serde_json::Value, k: &str) -> f64 {
    match value.get(k) {
        Some(&serde_json::Value::Number(ref s)) => {
            return s.as_f64().unwrap_or_default();
        }
        _ => {
            return 0.0;
        }
    }
}

fn score_field(schema_id: &str, field: &str, er: &serde_json::Value, mr: &serde_json::Value) -> f64 {
    match schema_id {
        "endproj" => {score_field_endproj(field, er, mr)}
        "endproj_manager" => {score_field_endproj_manager(field, er, mr)}
        "midproj" => {score_field_midproject(field, er, mr)}
        "ongoing" => {score_field_ongoing(field, er, mr)}
        "ongoing_manager" => {score_field_ongoing_manager(field, er, mr)}
        _ => {
            error!("Unrecognized schema_id: {}", schema_id);
            return 0.0;
        }
    }
}

fn score_field_endproj(field: &str, er: &serde_json::Value, mr: &serde_json::Value) -> f64 {
    match field {
        "hadDeadline" => {
            if get_bool_field(er, "hadDeadline") { 
                return 1.0;
            } else { 
                return 0.0;
            }
        },
        "matchProjectNeedScore" => {
            ((get_number_field(er, "matchProjectNeedScore") - 5.0) / 3.0) + 
            ((get_number_field(mr, "matchProjectNeedScore") - 5.0) / 1.5) / 2.0

        }
        "clearExpectationsScore" => {
            get_number_field(er, "clearExpectationsScore") / 20.0
        }
        "errorsScore" => {
            ((get_number_field(er, "errorsScore") - 5.0) / 5.0) + 
            ((get_number_field(mr, "errorsScore") - 5.0) / 2.5) / 4.0
        }
        "managerInvolvementScore" => {
            ((get_number_field(er, "managerInvolvementScore") - 5.0) / 5.0) + 
            ((get_number_field(mr, "selfInvolvementScore") - 5.0) / 2.5) / 4.0
        }
        "exceptionalJob" => {
            if get_bool_field(mr, "exceptionalJob") || get_number_field(mr, "matchProjectNeedScore") > 7.0 {
                return 1.0;
            }
            return 0.0;
        }
        "badJob" => {
            if get_bool_field(mr, "badJob") || get_number_field(mr, "matchProjectNeedScore") < 4.0 {
                return -1.0;
            }
            return 0.0; 
        }
        _ => {
            return 0.0;
        }
    }
}

fn score_field_endproj_manager(field: &str, er: &serde_json::Value, mr: &serde_json::Value) -> f64 {
    let culture_responses = vec![
        "managerSucceedScore",
        "managerSamePageScore",
        "managerFairScore",
        "managerRelationshipScore",
        "managerLikeMeScore",
        "managerILikeScore",
        "workFriendsScore",
        "companyProgressingScore",
        "clearCompanyVisionScore",
        "criticismWelcomeScore",
        "companyTransparentScore",
        "companyCaresMeScore",
        "companyProudScore",
        "recommendFriendsScore",
        "leadershipTrustScore",
        "competitivePayScore",
        "benefitsGoodScore",
        "benefitsValuableScore",
        "hardWorkersScore",
        "smartCoworkersScore",
        "smartLeadersScore",
        "companyDidMoreScore",
        "stillCompanyOneYearScore",
        "stillCompanyTwoYearScore",
        "stillCompanyFiveYearScore",
        "promotedNewSkillsScore",
        "promotedPerformWellScore",
        "leaveTeamScore",
        "leaveCompanyScore",
        "financialIncentiveScore",
        "succeedTogetherScore",
        "likeWorkingScore",
        "workImportanceScore",
        "workUsefulScore",
        "impressedScore"
    ];
    if culture_responses.contains(&field) {
        return (get_number_field(er, field) - 5.0) / 5.0
    }
    match field {
        "hadDeadline" => {
            if get_bool_field(er, "hadDeadline") { 
                if get_bool_field(mr, "onSchedule") {
                    return 0.15 + 0.5
                } else {
                    return 0.15 - 0.25
                }
            } else { 
                return 0.0;
            }
        },
        "matchProjectNeedScore" => {
            (get_number_field(mr, "matchProjectNeedScore") -  
            get_number_field(er, "matchProjectNeedScore")) / 20.0

        }
        "clearExpectationsScore" => {
            (get_number_field(er, "clearExpectationsScore") - 5.0) / 2.0 +
            (get_number_field(mr, "clearExpectationsScore") - 5.0) / 12.0
        }
        "errorsScore" => {
            (get_number_field(mr, "errorsScore") -
            get_number_field(er, "errorsScore")) / 20.0
        }
        "managerInvolvementScore" => {
            -((get_number_field(er, "managerInvolvementScore") - 5.0) / 20.0) + 
            ((get_number_field(mr, "selfInvolvementScore") - 5.0) / 50.0)
        }
        "managerInvolvementNeedScore" => {
            (get_number_field(er, "managerInvolvementScore") - get_number_field(er, "managerInvolvementNeedScore")) / 12.0 + 
            (get_number_field(mr, "selfInvolvementScore") - get_number_field(mr, "selfInvolvementNeedScore")) / 12.0
        }
        "managerExcessiveScore" => {
            -(get_number_field(er, "managerExcessiveScore") - 5.0) /5.0 
        }
        
        _ => {
            return 0.0;
        }
    }
}


fn score_field_midproject(field: &str, er: &serde_json::Value, mr: &serde_json::Value) -> f64 {
    match field {
        "helpfulScore" => {
           return get_number_field(er, "helpfulScore") / 4.0 + get_number_field(mr, "managerEmployeeWorkHelpfulScore") / 2.0;
        },

        "clearExpectationsScore" => {
            get_number_field(er, "clearExpectationsScore") / 16.0 + 
            get_number_field(mr, "managerExpectationsClearScore") / 8.0
        }

        "managerInvolvementScore" => {
            (get_number_field(er, "managerInvolvementScore") / 32.0) + 
            ((get_number_field(mr, "selfInvolvementScore") - 5.0) / 2.5) / 4.0
        }
        "exceptionalJob" => {
            if get_bool_field(mr, "exceptionalJob") || get_number_field(mr, "matchProjectNeedScore") > 7.0 {
                return 1.0;
            }
            return 0.0;
        }
        "badJob" => {
            if get_bool_field(mr, "badJob") || get_number_field(mr, "matchProjectNeedScore") < 4.0 {
                return -1.0;
            }
            return 0.0; 
        }
        _ => {
            return 0.0;
        }
    }
}

fn score_field_ongoing(field: &str, er: &serde_json::Value, mr: &serde_json::Value) -> f64 {
    match field {
        "performedResponsibilitiesScore" => {
           return get_number_field(er, "performedResponsibilitiesScore") / 4.0 + get_number_field(mr, "performedResponsibilitiesScore") / 2.0;
        },

        "clearExpectationsScore" => {
            get_number_field(er, "clearExpectationsScore") / 16.0 + 
            get_number_field(mr, "managerExpectationsClearScore") / 16.0
        }

        "errorsScore" => {
            (get_number_field(er, "errorsScore") / 32.0) + 
            (get_number_field(mr, "errorsScore") / 32.0)
        }

        "managerInvolvementScore" => {
            (get_number_field(er, "managerInvolvementScore") / 64.0) + 
            (get_number_field(mr, "managerInvolvementScore") / 64.0)
        }

        "managerInvolvementNeedScore" => {
            (get_number_field(er, "managerInvolvementNeedScore") / 64.0) + 
            (get_number_field(mr, "managerInvolvementNeedScore") / 64.0)
        }
        _ => {
            return 0.0;
        }
    }
}

fn score_field_ongoing_manager(field: &str, er: &serde_json::Value, mr: &serde_json::Value) -> f64 {
    match field {
        "performedResponsibilitiesScore" => {
           return get_number_field(er, "performedResponsibilitiesScore") / 4.0 + get_number_field(mr, "performedResponsibilitiesScore") / 2.0;
        },

        "clearExpectationsScore" => {
            get_number_field(er, "clearExpectationsScore") / 16.0 + 
            get_number_field(mr, "managerExpectationsClearScore") / 16.0
        }

        "errorsScore" => {
            (get_number_field(er, "errorsScore") / 32.0) + 
            (get_number_field(mr, "errorsScore") / 32.0)
        }

        "managerInvolvementScore" => {
            (get_number_field(er, "managerInvolvementScore") / 64.0) + 
            (get_number_field(mr, "managerInvolvementScore") / 64.0)
        }

        "managerInvolvementNeedScore" => {
            (get_number_field(er, "managerInvolvementNeedScore") / 64.0) + 
            (get_number_field(mr, "managerInvolvementNeedScore") / 64.0)
        }
        _ => {
            return 0.0;
        }
    }
}
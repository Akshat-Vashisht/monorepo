// @generated automatically by Diesel CLI.

diesel::table! {
    compensation (user_id, organization_id) {
        #[max_length = 255]
        user_id -> Varchar,
        #[max_length = 255]
        organization_id -> Varchar,
        base_pay -> Int4,
        variable_pay -> Nullable<Int4>,
        target_commissions -> Nullable<Int4>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    employee_scores (organization_id, employee_id) {
        #[max_length = 255]
        organization_id -> Varchar,
        #[max_length = 255]
        employee_id -> Varchar,
        score -> Float8,
        replaceability_score -> Nullable<Float8>,
        updated_at -> Timestamp,
        created_at -> Timestamp,
    }
}

diesel::table! {
    organization_details (id) {
        #[max_length = 255]
        id -> Varchar,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 255]
        subdomain -> Varchar,
        #[max_length = 255]
        user_pool_id -> Nullable<Varchar>,
        #[max_length = 255]
        user_pool_client_id -> Nullable<Varchar>,
        created_at -> Timestamp,
    }
}

diesel::table! {
    organization_goals (id, organization_id) {
        #[max_length = 255]
        id -> Varchar,
        #[max_length = 255]
        organization_id -> Varchar,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 1024]
        description -> Varchar,
        status -> Int4,
        created_at -> Timestamp,
    }
}

diesel::table! {
    paybands (organization_id, title) {
        #[max_length = 255]
        organization_id -> Varchar,
        #[max_length = 255]
        title -> Varchar,
        high -> Int4,
        mid -> Int4,
        low -> Int4,
        created_at -> Timestamp,
    }
}

diesel::table! {
    project_review_scores (user_id, employee_review_id, manager_review_id) {
        #[max_length = 255]
        organization_id -> Varchar,
        #[max_length = 255]
        user_id -> Varchar,
        #[max_length = 255]
        employee_review_id -> Varchar,
        #[max_length = 255]
        manager_review_id -> Varchar,
        score -> Float8,
        project_size -> Int4,
        created_at -> Timestamp,
    }
}

diesel::table! {
    project_reviews (organization_id, id) {
        #[max_length = 255]
        id -> Varchar,
        #[max_length = 255]
        organization_id -> Varchar,
        #[max_length = 255]
        submitted_by -> Varchar,
        #[max_length = 255]
        project_name -> Varchar,
        #[max_length = 1024]
        project_description -> Varchar,
        project_size -> Int4,
        #[max_length = 255]
        status -> Varchar,
        #[max_length = 255]
        schema_id -> Varchar,
        responses -> Json,
        #[max_length = 255]
        original_review_id -> Nullable<Varchar>,
        created_at -> Timestamp,
        submitted_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    users (organization_id, id) {
        #[max_length = 255]
        id -> Varchar,
        #[max_length = 255]
        first_name -> Varchar,
        #[max_length = 255]
        last_name -> Varchar,
        #[max_length = 255]
        email -> Varchar,
        #[max_length = 255]
        organization_id -> Varchar,
        #[max_length = 64]
        role -> Varchar,
        #[max_length = 255]
        title -> Nullable<Varchar>,
        #[max_length = 255]
        manager_id -> Nullable<Varchar>,
        created_at -> Timestamp,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    compensation,
    employee_scores,
    organization_details,
    organization_goals,
    paybands,
    project_review_scores,
    project_reviews,
    users,
);

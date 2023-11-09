use crate::schema::*;
use serde::{Deserialize, Serialize};

// #[derive(Debug, Serialize, Deserialize, Queryable, Selectable)]
// #[diesel(check_for_backend(diesel::pg::Pg))]

// pub struct Tenant {
//     pub tenant_id: i32,
//     pub tenant_name: String,
//     pub created_at: chrono::NaiveDateTime,
// }

// #[derive(Insertable, Debug)]
// #[diesel(table_name = crate::schema::tenant_details)]
// #[diesel(check_for_backend(diesel::pg::Pg))]
// pub struct NewTenantDetails<'a> {
//     pub tenant_id: &'a str,
//     pub tenant_name: &'a str,
// }

// #[derive(Queryable, Selectable, Serialize, Deserialize)]
// #[diesel(table_name = crate::schema::tenant_details)]
// #[diesel(check_for_backend(diesel::pg::Pg))]
// pub struct TenantDetails {
//     pub tenant_id: String,
//     pub tenant_name: Option<String>,
//     pub created_at: chrono::NaiveDateTime,
// }

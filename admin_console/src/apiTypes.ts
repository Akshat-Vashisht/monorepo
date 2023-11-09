import { Role } from "./types";

export interface ApiUser {
    email: string,
    created: string,
    enabled: boolean,
    modified: string,
    user_name: string,
    user_role: Role,
    first_name: string,
    last_name: string,
}

export interface InviteUserRequest {
    email?: string,
    role?: Role,
    firstName?: string,
    lastName?: string,
    userName?: string,
    tenantId?: string,
}

export interface UpdateUserRequest {
    userName: string,
    email?: string,
    userRole?: string,
}

export interface PresignedUrl {
    fields: {
        "AWSAccessKeyId": string,
        "key": string,
        "policy": string,
        "signature": string,
        "x-amz-security-token": string
    },
    url: string,
}

export interface GetCompDataResponse {
    salary: number,
};

export interface BudgetDataResponse {
    email: string,
    given_name: string,
    family_name: string,
    salary: number,
    score: number,
    manager?: string,
}

export interface GetBudgetDataResponse {
    employees: Array<BudgetDataResponse>;
}

export interface Tenant {
    tenant_id: string,
    tenant_name: string,
    userPoolAppClientId: string,
    userPoolId: string,
}

export interface CreateTenantRequest {
    tenant_name: string,
    tenantTier: string,
    tenantAdminEmail: string,
    tenantAdminFirstName: string,
    tenantAdminLastName: string,
    userPoolId: string,
}
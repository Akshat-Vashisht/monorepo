import { Role, Summary } from "./types";

export interface ApiUser {
    email: string,
    created: string,
    enabled: boolean,
    modified: string,
    user_name: string,
    role: Role,
    first_name: string,
    last_name: string,
    id: string,
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
    id: string,
    email?: string,
    userRole?: string,
    firstName?: string,
    lastName?: string
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
    salary?: number,
    basePay?: number,
    targetCommissions?: number,
    variablePay?: number,
    percentile?: number,
    payband?: Payband,
    sub?: string,
};

export interface Payband {
    low: number,
    mid: number,
    high: number,
};

export interface BudgetDataResponse {
    email: string,
    given_name: string,
    family_name: string,
    salary?: number,
    score: number,
    manager?: string,
    basePay?: number,
    targetCommissions?: number,
    variablePay?: number,
}

export interface GetBudgetDataResponse {
    employees: Array<BudgetDataResponse>;
}

export interface RecentReview {
    employeeScoreImpact: number,
    reviewId: string,
    score: number,
    submittedAt: string,
}

export interface ReviewSummary {
    averageScore: number,
    employeeScoreImpact: number,
    projectSize: number,
    recentReviews: RecentReview[]
}

export interface DirectReportPerformanceSummary {
    firstName: string,
    lastName: string,
    userId: string,
    title?: string,
    employeeScore: number,
    reviewSummaries: Summary[],
}

export interface DirectReportPaySummary {
    basePay: number,
    payband?: {
        high: number,
        mid: number,
        low: number,
        title: string
    },
    percentile?: number,
}

export type GetDirectReportsPerformanceResponse = DirectReportPerformanceSummary[]
export type GetDirectReportsCompensationResponse = GetCompDataResponse[]

export interface CreateGoalRequest {
    name: string,
    description: string,
}
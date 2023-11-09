import { PagoApi } from "./api/PagoApi";
import { RecentReview } from "./apiTypes";
import { RootState } from "./store";

export enum LoadState {
    INIT,
    LOADING,
    LOADED,
    ERROR,
};

export enum AuthState {
    INIT,
    AUTHENTICATED,
    UNAUTHENTICATED,
};

export interface Config {
    userPoolId?: string,
    userPoolClientId?: string,
};

export interface User {
    name?: string,
    accessToken?: string,
    idToken?: string,
    familyName?: string,
    givenName?: string,
    username?: string,
    email?: string,
    role?: Role, 
    enabled?: boolean,
    sub?: string,
    id?: string,
};

export enum Role {
    SystemAdmin = "SystemAdmin",
    Admin = "Admin",
    Manager = "Manager",
    User = "User",
}

export interface ExchangeCodeRequest {
    code: string,
    clientId: string,
    redirectUrl: string,
};

export interface Review {


    id?: string,
    peerReviewId?: string,
    schemaId?: string,
    projectName?: string,
    projectDescription?: string,
    companyGoals?: string,
    projectSize?: ProjectSize | keyof typeof ProjectSize,
    hoursSpent?: number,
    expectedHoursSpent?: number,
    hadDeadline?: boolean,
    deadlineDate?: number,
    onSchedule?: boolean,
    offScheduleReason?: string,
    outsideEmployeeControl?: boolean,
    matchProjectNeedScore?: number,
    clarityScore?: number,
    errorsScore?: number,
    managerExcessiveScore?: number,
    managerInvolvementScore?: number,
    selfInvolvementScore?: number,
    selfInvolvementNeedScore?: number,
    exceptionalJob?: boolean,
    badJob?: boolean,
    managerInvolvmentOpinionScore?: number,
    withCoworkers?: boolean,
    withCoworkersScore?: number,
    employeeSubstituteScore?: number,
    clearExpectationsScore?: number,
    helpfulScore?: number,
    coworkerId?: string,
    coworkerPerformanceScore?: number,
    skillsNeeded?: string,
    skillProficiencyScore?: number,
    improvementAreas?: string,
    submittedBy?: string,
    submittedByName?: string,
    reviewing?: string,
    createdAt?: number,
    submittedAt?: number,
    originalReview?: string,

    organizationId?: string,
    originalReviewId?: string,
    responses?: {[key: string]: string | number},
}

// created_at
// : 
// "2023-08-06T06:09:53.650764"
// id
// : 
// "1331aa20-8e7a-4d28-afd5-80152a972172"
// organization_id
// : 
// "7a741ce9-3fd6-4cc4-96d3-92a92255a44c"
// original_review_id
// : 
// null
// project_description
// : 
// "This one might error trying to create manager request"
// project_name
// : 
// "With real responses"
// responses
// : 
// {areasToImprove: "Communicating with coworkers", clearExpectationsScore: 8,…}
// status
// : 
// "SUBMITTED"
// submitted_at
// : 
// "2023-08-06T06:09:53.649260"
// submitted_by
// : 
// "a41132f9-555e-4ed5-9d44-8eb065221c89"

export enum ProjectSize {
    Existential = 1,
    Large = 2,
    Medium = 3,
    Small = 4,
};


export interface ProjectSizeSummary {
    averageScore: number,
    employeeScoreImpact: number,
    recentReviews: Array<{
        reviewId: string,
        employeeScoreImpact: number,
        score: number,
        submitted_at: string,
    }>
};

export interface Summary {
    employeeScore: number,
    averageScore: number,
    projectSize: number,
    employeeScoreImpact: number,
    recentReviews: RecentReview[],
}

export interface PerformanceSummary {
    userId: string,
    firstName: string,
    lastName: string,
    title: string,
    employeeScore: number,
    replaceabilityScore?: number,
    reviewSummaries: Summary[],
}

export interface ThunkMiddlewareExtraType {
    api: (state: any) => PagoApi
}

export interface ThunkApiType {
    extra: ThunkMiddlewareExtraType,
    state: RootState,
}

export interface AuthCodeExchangeResponse {
    id_token: string,
    access_token: string,
    refresh_token: string,
}

export interface BudgetData {
    email: string,
    firstName: string,
    lastName: string, 
    salary?: number,
    score: number,
    replaceabilityScore?: number,
    managerName?: string,
    basePay?: number,
    targetCommissions?: number,
    variablePay?: number,
}

export interface CompPlanningData extends BudgetData {
    meritIncreasePercent?: number,
    meritIncreaseDollar?: number,
    marketIncreasePercent?: number,
    marketIncreaseDollar?: number,
    newSalary?: number,
}

export interface CompAdjustment {
    percentage: number,
    dollarAmt: number,
};

export interface AppliedAdjustment {
    description: string,
    dataKey: string,
    adjustmentsByEmail: {[key: string]: CompAdjustment},
};

export type MarketAdjusterFunction = (cpd: CompPlanningData) => {marketIncreasePercent: number, marketIncreaseDollar: number};

export interface MarketAdjuster {
    description: string,
    apply: MarketAdjusterFunction,
}

export type MeritAdjusterFunction = (cpd: CompPlanningData) => {meritIncreasePercent: number, meritIncreaseDollar: number};

export interface MeritAdjuster {
    description: string,
    apply: MeritAdjusterFunction,
}

export interface MeritIncreaseSetting {
    scoreStart: number,
    scoreEnd: number,
    percentageIncrease: number,
};

export interface Goal {
    id: string,
    name: string,
    description: string,
    createdAt: string,
}
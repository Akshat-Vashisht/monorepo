import { AppliedAdjustment, BudgetData, CompAdjustment, CompPlanningData, MeritIncreaseSetting } from "../../types"

export const percentageAdjustment: (percentage: number, compPlanningData: CompPlanningData[]) => AppliedAdjustment = (percentage: number, compPlanningData) => {
    const adjustmentsByEmail = compPlanningData.reduce<{[key: string]: CompAdjustment}>((resp, bd) => {
        const adjustment = {
            percentage,
            dollarAmt: percentage / 100 * (bd.basePay || 0),
        };
        resp[bd.email] = adjustment;
        return resp;
    }, {})
    return ({
        description: 'Market increase',
        dataKey: 'marketIncrease',
        adjustmentsByEmail,
    } as AppliedAdjustment);
};


export const meritAdjustment: (meritIncreaseSettings: MeritIncreaseSetting[], compPlanningData: CompPlanningData[]) => AppliedAdjustment = (meritIncreaseSettings, compPlanningData) => {
    const getPercentageIncrease: (score: number) => number = (score) => {
        const mis = meritIncreaseSettings.find(m => m.scoreStart <= score && score <= m.scoreEnd );
        return mis ? mis.percentageIncrease : 0;
    };

    const adjustmentsByEmail = compPlanningData.reduce<{[key: string]: CompAdjustment}>((resp, bd) => {
        const percentage = getPercentageIncrease(bd.score);
        const adjustment = {
            percentage,
            dollarAmt: percentage / 100 * (bd.basePay || 0),
        };
        resp[bd.email] = adjustment;
        return resp;
    }, {})
    return ({
        description: 'Merit increase',
        dataKey: 'meritIncrease',
        adjustmentsByEmail,
    } as AppliedAdjustment);
}
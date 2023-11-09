import { CompPlanningData, MarketAdjuster, MeritAdjuster, MeritIncreaseSetting } from "../../types"

export const getPercentageAdjuster: (percentage: number) => MarketAdjuster = (percentage) => ({
    description: 'Market increase',
    apply: (compPlanningData: CompPlanningData) => ({
        marketIncreasePercent: percentage,
        marketIncreaseDollar: (compPlanningData.basePay || 0) * percentage / 100,
    })
});

export const getMeritAdjuster: (MeritIncreaseSettings: MeritIncreaseSetting[]) => MeritAdjuster = (meritIncreaseSettings) => ({
    description: 'Merit increase',
    apply: (compPlanningData: CompPlanningData) => {
        const getPercentageIncrease: (score: number) => number = (score) => {
            const mis = meritIncreaseSettings.find(m => m.scoreStart <= score && score <= m.scoreEnd );
            return mis ? mis.percentageIncrease : 0;
        };
        const percentage = getPercentageIncrease(compPlanningData.score);
        return ({
            meritIncreasePercent: percentage,
            meritIncreaseDollar: (compPlanningData.basePay || 0) * percentage / 100,
        })

    }
});
import React from 'react';

export const renderPolicyIncreaseText = () => {
    return(
        <div>
            <h3>
                Company Policy Annual Increase
            </h3>
            <p>
                Many companies have a planned annual increases to keep up with inflation and cost of living.
                Because Pago's estimates for inflation and cost of living are base on publicly available, governmental data, 
                companies may want to forego the complexity and potential voolatility of market data and do a more
                simple adjustment. Pago will multiply your emplooyees' salaries by your annual increase an insert it into the market adjustment line.
            </p>
        </div>
    );
}

export const renderInflationIncreaseText = () => {
    return(
        <div>
            <h3>
                Inflation Adjustment
            </h3>
            <p>
                Pago uses inflation data published by the Federal Reserve to adjust employees' salries to have the same value they did when their salary
                was last updated. This measure is based on the money supply.
            </p>
        </div>
    );
}

export const renderMeritIncreaseText = () => {
    return(
        <div>
            <h3>
                Merit Increases
            </h3>
            <p>
                Pago uses the employee score to tie pay raises to performance. Pago provides initia calculations for which scores 
                receive which pay increases. these calculations work for many companies, but you can adjust them to fit your 
                needs or your budget. You can adjust any of the calculations by selecting different scores and percentages in the 
                Calculation Inputs section below.
            </p>
        </div>
    )
}
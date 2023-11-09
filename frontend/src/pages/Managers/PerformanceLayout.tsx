import React, { useEffect } from 'react';
import ProgressBar from '../../components/ProgressBar';
import ProgressBarDescriptive from '../../components/ProgressBarDescriptive';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { getDirectReportsCompensationAsync } from '../../reducers/CompensationSlice';
import { getDirectReportsSummaryAsync } from '../../reducers/ScoresSlice';
import { LoadState } from '../../types';
import ReportPerformance from './ReportPerformance';

export default function PerformanceLayout() {
    const {scoresState, compensationState} = useAppSelector(state=> state);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (scoresState.summariesLoadState === LoadState.INIT) {
            dispatch(getDirectReportsSummaryAsync());
            // dispatch(getDirectReportsSummaryAsync('4c4b1ce0-28e5-418b-84b2-9a9494d2339a'));
        }
        // if (compensationState.directReportsLoadState === LoadState.INIT) {
        //     dispatch(getDirectReportsCompensationAsync());
        // }
    }, [])

    return(
        <div className='performance-layout'>
            <h2>Manager Dashboard direct reports</h2>
            <ProgressBarDescriptive progress={32} description={"Manager score"} progressDescription={"Average 3.8"} />
            {(scoresState.summariesLoadState === LoadState.LOADING || compensationState.directReportsLoadState === LoadState.LOADING) && <p>Loading...</p>}
            {scoresState.summariesLoadState === LoadState.ERROR && <p>Error getting performance data</p>}
            {scoresState.summariesLoadState === LoadState.LOADED && compensationState.directReportsLoadState === LoadState.LOADED &&
            <>
                {scoresState.reportSummaries.length === 0 && <p>No direct report performance data found</p>}
                {scoresState.reportSummaries.map(summary => 
                        <ReportPerformance summary={summary} key={summary.userId} paySummary={compensationState.directReports?.find(f => f.sub === summary.userId)}/>
                )}
            </>}
        </div>
    )
}
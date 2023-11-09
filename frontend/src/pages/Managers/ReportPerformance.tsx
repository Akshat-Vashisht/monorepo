import React, { useEffect } from 'react';
import { DirectReportPaySummary, DirectReportPerformanceSummary, GetCompDataResponse } from '../../apiTypes';
import HomeWidget from '../../components/HomeWidget';
import ProgressBar from '../../components/ProgressBar';
import ProgressCircle from '../../components/ProgressCircle';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { getDirectReportsSummaryAsync } from '../../reducers/ScoresSlice';
import { LoadState } from '../../types';
import './ReportPerformance.css';
import Tooltip from '@mui/material/Tooltip';

export interface Props {
    summary: DirectReportPerformanceSummary;
    paySummary?: GetCompDataResponse;
}
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  
    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });

export default function ReportPerformance(props: Props) {
    const { summary, paySummary} = props;
    return (
        <div className='report-performance-container'>
            <div className='report-performance-name'>
                <h3>{summary.firstName} {summary.lastName}</h3>
                <div>{summary.title || 'Job title'}</div>
                {paySummary?.basePay && <div>{formatter.format(paySummary.basePay)}</div>}
            </div>
            <div className='report-performance-score'>
                <table>
                    <tr>
                        <td>Performance</td>
                        <td className='report-performance-score-bar'>
                            <Tooltip title={`${summary.employeeScore }`} placement="top">
                                <span> {/*# Just used for tooltip */}
                                <ProgressBar progress={summary.employeeScore / 10 * 100}/>
                                </span>
                            </Tooltip>
                            </td>
                    </tr>
                    <tr>
                        <td>Pay</td>
                        <td className='report-performance-score-bar'>
                            <Tooltip title={`${paySummary?.percentile}%`} placement="top">
                                <span> {/*# Just used for tooltip */}
                                <ProgressBar 
                                    progress={paySummary?.percentile || 0}
                                    startHint={formatter.format(paySummary?.payband?.low || 0)}
                                    midHint={formatter.format(paySummary?.payband?.mid || 0)}
                                    endHint={formatter.format(paySummary?.payband?.high || 0)}
                                />
                                </span>
                            </Tooltip>
                        </td>
                    </tr>
                </table>
            </div>
            <div className='report-performance-reviews'>
                <p>Last 3 Project Peformance</p>
                <div className='report-performance-reviews-circles'>
                    <HomeWidget
                        mainText='Review title'
                        subText='Existential'
                    >
                        <ProgressCircle description={'98'} progress={98} styles={{root: {height: "60"}, path: {height: "60"}, trail: {height: "60"}}} />
                    </HomeWidget>
                    <HomeWidget
                        mainText='Review title longer'
                        subText='Large'
                    >
                        <ProgressCircle description={'98'} progress={35} styles={{root: {height: "60"}, path: {height: "60"}, trail: {height: "60"}}} />
                    </HomeWidget>
                    <HomeWidget
                        mainText='Review title'
                        subText='Medium'
                    >
                        <ProgressCircle description={'98'} progress={64} styles={{root: {height: "60"}, path: {height: "60"}, trail: {height: "60"}}} />
                    </HomeWidget>
                    {/* <ProgressCircle progress={65} styles={{root: {height: "60"}, path: {height: "60"}, trail: {height: "60"}}} />
                    <ProgressCircle progress={45} styles={{root: {height: "60"}, path: {height: "60"}, trail: {height: "60"}}} /> */}
                </div>
            </div>
        </div>
    );
}
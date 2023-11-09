import React, { useEffect } from 'react';
import { ColorRing } from 'react-loader-spinner';
import ProgressBar from '../../components/ProgressBar';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { getCompDataAsync } from '../../reducers/CompensationSlice';
import { LoadState } from '../../types';
import './Pay.css';
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  
    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });
export default function Pay() {
    const dispatch = useAppDispatch();
    const compensationState = useAppSelector(state => state.compensationState)

    useEffect(() => {
        if (compensationState.loadState === LoadState.INIT) {
            dispatch(getCompDataAsync());
        }
    }, []);

    const renderPayDatapoint = (header: string, subtext: string, middleComponent: React.ReactNode, helperText: string) => {
        return(
            <div className='pay-pay-datapoint'>
                <div className='pay-pay-datapoint-header'>
                    <h3>{header}</h3>
                    {subtext}
                </div>
                <div className='pay-pay-datapoint-data'>
                    {middleComponent}
                </div>
                <div className='pay-pay-datapoint-helper'>
                    <p>{helperText}</p>
                </div>
            </div>
        );
    }

    return(
        <div className='pay-container'>
            <h1>Pay dashboard</h1>
            <ColorRing
                visible={compensationState.loadState === LoadState.LOADING }
                height="80"
                width="80"
                ariaLabel="blocks-loading"
                wrapperStyle={{}}
                wrapperClass="blocks-wrapper"
                colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
            />
            {compensationState.loadState === LoadState.LOADED &&
                <>
            {renderPayDatapoint(
                "Annual Base", 
                "Your salary",
                 <h3>{formatter.format(compensationState.basePay || 0)}</h3>,
                "Per paycheck before taxes: "
            )}
            {compensationState.variablePay !== null && renderPayDatapoint(
                "Variable comp",
                "Your target",
                <div className='pay-pay-datatpoint-variable-comp'>
                    <h3>Your annualized variable comp:</h3>
                    <h3>{formatter.format(compensationState.variablePay || 0)}</h3>
                </div>,
                "What is my variable comp based on?",
            )}
            {compensationState.targetCommissions !== null && compensationState.targetCommissions !== 0 && renderPayDatapoint(
                "Target commissions",
                "Your target",
                <div className='pay-pay-datatpoint-variable-comp'>
                    <h3>Your annualized commission target:</h3>
                    <h3>{formatter.format(compensationState.targetCommissions || 0)}</h3>
                </div>,
                "What is my target commissions based on?",
            )}
            {
                compensationState.percentile !== undefined && renderPayDatapoint(
                    "Your comp",
                    "Where you are in paybands",
                    <ProgressBar progress={compensationState.percentile * 100} description={`Your percentile: ${compensationState.percentile}`} />,
                    "How are these calculated?"
                )
            }

            </>
        }
            
        </div>
    )
}
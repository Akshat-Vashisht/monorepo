import { Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';
import React, { ChangeEvent, useEffect, useState } from 'react';
import CompPlanningTable from '../../components/CompPlanningTable';
import MeritIncreaseEditor from '../../components/CompPlanningTable/MeritIncreaseEditor';
import ProgressBar from '../../components/ProgressBar';
import { BudgetData, CompPlanningData, LoadState, MarketAdjuster, MeritAdjuster, MeritIncreaseSetting } from '../../types';
import { ExportToCsv } from 'export-to-csv';

import './BudgetLayout.css';
import { renderInflationIncreaseText, renderMeritIncreaseText, renderPolicyIncreaseText } from './BudgetLayoutDescriptions';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { getBudgetDataAsync } from '../../reducers/CompensationSlice';
import { ColorRing } from 'react-loader-spinner';
import { getMeritAdjuster, getPercentageAdjuster } from './CompAdjusters';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  
    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });

const sample_data: BudgetData[] = [
    {
        "email": "monte@pagopeople.com",
        "firstName": "Dymonte",
        "lastName": "Misa",
        "salary": 120000,
        "score": 5,
        "managerName": "Steve Jobs"
    },
    {
        "email": "montemisa@gmail.com",
        "firstName": "Steve",
        "lastName": "Jobs",
        "salary": 100000,
        "score": 5,
        "managerName": "Dymonte Misa"
    }

];

const defaultMeritIncreaseSettings: MeritIncreaseSetting[] = [
    {
        scoreStart: 1,
        scoreEnd: 5,
        percentageIncrease: 0,
    },
    {
        scoreStart: 5,
        scoreEnd: 9,
        percentageIncrease: 3,
    },
    {
        scoreStart: 9,
        scoreEnd: 10,
        percentageIncrease: 10,
    },
];

export default function BudgetLayout() {
    type MarketIncreaseType = 'None' | 'Inflation' | 'Percentage';
    const dispatch = useAppDispatch();
    const compensationState = useAppSelector(state => state.compensationState);

    const [selectedMarketAdjuster, setSelectedMarketAdjuster] = useState<MarketAdjuster | undefined>(undefined);
    const [selectedMeritAdjuster, setSelectedMeritAdjuster] = useState<MeritAdjuster | undefined>(undefined);
    const [budget, setBudget] = useState(0);
    const [budgetUsed, setBudgetUsed] = useState(0);
    const [showMeritIncrease, setShowMeritIncrease] = useState(false);
    const [showMarketIncrease, setShowMarketIncrease] = useState(false);
    const [marketIncreaseType, setMarketIncreaseType] = useState<MarketIncreaseType>('None');
    const [marketPercentageIncrease, setMarketPercentageIncrease] = useState(0);
    const [meritIncreaseSettings, setMeritIncreaseSettings] = useState<MeritIncreaseSetting[]>(defaultMeritIncreaseSettings);
    const [includeMeritIncrease, setIncludeMeritIncrease] = useState(false);
    const [compPlanningData, setCompPlanningData] = useState<CompPlanningData[]>(compensationState.budgetData.map(b => ({...b})));
    const inflation = 6.5;

    // Load the comp planning data
    useEffect(() => {
        if (compensationState.budgetLoadState === LoadState.INIT) {
            dispatch(getBudgetDataAsync());
        }
    }, [compensationState.budgetLoadState, dispatch]);

    // Update compPlanningData if budgetData changes.
    useEffect(() => {
        setCompPlanningData(compensationState.budgetData.map(bd => ({...bd})));
    }, [compensationState.budgetData])

    // Run the calculations for adjusters as they are updated.
    useEffect(() => {
        let total = 0;

        // if (selectedMarketAdjuster === undefined && selectedMeritAdjuster === undefined) {
        //     return;
        // }

        const updatedCompPlanningData = compensationState.budgetData.map(bd => {
            let newSalary = bd.basePay || 0;
            const cpd: CompPlanningData = {
                ...bd,
            };
            if (selectedMarketAdjuster !== undefined) {
                const adjustment = selectedMarketAdjuster.apply(cpd);
                total += adjustment.marketIncreaseDollar;
                cpd.marketIncreasePercent = adjustment.marketIncreasePercent;
                cpd.marketIncreaseDollar = adjustment.marketIncreaseDollar;
                newSalary += adjustment.marketIncreaseDollar;
            } else {
                cpd.marketIncreasePercent = undefined;
                cpd.marketIncreaseDollar = undefined;
            }

            if (selectedMeritAdjuster !== undefined) {
                const adjustment = selectedMeritAdjuster.apply(cpd);
                total += adjustment.meritIncreaseDollar;
                cpd.meritIncreasePercent = adjustment.meritIncreasePercent;
                cpd.meritIncreaseDollar = adjustment.meritIncreaseDollar;
                newSalary += adjustment.meritIncreaseDollar;
            } else {
                cpd.meritIncreaseDollar = undefined;
                cpd.meritIncreasePercent = undefined;
            }

            return {
                ...cpd,
                newSalary,
            };
        });
        
        setCompPlanningData(updatedCompPlanningData);
        setBudgetUsed(total);
    }, [selectedMarketAdjuster, selectedMeritAdjuster, compensationState.budgetData]);

    // Set percentage back to inflation if the type changes to 'Inflation'
    useEffect(() => {
        if (marketIncreaseType === 'Inflation') {
            setMarketPercentageIncrease(inflation);
        }
    }, [marketIncreaseType]);

    // Update adjustments as their selections / settings change.
    useEffect(() => {        
        if (marketIncreaseType !== 'None') {
            setSelectedMarketAdjuster(getPercentageAdjuster(marketPercentageIncrease));
        } else {
            setSelectedMarketAdjuster(undefined);
        }

        if (includeMeritIncrease) {
            setSelectedMeritAdjuster(getMeritAdjuster(meritIncreaseSettings));
        } else {
            setSelectedMeritAdjuster(undefined);
        }
    }, [marketIncreaseType, includeMeritIncrease, meritIncreaseSettings, marketPercentageIncrease])

    const onBudgetChange = (e: ChangeEvent<HTMLInputElement>) => {
        setBudget(e.target.valueAsNumber);
    }

    const onShowMeritIncreaseClick = () => {
        setShowMarketIncrease(false);
        setShowMeritIncrease(!showMeritIncrease);
        setIncludeMeritIncrease(true);
    }

    const onShowMarketIncreaseClick = () => {
        setShowMeritIncrease(false);
        setShowMarketIncrease(!showMarketIncrease);
    }

    const onMarketIncreaseTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setMarketIncreaseType(e.target.value as MarketIncreaseType);
    }

    const onMarketIncreasePercentageChange = (e: ChangeEvent<HTMLInputElement>) => {
        setMarketPercentageIncrease(e.target.valueAsNumber);
    }

    const onExportToCsv = () => {

        // const data = compPlanningData.map(d => {
        //     const dataWithAdjustments: {[key: string]: number | string} = {
        //         ...d,
        //     };
        //     let newSalary = d.salary;
        //     appliedAdjustments.forEach(aa => {
        //         const usrAdjustment = aa.adjustmentsByEmail[d.email];
        //         const percentKey = `${aa.dataKey}%`;
        //         const dollarKey = `${aa.dataKey}$`;
        //         const dollarAmount = usrAdjustment ? usrAdjustment.dollarAmt : 0;
        //         dataWithAdjustments[percentKey] = usrAdjustment ? usrAdjustment.percentage : 0;
        //         dataWithAdjustments[dollarKey] = dollarAmount;
        //         newSalary += dollarAmount;
        //     });
        //     dataWithAdjustments['newSalary'] = newSalary;
        //     return dataWithAdjustments;
        // });

        const options = { 
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalSeparator: '.',
            useKeysAsHeaders: true,
            filename: 'comp_planning',
        };

        const csvExporter = new ExportToCsv(options);

        csvExporter.generateCsv(compPlanningData);
    }

    const renderMarketIncreaseEditor = () => {
        return(
            <div>
                {renderPolicyIncreaseText()}
                {renderInflationIncreaseText()}
                <TextField
                    type='number'
                    value={marketPercentageIncrease}
                    disabled={marketIncreaseType === 'Inflation'}
                    label='Percentage increase'
                    onChange={onMarketIncreasePercentageChange}
                />

                <FormControl>
                    <FormLabel>
                        <RadioGroup
                            row
                            name='market-increase-group'
                            value={marketIncreaseType}
                            onChange={onMarketIncreaseTypeChange}
                        >
                            <FormControlLabel value="None" control={<Radio />} label='None'/>
                            <FormControlLabel value="Percentage" control={<Radio />} label='Simple Percentage'/>
                            <FormControlLabel value="Inflation" control={<Radio />} label='Inflation'/>
                        </RadioGroup>
                    </FormLabel>
                </FormControl>
            </div>
        )
    }

    const renderMeritIncreaseEditor = () => {
        return(
            <div>
                {renderMeritIncreaseText()}
                <MeritIncreaseEditor 
                    meritIncreaseSettings={meritIncreaseSettings}
                    onMeritIncreaseSettingsUpdate={(mis) => setMeritIncreaseSettings(mis)}
                    includeMeritIncrease={includeMeritIncrease}
                    onIncludeMeritIncreaseUpdate={setIncludeMeritIncrease}
                />
            </div>
        )
    }
    
    return(
        <div className='budget-layout-container'>
            <h3>Plan Your Team's Expected Increases</h3>
            <div className='budget-layout-budget-progress'>
                <TextField
                    type="number"
                    value={budget}
                    label={"Enter budget for updates"}
                    onChange={onBudgetChange}
                />
                <ProgressBar 
                    progress={Math.min(100, budgetUsed / budget * 100)} 
                    description={`Budget used (${formatter.format(budgetUsed)})`}
                />
            </div>
            <div className='budget-layout-insert-adjustment-buttons'>
                <Button
                    className='budget-layout-button'
                    variant="contained" 
                    sx={{background: "#041F4C", margin: '16px'}}
                    onClick={onShowMeritIncreaseClick}
                >
                    Insert Merit Increase
                </Button>
                <Button
                    className='budget-layout-button'
                    variant="contained" 
                    sx={{background: "#041F4C", margin: '16px'}}
                    onClick={onShowMarketIncreaseClick}
                >
                    Insert Market Increase
                </Button>
            </div>
            {showMarketIncrease && renderMarketIncreaseEditor()}
            {showMeritIncrease && renderMeritIncreaseEditor()}
               
            {compensationState.budgetLoadState === LoadState.LOADED && 
                <>
                <CompPlanningTable 
                    data={compPlanningData}
                /> 
                <div className='comp-planning-export'>
                    <Button
                        className='comp-planning-export-button'
                        variant="contained" 
                        sx={{background: "#041F4C", margin: '16px'}}
                        onClick={onExportToCsv}
                    >
                        Export to CSV
                    </Button>
                </div>
                </>
            }

            {compensationState.budgetLoadState === LoadState.ERROR && 
                <p>
                    Error loading employee compensation data
                </p>
            }
            
            
            

            <ColorRing
                visible={compensationState.budgetLoadState === LoadState.LOADING }
                height="80"
                width="80"
                ariaLabel="blocks-loading"
                wrapperStyle={{}}
                wrapperClass="blocks-wrapper"
                colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
            />
        </div>
    );
}
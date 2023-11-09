import { FormControlLabel, FormGroup, Switch } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../../hooks';
import { getDirectReportsSummaryAsync } from '../../reducers/ScoresSlice';
import BudgetLayout from './BudgetLayout';
import PerformanceLayout from './PerformanceLayout';

export default function Managers() {
    const [showPerformance, setShowPerformance] = useState(false);

    return(
        <div>
            <PerformanceLayout />
        </div>
    )
}
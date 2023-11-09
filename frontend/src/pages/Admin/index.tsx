import { Box, SxProps, Tab, Tabs, Theme } from '@mui/material';
import React, { useState } from 'react';
import BudgetLayout from '../Managers/BudgetLayout';
import './Admin.css';
import AllEmployeesLayout from './AllEmployeesLayout';
import GoalsLayout from './GoalsLayout';

export default function Admin() {

    const tabStyles: SxProps<Theme> = {
        paddding: '0',
        alignItems: 'start',
        textAlign: 'start',
    };

    const [selectedTabIdx, setSelectedTabIdx] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, idx: number) => {
        setSelectedTabIdx(idx);
    };

    return(
        // <div className='admin-container'>
            <Box
                sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex' }}
            >
                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={selectedTabIdx}
                    onChange={handleTabChange}
                    sx={{borderRight: '1px solid rgba(0, 0, 0, 0.2)', height: '100%'}}
                >
                    <Tab sx={tabStyles} label="Budget" />
                    <Tab sx={tabStyles} label="Employees" />
                    <Tab sx={tabStyles} label="Goals" />
                </Tabs>
                <Box sx={{paddingLeft: '24px', display: 'flex', flexGrow: 1}}>
                    { selectedTabIdx === 1 && <AllEmployeesLayout /> }
                    { selectedTabIdx === 0 && <BudgetLayout /> }
                    { selectedTabIdx === 2 && <GoalsLayout /> }
                </Box>
            </Box>
        // </div>
    );
}
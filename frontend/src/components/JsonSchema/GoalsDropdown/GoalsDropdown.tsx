import { FormControl, FormLabel, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';
import { useAppSelector } from '../../../hooks';
import './GoalsDropdown.css';

interface GoalsDropdownProps {
    id?: string;
    value: string;
    updateValue: (newValue: string) => void;
    startHint?: string,
    endHint?: string,
    title?: string,
    enabled?: boolean,
}

export const GoalsDropdown: React.FC<GoalsDropdownProps> = (props) => {
    const {
        updateValue,
        value,
        title,
        enabled,
    } = props;

    const goalsState = useAppSelector(state => state.goalsState);

    return (
        <div className='goals-dropdown-container'>
            {/* {title && <FormLabel>{title}</FormLabel>} */}
    
            <FormControl fullWidth variant="standard">
                <InputLabel id="review-goals-dropdown">{title}</InputLabel>
                <Select
                    labelId="review-goals-dropdown"
                    id="demo-simple-select"
                    value={value}
                    label="Goals"
                    onChange={(e) => updateValue(e.target.value)}
                >
                    {goalsState.goals.map(goal => <MenuItem key={goal.id} value={goal.id}>{goal.name}</MenuItem>)}
                </Select>
            </FormControl>
        </div>
       
    )

}
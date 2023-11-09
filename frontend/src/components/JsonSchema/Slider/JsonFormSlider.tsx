import { update } from '@jsonforms/core';
import { FormControl, FormLabel, InputLabel, MenuItem, Select, Slider } from '@mui/material';
import React from 'react';
import { useAppSelector } from '../../../hooks';
import './JsonFormSlider.css';

interface JsonFormSliderProps {
    id?: string;
    value: number;
    updateValue: (newValue: number) => void;
    startHint?: string,
    endHint?: string,
    title?: string,
    enabled?: boolean,
}

export const JsonFormSlider: React.FC<JsonFormSliderProps> = (props) => {
    const {
        updateValue,
        value,
        title,
        enabled,
    } = props;

    const goalsState = useAppSelector(state => state.goalsState);

    const handleChange = (e: Event, value: number | number[]) => {
        if (Array.isArray(value)) {
            updateValue(value[0]);
        } else {
            updateValue(value);
        }
    }
    

    return (
        <div className='json-forms-slider-container'>
            {title && <FormLabel>{title}</FormLabel>}
    
            <FormControl fullWidth variant="standard" className='json-form-slider-form-control'>
                <Slider value={value} onChange={handleChange} valueLabelDisplay="on"/>
            </FormControl>
        </div>
       
    )

}
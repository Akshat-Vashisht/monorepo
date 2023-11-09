import React from 'react';
import { FormLabel } from '@mui/material';

import './YesNo.css';
interface YesNoProps {
  id?: string;
  value: boolean;
  updateValue: (newValue: boolean) => void;
  startHint?: string,
  endHint?: string,
  title?: string,
  enabled?: boolean,
}

export const YesNo: React.FC<YesNoProps> = (props) => {
    const {
        updateValue,
        value,
        title,
        enabled,
    } = props;

    return(
        <div className='yes-no-containe'>
            {title && <FormLabel>{title}</FormLabel>}
            <div className='yes-no-container'>
                <div 
                    className={`yes-no-option${value  ? " yes-no-option-active": ""}`}
                    key={'yes-option'}
                    onClick={() => enabled && updateValue(true)}
                >
                    Yes
                </div>
                <div 
                    className={`yes-no-option${value === false ? " yes-no-option-active": ""}`}
                    key={'no-option'}
                    onClick={() => enabled && updateValue(false)}
                >
                    No
                </div>
            </div>
        </div>
    );
};
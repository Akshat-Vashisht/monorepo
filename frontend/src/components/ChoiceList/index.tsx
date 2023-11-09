import React, { useEffect } from 'react';

import './ChoiceList.css';

interface Props {
    startHint?: string,
    endHint?: string,
    options: Array<number | string>,
    selectedVal: number | string |  undefined,
    onSelectedValChange: (val: string | number) => void,
};

export default function ChoiceList(props: Props) {
    const {
        startHint,
        endHint,
        options,
        onSelectedValChange,
        selectedVal,
    } = props;

    return(
        <div className='choice-list-container'>
            {startHint && <div className='choice-list-hint'>
                {startHint}
            </div>}
            {options.map((option, idx) => {
                return(
                    <div 
                        className={`choice-list-option${selectedVal === option ? " choice-list-option-active": ""}`}
                        key={option}
                        onClick={() => onSelectedValChange(option)}
                    >
                        {option}
                    </div>
                )
            })}
            {endHint && <div className='choice-list-hint'>
                {endHint}
            </div>}
        </div>
    );
}
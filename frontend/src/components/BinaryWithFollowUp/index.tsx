import React, {ChangeEvent} from 'react';

import './BinaryWithFollowUp.css';

interface Props {
    trueText: string,
    falseText: string,
    onSelectedUpdate: (val: boolean) => void,
    selected: boolean | undefined,
    children: React.ReactNode
}

export default function BinaryWithFollowUp(props: Props) {
    const {
        trueText,
        falseText,
        onSelectedUpdate,
        selected,
        children,
    } = props;


    return(
        <div className='binary-with-follow-up-container'>
            <div 
                className={`bwfu-option${selected ? " bwfu-option-active" : ""}`}
                onClick={() => {onSelectedUpdate(true)}}
            >
                {trueText}
            </div>
            <div 
                className={`bwfu-option${selected === false ? " bwfu-option-active" : ""}`}
                onClick={() => {onSelectedUpdate(false)}}
            >
                {falseText}
            </div>
            <div>
                {children}
            </div>

        </div>
    )
}
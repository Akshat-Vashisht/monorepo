import React from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import { CircularProgressbarStyles } from 'react-circular-progressbar/dist/types';
// import 'react-circular-progressbar/dist/styles.css';

import './ProgressCircle.css';


interface Props {
    progress: number;
    description?: string;
    styles?: CircularProgressbarStyles,
}
export default function ProgressCircle(props: Props) {
    const {
        progress,
        description,
        styles,
    } = props;
    return(
        <div className='progress-circle-container'>
            {/* <div className='progress-circle-circle'>
                <div className='progress-circle-percentage'>
                </div>
            </div> */}
            <CircularProgressbar 
                value={progress}
                text={description}
                strokeWidth={12}
                styles={styles}
            />
        </div>
    )
}
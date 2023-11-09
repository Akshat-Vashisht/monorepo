import React from 'react';
import "./ProgressBar.css";

interface Props {
    progress: number,
    description?: string,
    startHint?: string | number,
    midHint?: string | number,
    endHint?: string | number,
}

export default function ProgressBar( props: Props) {
    const {
        startHint,
        midHint,
        endHint
    } = props;
    return (
        <div {...props} className='progress-bars'>
            <div className="progress-bar-container">
                <div className='progress-bar-progress' style={{width: "" + props.progress + "%"}}></div>
            </div>
            <div className="progress-bar-hints">

                { startHint && <div className="progress-bar-hints-start">
                    {startHint}
                </div>}
                { midHint && <div className="progress-bar-hints-mid">
                    {midHint}
                </div>}
                { endHint && <div className="progress-bar-hints-end">
                    {endHint}
                </div>}
            </div>
            {props.description && <div className="progress-bar-description">{props.description}</div>}
        </div>
    );
}
import React from 'react';

import './HomeWidget.css';

interface Props {
    children: React.ReactNode;
    mainText: string;
    subText: string;
    onClick?: () => void;
}

export default function HomeWidget(props: Props) {
    
    const {
        children,
        mainText,
        subText,
        onClick,
    } = props;
    return(
        <div className='hw-container' onClick={onClick}>
            <div className='hw-children'>
                {children}
            </div>
            <div className='hw-main-text'>
                {mainText}
            </div>
            <div className='hw-sub-text'>
                {subText}
            </div>
        </div>
    );
}
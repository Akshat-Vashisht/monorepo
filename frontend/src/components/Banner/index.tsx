import React from 'react';

interface Props {
    message: string,
}

export default function Banner(props: Props) {
    return (
        <div style={{backgroundColor:"orange", height:32, padding:8, fontSize:32}}>
            {props.message}
        </div>
    );
}
import React from 'react';
import { CiSearch } from 'react-icons/ci'

import './Search.css';


export default function Search() {
    return(
        <>
            <span className="search-container">
                <CiSearch className="search-icon" />
                <input className="search-input" type="search" placeholder={"Search"}/>
            </span>
        </>
    )
}
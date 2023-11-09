import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { setAuthState } from '../../reducers/SessionSlice';

import './Navbar.css';
import { useAppSelector } from '../../hooks';
import { AuthState, Role } from '../../types';
import { useDispatch } from 'react-redux';


export default function Navbar() {
    const dispatch = useDispatch();
    const location = useLocation();

    const sessionState = useAppSelector((state) => state.sessionState);

    const getPageName = () => {
        if (location.pathname === "/") {
            return "Home";
        }
        return 'Dashboards';
    };

    return(
        <div className="navigation-container">
            <div className="nav-info">
                <div className="nav-page-name">
                    Pago Admin Console
                </div>
                <div className="nav-buttons">

                    {sessionState.authState !== AuthState.AUTHENTICATED && 
                        <Link to="login">
                            <span>Log in</span>
                        </Link>
                    }
                    
                    {sessionState.authState === AuthState.AUTHENTICATED && 
                        <Link to="logout" onClick={() => dispatch(setAuthState(AuthState.UNAUTHENTICATED))}>
                            <span>Log out</span>
                        </Link>
                    }
                </div>
            </div>
            <div className="nav-and-search" >
                <nav className="navbar">
                    <NavLink to="/">
                        <span>Home</span>
                    </NavLink> 
                </nav>
            </div>
        </div>
    )
}
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { masqueradeAsUserAsync } from '../../reducers/SessionSlice';
import { getUsersAsync } from '../../reducers/UsersSlice';
import { LoadState } from '../../types';
 import './Masquerade.css';

export default function Masquerade() {
    const dispatch = useAppDispatch();
    const { sessionState, usersState } = useAppSelector((state) => state);

    useEffect(() => {
        if (usersState.loadState === LoadState.INIT) {
            dispatch(getUsersAsync());
        }
    }, [usersState.loadState])

    const onMasqueradeClick = (e: SelectChangeEvent<string>) => {
        dispatch(masqueradeAsUserAsync(e.target.value));
    }

    return (
        <div className='masquerade-container' >
            <label>(Admins Only) Masquerade as </label>
            {usersState.loadState === LoadState.LOADED &&
                 <Select
                    labelId="masquerade-user-dropdown"
                    id="masquerade-user-dropdown"
                    value={sessionState.masqueradeUserId}
                    label="Role"
                    onChange={onMasqueradeClick}
                >
                    {usersState.users.map(user => 
                        <MenuItem value={user.id}>{`${user.givenName} ${user.familyName} ${user.id === sessionState.user.id ? '(You)' : ''}`}</MenuItem>
                    )}
                </Select>
                }
        </div>
        
    )
}
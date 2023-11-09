import React, { ChangeEvent, useEffect, useState } from 'react';
import { ColorRing } from 'react-loader-spinner';
import { InviteUserRequest, UpdateUserRequest } from '../../apiTypes';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { getUsersAsync, inviteUserAsync, setInviteUserLoadState, updateUserAsync, uploadOrgDataAsync } from '../../reducers/UsersSlice';
import { LoadState, Role, User } from '../../types';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material';

import './Account.css';
import { getRolesAsList } from '../../utils';
import { uploadCompDataAsync } from '../../reducers/CompensationSlice';
import { validate } from '@jsonforms/core';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
};

interface InviteUserRequestValidation {
    firstName: boolean,
    lastName: boolean,
    email: boolean,
    role: boolean,
};

const defaultInviteUserRequestValidation = {
    firstName: true,
    lastName: true,
    email: true,
    role: true,
}

export default function Account() {
    

    const dispatch = useAppDispatch();
    const usersState = useAppSelector((state) => state.usersState);
    const [isInviteUsersModalOpen, setisInviteUsersModalOpen] = useState(false);
    const [inviteUserRequest, setInviteUserRequest] = useState<InviteUserRequest>({role: Role.User});
    const  [validation, setValidation] = useState<InviteUserRequestValidation>(defaultInviteUserRequestValidation);
    const [file, setFile] = useState<File | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
    const [isUpdateUserModalOpen, setIsUpdateUserModalOpen] = useState(false);


    useEffect(() => {
        if (usersState.loadState === LoadState.INIT) {
            dispatch(getUsersAsync());
        }
    }, [usersState.loadState, dispatch]);

    const renderUser = (user: User) => {
        return (
            <div className='account-user-row'>
                
                <div className='account-user-row-name'>
                    {user.givenName} {user.familyName}
                </div>
                <div className=''>{user.role}</div>
                <Button
                    className='account-edit-user-button'
                    onClick={() => {setIsUpdateUserModalOpen(true); setSelectedUser({...user});}}
                >
                    Edit
                </Button>
            </div>
        )
    }

    const onInviteClick = () => {
        setisInviteUsersModalOpen(true);
    }

    const onCloseModalClick = () => {
        dispatch(setInviteUserLoadState(LoadState.INIT));
        setisInviteUsersModalOpen(false);
        setIsUpdateUserModalOpen(false);
        setInviteUserRequest({});
        setSelectedUser(undefined);
    }

    const validateInviteUserRequest = () => {
        let allValid = true;
        const v = {...defaultInviteUserRequestValidation};
        if (!inviteUserRequest.firstName) {
            v.firstName = false;
            allValid = false;
        }

        if (!inviteUserRequest.lastName) {
            v.lastName = false;
            allValid = false;
        }

        if (!inviteUserRequest.email) {
            v.email = false;
            allValid = false;
        }

        if (!inviteUserRequest.role) {
            v.role = false;
            allValid = false;
        }

        setValidation(v);
        return allValid;
    }

    const onRoleUpdate = (e: SelectChangeEvent<Role>) => {
        const val = e.target.value as keyof typeof Role;
        setInviteUserRequest({...inviteUserRequest, role: Role[val]});
        setSelectedUser({...selectedUser, role: Role[val]});
    }

    const onSendInviteClick = () => {
        if (validateInviteUserRequest()) {
            inviteUserRequest.userName = inviteUserRequest.email;
            dispatch(inviteUserAsync(inviteUserRequest));
        } else {
            console.log('not valid');
        }
    }

    const onSendUpdateClick = () => {
        if (selectedUser === undefined) {
            return;
        }
        const updateUserRequest: UpdateUserRequest = {
            id: selectedUser.id!,
            email: selectedUser.email,
            userRole: selectedUser.role,
        }
        dispatch(updateUserAsync(updateUserRequest));
    }

    const onUploadCompClick = () => {
        if (file) {
            dispatch(uploadCompDataAsync(file));
        }
    }

    const onUploadOrgClick = () => {
        if (file) {
            dispatch(uploadOrgDataAsync(file));
        }
    }

    const onFileSelect = (e: ChangeEvent<HTMLInputElement> ) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    }

    const renderUsers = () => {
        return(
            <div className='account-users-card'>
                <div className='account-users-card-header'>
                    <h2>Users</h2>
                    <button onClick={onInviteClick}>Invite Users</button>
                </div>
                <div className='account-users-list'>
                <table>
                    <tr>
                        <th>
                            First name
                        </th>
                        <th>
                            Last name
                        </th>
                        <th>
                            Role
                        </th>
                        <th>
                            Edit
                        </th>
                    </tr>
                    {usersState.users.map(usr => 
                        <tr>
                            <td>{usr.givenName}</td>
                            <td>{usr.familyName}</td>
                            <td>{usr.role}</td>
                            <td>
                                <Button
                                    className='account-edit-user-button'
                                    onClick={() => {setIsUpdateUserModalOpen(true); setSelectedUser({...usr});}}
                                >
                                    Edit
                                </Button>
                            </td>
                        </tr>)}

                </table>
                </div>
            </div>
        )
    }

    return(
        <div>
            <ColorRing
                visible={usersState.loadState === LoadState.LOADING}
                height="80"
                width="80"
                ariaLabel="blocks-loading"
                wrapperStyle={{}}
                wrapperClass="blocks-wrapper"
                colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
            />

            <div className='account-upload-data-buttons'>
                <input type="file" accept="csv" onChange={onFileSelect}/>
                <Button
                    className='account-upload-data-button'
                    variant="contained" 
                    sx={{background: "#041F4C"}}
                    onClick={onUploadCompClick}
                >
                    Upload compensation data
                </Button>
                
                <Button
                    className='account-upload-data-button'
                    variant="contained" 
                    sx={{background: "#041F4C"}}
                    onClick={onUploadOrgClick}
                >
                    Upload org chart data
                </Button>
            </div>
            
            {(true || usersState.loadState === LoadState.LOADED) &&
                renderUsers()
            }

            <Dialog
                open={isInviteUsersModalOpen}
                onClose={onCloseModalClick}
           
            >
                <DialogTitle>Invite a user to Pago</DialogTitle>
                <DialogContent>
                    {/* <DialogContentText>
                        To subscribe to this website, please enter your email address here. We
                        will send updates occasionally.
                    </DialogContentText> */}
                    <ColorRing
                        visible={usersState.inviteUserLoadState === LoadState.LOADING}
                        height="80"
                        width="80"
                        ariaLabel="blocks-loading"
                        wrapperStyle={{}}
                        wrapperClass="blocks-wrapper"
                        colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
                    />
                    {usersState.inviteUserLoadState === LoadState.LOADED && "Success"}
                    {usersState.inviteUserLoadState === LoadState.ERROR && "Error"}
                    <FormControl>
                    <TextField
                        required
                        autoFocus
                        error={!validation.firstName}
                        margin="dense"
                        id="firstName"
                        label="First name"
                        fullWidth
                        variant="standard"
                        helperText={!validation.firstName && "First name is required"}
                        value={inviteUserRequest.firstName}
                        onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {setInviteUserRequest({...inviteUserRequest, firstName: e.target.value})}}
                    />
                    <TextField
                        required
                        error={!validation.lastName}
                        margin="dense"
                        id="lastName"
                        label="Last name"
                        fullWidth
                        variant="standard"
                        helperText={!validation.lastName && "Last name is required"}
                        value={inviteUserRequest.lastName}
                        onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {setInviteUserRequest({...inviteUserRequest, lastName: e.target.value})}}
                    />
                    <TextField
                        required
                        error={!validation.email}
                        margin="dense"
                        id="email"
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="standard"
                        helperText={!validation.email && "Email is required"}
                        value={inviteUserRequest.email}
                        onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {setInviteUserRequest({...inviteUserRequest, email: e.target.value})}}
                    />
                    {/* <InputLabel id="user-role-dropdown">Role</InputLabel> */}
                    <Select
                        required
                        error={!validation.role}
                        labelId="user-role-dropdown"
                        id="user-role-dropdown"
                        value={inviteUserRequest.role}
                        label="Role"
                        onChange={onRoleUpdate}
                    >
                        {getRolesAsList().map(role => 
                            <MenuItem value={role}>{role}</MenuItem>
                        )}
                    </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCloseModalClick}>Cancel</Button>
                    <Button onClick={onSendInviteClick}>Invite</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={isUpdateUserModalOpen}
                onClose={onCloseModalClick}
           
            >
                <DialogTitle>Update user</DialogTitle>
                <DialogContent>
                    {/* <DialogContentText>
                        To subscribe to this website, please enter your email address here. We
                        will send updates occasionally.
                    </DialogContentText> */}
                    <ColorRing
                        visible={usersState.inviteUserLoadState === LoadState.LOADING}
                        height="80"
                        width="80"
                        ariaLabel="blocks-loading"
                        wrapperStyle={{}}
                        wrapperClass="blocks-wrapper"
                        colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
                    />
                    {usersState.inviteUserLoadState === LoadState.LOADED && "Success"}
                    {usersState.inviteUserLoadState === LoadState.ERROR && "Error"}
                    <FormControl>
                    <TextField
                        required
                        autoFocus
                        error={!validation.firstName}
                        margin="dense"
                        id="firstName"
                        label="First name"
                        fullWidth
                        variant="standard"
                        helperText={!validation.firstName && "First name is required"}
                        value={selectedUser?.givenName}
                        onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {setSelectedUser({...selectedUser, givenName: e.target.value})}}
                    />
                    <TextField
                        required
                        error={!validation.lastName}
                        margin="dense"
                        id="lastName"
                        label="Last name"
                        fullWidth
                        variant="standard"
                        helperText={!validation.lastName && "Last name is required"}
                        value={selectedUser?.familyName}
                        onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {setSelectedUser({...selectedUser, familyName: e.target.value})}}
                    />
                    <TextField
                        required
                        error={!validation.email}
                        margin="dense"
                        id="email"
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="standard"
                        helperText={!validation.email && "Email is required"}
                        value={selectedUser?.email}
                        onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {setSelectedUser({...selectedUser, email: e.target.value})}}
                    />
                    {/* <InputLabel id="user-role-dropdown">Role</InputLabel> */}
                    <Select
                        required
                        error={!validation.role}
                        labelId="user-role-dropdown"
                        id="user-role-dropdown"
                        value={selectedUser?.role}
                        label="Role"
                        onChange={onRoleUpdate}
                    >
                        {getRolesAsList().map(role => 
                            <MenuItem value={role}>{role}</MenuItem>
                        )}
                    </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCloseModalClick}>Cancel</Button>
                    <Button onClick={onSendUpdateClick}>Update</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}
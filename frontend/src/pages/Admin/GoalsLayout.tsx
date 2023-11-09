import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, styled, Table, TableBody, TableCell, tableCellClasses, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { ColorRing } from 'react-loader-spinner';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { createGoalAsync, getGoalsAsync, getReviewsPerGoalsAsync } from '../../reducers/GoalsSlice';
import { Goal, LoadState } from '../../types';

export default function GoalsLayout() {
    const dispatch = useAppDispatch();
    const goalsState = useAppSelector(state => state.goalsState);
    const [addModalOpen, setAddModalOpen] = useState(false);
    useEffect(() => {
        if (goalsState.loadState === LoadState.INIT) {
            dispatch(getGoalsAsync());
        }
        if (goalsState.reviewsPerGoalLoadState === LoadState.INIT) {
            dispatch(getReviewsPerGoalsAsync());
        }
    }, [goalsState.loadState]);

    const [goalName, setGoalName] = useState('');
    const [goalDescription, setGoalDescription] = useState('');

    const StyledTableCell = styled(TableCell)(({ theme }) => ({
        [`&.${tableCellClasses.head}`]: {
          borderBottom: 'none',
          color: '#041F4C',
        },
        [`&.${tableCellClasses.body}`]: {
          fontSize: 14,
          borderBottom: 'none',
          color:'#041F4C',
        },
      }));
    
    const renderGoals = (goals: Goal[]) => {
        return(
            <TableContainer>
                <Table >
                    <TableHead>
                        <TableRow>
                            <StyledTableCell>
                                <h3>Goal</h3>
                            </StyledTableCell>
                            <StyledTableCell>
                                <h3>Description</h3>
                            </StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {goals.map(g => <TableRow>
                            <StyledTableCell>
                                {g.name}
                            </StyledTableCell>  
                            <StyledTableCell>
                                {g.description}
                            </StyledTableCell>  
                        </TableRow>)}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }

    const onCloseModal = () => {
        setAddModalOpen(false);
    }

    const onAddGoalClick = () => {
        setGoalName('');
        setGoalDescription('');
        setAddModalOpen(true);
    }

    const onCreate = () => {
        dispatch(createGoalAsync({name: goalName, description: goalDescription}));
    }

    const goalEditor = () => {
        return(
            <>
            
            <Dialog
                open={addModalOpen}
                onClose={onCloseModal}
            >
                <DialogTitle>Add a new Goal</DialogTitle>
                <DialogContent>
                    <FormControl>
                        {goalsState.createLoadState === LoadState.LOADED && <p>Successfully saved</p>}
                        {goalsState.createLoadState === LoadState.ERROR && <p>Error saving</p>}
                        <TextField
                            required
                            type="text"
                            margin="dense"
                            id="goalName"
                            label="Name"
                            fullWidth
                            variant="standard"
                            value={goalName}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setGoalName(e.currentTarget.value)}
                            className='merit-increase-setting-modal-input'
                            sx={{margin: '8px'}}
                        />
                        <TextField
                            required
                            type="text"
                            margin="dense"
                            id="goalDescription"
                            label="Description"
                            fullWidth
                            variant="standard"
                            value={goalDescription}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setGoalDescription(e.currentTarget.value)}
                            className='merit-increase-setting-modal-input'
                            sx={{margin: '8px'}}
                        />
                    </FormControl>
                    <ColorRing
                        visible={goalsState.createLoadState === LoadState.LOADING}
                        height="80"
                        width="80"
                        ariaLabel="blocks-loading"
                        wrapperStyle={{}}
                        wrapperClass="blocks-wrapper"
                        colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
                    />
                    
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCloseModal}>Cancel</Button>
                    <Button onClick={onCreate}>Create</Button>
                </DialogActions>
            </Dialog>
            </>
        );
    }

    return(
        <>
            {goalsState.loadState === LoadState.LOADED && 
                <div>
                    <div>
                        <h1>Goals</h1>
                        <Button onClick={onAddGoalClick}>Add goal</Button>
                    </div>
                    {renderGoals(goalsState.goals)}
                    {goalEditor()}
                </div>

            }

            <ColorRing
                visible={goalsState.loadState === LoadState.LOADING}
                height="80"
                width="80"
                ariaLabel="blocks-loading"
                wrapperStyle={{}}
                wrapperClass="blocks-wrapper"
                colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
            />
        </>
    )
}
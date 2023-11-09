import { styled, Table, TableBody, TableCell, tableCellClasses, TableContainer, TableHead, TableRow } from '@mui/material';
import React, { useEffect } from 'react';
import { ColorRing } from 'react-loader-spinner';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { getGoalsAsync } from '../../reducers/GoalsSlice';
import { Goal, LoadState, Review } from '../../types';
import './Goals.css';

export default function Goals() {
    const goalsState = useAppSelector(state => state.goalsState);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (goalsState.loadState === LoadState.INIT) {
            dispatch(getGoalsAsync());
        }
    }, [goalsState.loadState]);

    const StyledTableCell = styled(TableCell)(({ theme }) => ({
        [`&.${tableCellClasses.head}`]: {
          borderBottom: 'none',
          color: '#041F4C',
        },
        [`&.${tableCellClasses.body}`]: {
          fontSize: 16,
          borderBottom: 'none',
          color:'#041F4C',
          fontWeight: '700',
        },
      }));

    const renderReviews = (reviews: Review[]) => {
        return(
            <TableContainer>
                <Table >
                    <TableHead>
                        <TableRow>
                            <StyledTableCell>
                                <h2>Date</h2>
                            </StyledTableCell>
                            <StyledTableCell>
                                <h2>Project</h2>
                            </StyledTableCell>
                            <StyledTableCell>
                                <h2>Employee</h2>
                            </StyledTableCell>
                            <StyledTableCell>
                                <h2>Description</h2>
                            </StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reviews.map(r => <TableRow>
                            <StyledTableCell>
                                {new Date(r.submittedAt || 0).toLocaleDateString()}
                            </StyledTableCell>  
                            <StyledTableCell>
                                {r.projectName}
                            </StyledTableCell>  
                            <StyledTableCell>
                                {r.submittedByName}
                            </StyledTableCell>  
                            <StyledTableCell>
                                {r.projectDescription}
                            </StyledTableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }

    const renderGoalWithReviews = (goal: Goal) => {
        const reviews = goalsState.reviewsPerGoal[goal.id] || [];
        return(
            <div className='goals-review-container'>
                <h2>{goal.name}</h2>
                {renderReviews(reviews)}
            </div>
        )
    }


    return(
        <div className='goals-container'>
            <h1>Goals Dashboard</h1>
            {goalsState.loadState === LoadState.LOADED &&
                goalsState.goals.map(goal => renderGoalWithReviews(goal))
            } 

            <ColorRing
                visible={goalsState.loadState === LoadState.LOADING }
                height="80"
                width="80"
                ariaLabel="blocks-loading"
                wrapperStyle={{}}
                wrapperClass="blocks-wrapper"
                colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
            />
        </div>
    )
}
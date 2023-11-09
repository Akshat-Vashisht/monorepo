import React, { useEffect, useMemo } from 'react';
import { ColorRing } from 'react-loader-spinner';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../../components/ProgressBar';
import ProgressCircle from '../../components/ProgressCircle';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { getReviewsAsync, reviewsSlice } from '../../reducers/ReviewsSlice';
import { getEmployeeScoreAsync, getSummaryAsync } from '../../reducers/ScoresSlice';
import { LoadState, ProjectSizeSummary, Summary } from '../../types';
import { Review } from '../../types';
import './Performance.css';

const projectSizeToDescription = {
    'Existential': 'The company will fail if I do a bad job',
    'Large': 'My Org will succeed if I do a good job',
    'Medium': 'My Team will succeed if I do a good job',
    'Small': 'Normal day to day tasks',
};

export default function Performance() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const scoresState = useAppSelector((state) => state.scoresState);
    const sessionState = useAppSelector((state) => state.sessionState);
    const reviewsState = useAppSelector((state) => state.reviewsState);

    useEffect(() => {
        if (sessionState.loadState === LoadState.LOADED && scoresState.loadState === LoadState.INIT) {
            dispatch(getSummaryAsync());
        }

        if (sessionState.loadState === LoadState.LOADED && reviewsState.loadState === LoadState.INIT) {
            dispatch(getReviewsAsync());
        }
    }, [sessionState.loadState, scoresState.loadState, reviewsState.loadState]);

    const reviewsById = useMemo(() => {
        return reviewsState.completedReviews.reduce((reviews: any, review) => {
            reviews[review.id!] = review;
            return reviews;
        }, {});
    }, [reviewsState.completedReviews]);

    const onSummaryClick = (reviewId: string) => {
        navigate(`/review/${reviewId}`);
    }


    const renderProjectSummary = (
        size: string, 
        employeeScoreImpact: number | undefined,
        topSubText: string,
    ) => 
        <div className={'performance-project-size-summary-container'}>
            <div className='performance-project-size-summary-header'>
                {size}<br/> projects
            </div>
            <div className='performance-project-size-summary-subText'>
                {topSubText}
            </div>
            <div className='performance-project-size-summary-progress-circle'>
                <ProgressCircle progress={(employeeScoreImpact || 0) * 100} />
            </div>
            <div className='performance-project-size-summary-subText'>
                {(employeeScoreImpact || 0) * 100}% of your scores came from these projects
            </div>
        </div>
    

    const getProjectSummary = () => {
        return(
            <div className='performance-project-size-summaries-container'>
                {renderProjectSummary(
                    'Existential',
                    scoresState.summaries.find(s => s.projectSize === 1)?.employeeScoreImpact,
                    projectSizeToDescription['Existential']
                )}

                {renderProjectSummary(
                    'Large',
                    scoresState.summaries.find(s => s.projectSize === 2)?.employeeScoreImpact,
                    projectSizeToDescription['Large'],
                )}

                {renderProjectSummary(
                    'Medium',
                    scoresState.summaries.find(s => s.projectSize === 3)?.employeeScoreImpact,
                    projectSizeToDescription['Medium'],
                )}

                {renderProjectSummary(
                    'Small',
                    scoresState.summaries.find(s => s.projectSize === 4)?.employeeScoreImpact,
                    projectSizeToDescription['Small'],
                )}
            </div>
        )
    }

    const renderRecentReviews = (
        projectSize: keyof typeof projectSizeToDescription,
        projectSizeSummary: Summary | undefined,
    ) => {
        return(
            <div className='performance-project-recent-reviews'>
                <div className='performance-project-recent-review-score'>
                    <div className='performance-employee-score-header-container'>
                        <div className='performance-employee-score-header'>
                            {projectSize}
                        </div>
                        <div className='performance-employee-score-subtext'>
                            {projectSizeToDescription[projectSize]}
                        </div>
                    </div> 
                    {!!projectSizeSummary ?
                     <ProgressBar progress={(projectSizeSummary.averageScore )/ .10} description={`Your Average ${projectSizeSummary.averageScore}`}/> :
                     <h2>No reviews of this size yet</h2>}
                </div>
                {projectSizeSummary && projectSizeSummary.recentReviews?.map(rr => <div className='performance-recent-review-summary' onClick={() => onSummaryClick(rr.reviewId)}>
                        <div className='performance-project-recent-review-project-name-row'>
                            <div className='performance-project-recent-review-project-name'>
                                {reviewsById[rr.reviewId] ? reviewsById[rr.reviewId].projectName : 'Error loading review details'}
                            </div>
                            <div className='performance-project-recent-review-impact'>
                                <div className='performance-project-recent-review-circle'>
                                    <ProgressCircle progress={rr.employeeScoreImpact * 100} />
                                </div>
                                <span className='performance-recent-review-impact-subText'>
                                        {(projectSizeSummary.employeeScoreImpact) * 100}% of your scores came from these projects
                                </span>
                            </div>
                        </div>
                        <div className='performance-project-recent-review-details'>
                            
                            <div className='performance-project-summary-item'>
                                <table className='performance-project-summary-item-table'>
                                    <tr>
                                        <td>
                                            Overall project performance
                                        </td>
                                        <td style={{width: '300px'}}>
                                            <ProgressBar progress={(rr.score) / .10} description={`${projectSizeSummary.averageScore}`}/>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>)}
            </div>
        )
    }


    return(
        <div className='performance-container'>
            {scoresState.loadState === LoadState.LOADED && 
                <>
                    <h1>Performance Dashboard</h1>
                    <div className='performance-employee-score-container'>
                        <div className='performance-employee-score-header-container'>
                            <div className='performance-employee-score-header'>
                                Perfomance
                            </div>
                            <div className='performance-employee-score-subtext'>
                                Your weighted reviews over time
                            </div>
                        </div>
                        <ProgressBar progress={(scoresState.employeeScore || 0 )/ .10} description={`Average ${scoresState.employeeScore || 0}`}/>
                    </div>
                    {getProjectSummary()}
                    {renderRecentReviews('Existential', scoresState.summaries.find(s => s.projectSize === 1))}
                    {renderRecentReviews('Large', scoresState.summaries.find(s => s.projectSize === 2))}
                    {renderRecentReviews('Medium', scoresState.summaries.find(s => s.projectSize === 3))}
                    {renderRecentReviews('Small', scoresState.summaries.find(s => s.projectSize === 4))}
                </>
            }

            <ColorRing
                visible={scoresState.loadState === LoadState.LOADING }
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
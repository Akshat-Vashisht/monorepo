import React, { useEffect } from 'react';

import ReviewCard from '../../components/ReviewCard';
import { BsFillPlusCircleFill } from 'react-icons/bs';
import './Reviews.css';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCoworkerReviewsAsync, getReviewsAsync, startNewReview } from '../../reducers/ReviewsSlice';
import { LoadState } from '../../types';
import { ColorRing } from 'react-loader-spinner';

export default function Reviews() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const reviewsState = useAppSelector(state => state.reviewsState);
    const sessionState = useAppSelector(state => state.sessionState);
    
    useEffect(() => {
        const sub = searchParams.get("sub");
        if (!sub && reviewsState.loadState === LoadState.INIT) {
            dispatch(getReviewsAsync())
        }

        if (sub && (reviewsState.coworkerReviewsSub !== sub || reviewsState.coworkerReviewsLoadState === LoadState.INIT)) {
            dispatch(getCoworkerReviewsAsync(sub));
        }

    }, [sessionState.loadState, dispatch, reviewsState.loadState])

    const onAddReviewClick = () => {
        dispatch(startNewReview('endproj'));
        navigate("/review");
    }

    const onAddMidProjReviewClick = () => {
        dispatch(startNewReview('midproj'));
        navigate("/review");
    }

    const onAddOngoingReviewClick = () => {
        dispatch(startNewReview('ongoing'));
        navigate("/review");
    }

    const getRequestedReviews = () => {
        const requested_sub = searchParams.get("sub");
        return requested_sub ? reviewsState.coworkerRequestedReviews : reviewsState.requestedReviews;
    }

    const getCompletedReviews = () => {
        const requested_sub = searchParams.get("sub");
        return requested_sub ? reviewsState.coworkerCompletedReviews : reviewsState.completedReviews;
    }

    return(
        <div className='reviews-container'>
            <h2>
                Your reviews
            </h2>
            <div className='reviews-header'>
                <div className='reviews-add' onClick={onAddOngoingReviewClick}>
                    <BsFillPlusCircleFill /> Add an Ongoing Responsibilities review
                </div>
                <div className='reviews-add' onClick={onAddMidProjReviewClick}>
                    <BsFillPlusCircleFill /> Add a Mid-Project review
                </div>
                <div className='reviews-add' onClick={onAddReviewClick}>
                    <BsFillPlusCircleFill /> Add a finished project review
                </div>
            </div>
            <ColorRing
                visible={reviewsState.loadState === LoadState.LOADING }
                height="80"
                width="80"
                ariaLabel="blocks-loading"
                wrapperStyle={{}}
                wrapperClass="blocks-wrapper"
                colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
            />
            <h3>
                Review Requests
            </h3>
            <div className='reviews-cards-container'>

                {
                    getRequestedReviews().map((review) => 
                        <ReviewCard review={review} key={review.id}  onClick={() => navigate(`/review/${review.id}/direct_report`)}/>
                    )
                }
            </div>

            <h3>
                Completed reviews
            </h3>
            <div className='reviews-cards-container'>

                {
                    getCompletedReviews().map((review) => 
                        <ReviewCard review={review} key={review.id} onClick={() => navigate(`/review/${review.id}`)} />
                    )
                }
            </div>
        </div>
    )
}
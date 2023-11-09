import React, {useState, useEffect} from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { LoadState, Review } from '../../types';

import './DirectReportReviewEdit.css';
import { getReviewsAsync, getPeerReviewWithIdAsync, resetActiveReviewState, submitPeerReviewAsync } from '../../reducers/ReviewsSlice';
import { useParams } from 'react-router-dom';
import { ColorRing } from 'react-loader-spinner';
import ReviewForm from '../../components/ReviewForm';

export default function DirectReportReviewEdit() {
    // When there is a reviewId then we are in view only mode. This is a completed review.
    const { reviewId } = useParams();
    const dispatch = useAppDispatch();
    const reviewsState = useAppSelector((state) => state.reviewsState);
    const sessionState = useAppSelector(state => state.sessionState);
    const [review, setReviewHook] = useState<Review | undefined>(reviewsState.activeReview);
    
    const setReview = (review: Review) => {
        setReviewHook(review);
    }

    useEffect(() => {
        return function cleanup() {
            dispatch(resetActiveReviewState());
        }
    }, [dispatch]);

    useEffect(() => {
        if (sessionState.loadState === LoadState.LOADED && 
            reviewsState.activeReviewLoadState === LoadState.INIT) {
            dispatch(getPeerReviewWithIdAsync(reviewId || ''))
        } else if (reviewsState.activeReviewLoadState === LoadState.LOADED) {
            setReview(reviewsState.activeReview!);
        }
    }, [sessionState.loadState, reviewsState.activeReviewLoadState, dispatch]);

    useEffect(() => {
        if (reviewsState.submitReviewLoadState === LoadState.LOADED) {
            dispatch(getReviewsAsync())
        }
    }, [reviewsState.submitReviewLoadState, dispatch]);

    const onSubmitPeerReview = () => {
        dispatch(submitPeerReviewAsync(review || {}));
    }

    const getReviewTemplate = () => (
        <>
            <ReviewForm 
                data={review} 
                onUpdate={setReview} 
                reviewSchemaId={`${review!.schemaId}`} 
                addRandomCultureQuestions
            />
            {<button className='review-edit-submit-button' onClick={onSubmitPeerReview}>Submit</button>}
        </>
    )

    return(
        <div className='review-edit-container'>
            <ColorRing
                visible={reviewsState.activeReviewLoadState === LoadState.LOADING || 
                reviewsState.submitReviewLoadState === LoadState.LOADING }
                height="80"
                width="80"
                ariaLabel="blocks-loading"
                wrapperStyle={{}}
                wrapperClass="blocks-wrapper"
                colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
            />

            {reviewsState.submitReviewLoadState === LoadState.LOADED && <h3>Successfully saved</h3>}
            {reviewsState.submitReviewLoadState === LoadState.ERROR && <h3>Error saving review</h3>}

            {review && getReviewTemplate()}

            {reviewsState.activeReviewLoadState === LoadState.ERROR && <span>Error fetching review</span>}
        </div>
    );
}
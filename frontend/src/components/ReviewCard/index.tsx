import React from 'react';
import { Review } from '../../types';

import './ReviewCard.css';

interface Props {
    review: Review,
    onClick: () => void,
}

export default function ReviewCard(props: Props) {
    const {
        review,
        onClick
    } = props;
    return(
        <div className='review-card-container' onClick={onClick}>
            <div className='review-card-title'>
                {review.projectName} {review.originalReview && "(Direct report review)"}
            </div>
            <div>
                {review.submittedAt && new Date(review.submittedAt).toDateString()}
            </div>
            <div className='review-card-description'>
                {review.projectDescription}
            </div>
            
        </div>
    )
}
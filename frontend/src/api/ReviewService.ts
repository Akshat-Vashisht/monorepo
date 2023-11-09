import { Review } from '../types';
import { $Service } from './Service';


export default class ReviewService extends $Service {
    getReviews(sub?: string) {
        let path = '/reviews';
        if (sub) {
            path += `?sub=${sub}`
        }
        return this.client.get(path);
    }

    getReviewsForGoals() {
        return this.client.get('/reviews/goals');
    }

    getReview(id: string) {
        return this.client.get(`/reviews/${id}`); 
    }

    submitReview(review: Review) {
        return this.client.post('/reviews', review);
    }

    getPeerReview(id: string) {
        return this.client.get(`/reviews/${id}/peer`); 
    }

    submitPeerReview(review: Review, original_review_id: string) {
        return this.client.post(`/reviews/${original_review_id}`, review);
    }
}


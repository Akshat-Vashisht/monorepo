import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { RootState } from '../store';
import { LoadState, ProjectSize, Review, ThunkApiType } from '../types';
import { reviewSortFunction } from '../utils';
import camelize from 'camelize';
import snakeize from 'snakeize';
import { responsiveFontSizes } from '@mui/material';

interface ReviewsState {
    loadState: LoadState,
    completedReviews: Review[],
    requestedReviews: Review[],
    activeReview: Review | undefined,
    activeReviewLoadState: LoadState,
    submitReviewLoadState: LoadState,
    coworkerReviewsLoadState: LoadState,
    coworkerCompletedReviews: Review[],
    coworkerRequestedReviews: Review[]
    coworkerReviewsSub?: string,
};

const initialState: ReviewsState  = {
    loadState: LoadState.INIT,
    completedReviews: [],
    requestedReviews: [],
    activeReview: undefined,
    activeReviewLoadState: LoadState.INIT,
    submitReviewLoadState: LoadState.INIT,
    coworkerReviewsLoadState: LoadState.INIT,
    coworkerCompletedReviews: [],
    coworkerRequestedReviews: [],
};

const initialReview: Review = {
  schemaId: 'endproj',
}


// export const getCompletedReviewAsync = createAsyncThunk<Review, void, ThunkApiType>(
//     'reviewState/getCompletedReview',
//     async (_, thunkApi) => {
//       const state: RootState = thunkApi.getState();
//       const response = thunkApi.extra.api(state).configService.get();
//       // const response = await ConfigService.fetchConfig();
//       return response;
//     }
// );

export const getReviewsAsync = createAsyncThunk<{completed_reviews: Review[], requested_reviews: Review[]}, void, ThunkApiType>(
  'reviewsState/getReviews',
  async (_, thunkApi) => {
    const state: RootState = thunkApi.getState();
    const resp = await thunkApi.extra.api(state).reviewService.getReviews();
    return resp;
  }
);

export const getCoworkerReviewsAsync = createAsyncThunk<{completedReviews: Review[], requestedReviews: Review[]}, string, ThunkApiType>(
  'reviewsState/getCoworkerReviews',
  async (sub, thunkApi) => {
    const state: RootState = thunkApi.getState();
    const resp = await thunkApi.extra.api(state).reviewService.getReviews(sub);
    return resp;
  }
);

export const getReviewWithIdAsync = createAsyncThunk<Review, string, ThunkApiType>(
  'reviewsState/getReview',
  async (reviewId, thunkApi) => {
    const state: any = thunkApi.getState();

    if (!reviewId) {
      return {
        ...initialReview,
      }
    }

    const loadedReview = state.reviewsState.completedReviews.find((review: Review) => review.id === reviewId);

    if (loadedReview) {
      return {
        ...loadedReview,
      }
    }
    const resp = await thunkApi.extra.api(state).reviewService.getReview(reviewId);
    return resp
  }
)

export const getPeerReviewWithIdAsync = createAsyncThunk<Review, string, ThunkApiType>(
  'reviewsState/getPeerReview',
  async (reviewId, thunkApi) => {
    const state: any = thunkApi.getState();
    if (!reviewId) {
      return initialReview;
    }

    const loadedReview = state.reviewsState.requestedReviews.find((review: Review) => review.id === reviewId);

    if (loadedReview) {
      return loadedReview;
    }
    const resp = await thunkApi.extra.api(state).reviewService.getReview(reviewId);
    return resp
  }
)

const flattenReviewsAndDeleteResponses: (reviews: Review[]) => Review[] = (reviews) => {
  let flattenedReviews: Review[] = reviews.map(x => camelize(x));
  flattenedReviews = flattenedReviews.map(r => ({...r, ...r.responses}));
  flattenedReviews.map(r => delete r.responses);
  return flattenedReviews;
}

const flattenReviewAndDeleteResponses: (review: Review) => Review = (review) => {
  let flattenedReview: Review = camelize(review);
  // TODO: Handle enums better
  flattenedReview.projectSize = <ProjectSize><unknown>ProjectSize[flattenedReview.projectSize!].toString();
  flattenedReview = {...flattenedReview, ...flattenedReview.responses};
  delete flattenedReview.responses;
  return flattenedReview;
}


const convertToServerReviewFormat = (review: Review) => {
  // TODO: This is super hacky. Figure out a better way.
  let serverReview = snakeize(review);
  serverReview["responses"] = {...serverReview};
  serverReview.project_size = ProjectSize[serverReview.project_size];
  delete serverReview.responses.project_name;
  delete serverReview.responses.project_description;
  delete serverReview.responses.project_size;
  delete serverReview.responses.schema_id;
  delete serverReview.responses.organization_id;
  delete serverReview.responses.submitted_by;
  delete serverReview.responses.submitted_at;
  delete serverReview.responses.status;
  delete serverReview.responses.original_review_id;
  delete serverReview.responses.organization_id;
  serverReview["responses"] = camelize(serverReview["responses"]);
  return serverReview;
}


export const submitReviewAsync = createAsyncThunk<void, Review, ThunkApiType>(
  'reviewsState/submitReview',
  async (review, thunkApi) => {
    if (!review.projectName && review.schemaId?.startsWith("ongoing")) {
      review.projectName = "ongoing_responsibilities";
      review.projectDescription = "ongoing_responsibilities";
      review.projectSize = "Medium" as keyof typeof ProjectSize;
    }
    const state = thunkApi.getState();
    const serverReview = convertToServerReviewFormat(review);
    const resp = await thunkApi.extra.api(state).reviewService.submitReview(serverReview);
    return resp;
  }
)

export const submitPeerReviewAsync = createAsyncThunk<void, Review, ThunkApiType>(
  'reviewsState/submitPeerReview',
  async (review, thunkApi) => {
    const state = thunkApi.getState();
    let serverReview = convertToServerReviewFormat(review);
    const resp = await thunkApi.extra.api(state).reviewService.submitPeerReview(serverReview, review.originalReviewId!);
    return resp;
  }
)

export const reviewsSlice = createSlice({
    name: 'ReviewState',
    initialState,
    reducers: {
        resetReviewsState: (state) => {
          return initialState;
        },
        startNewReview: (state, action) => {
            state.activeReview = {
              ...initialReview,
              schemaId: action.payload,
            };
            state.activeReviewLoadState = LoadState.LOADED;
        },
        resetActiveReviewState: (state) => {
          state.activeReview = undefined;
          state.activeReviewLoadState = LoadState.INIT;
          state.submitReviewLoadState = LoadState.INIT;
        }
    },
    extraReducers: (builder) => {
        builder
        // .addCase(getCompletedReviewAsync.pending, (state) => {
        //   state.loadState = LoadState.LOADING;
        // })
        // .addCase(getCompletedReviewAsync.fulfilled, (state, action) => {
        //   state.loadState = LoadState.LOADED;
        // })
        // .addCase(getCompletedReviewAsync.rejected, (state, action) => {
        //   state.loadState = LoadState.ERROR;
        // })
        .addCase(getReviewsAsync.pending, (state) => {
          state.loadState = LoadState.LOADING;
        })
        .addCase(getReviewsAsync.fulfilled, (state, action) => {
          state.loadState = LoadState.LOADED;
          state.completedReviews = flattenReviewsAndDeleteResponses(action.payload.completed_reviews);
          state.completedReviews.sort(reviewSortFunction)
          state.requestedReviews = flattenReviewsAndDeleteResponses(action.payload.requested_reviews);
          state.requestedReviews.sort(reviewSortFunction)
        })
        .addCase(getReviewsAsync.rejected, (state, action) => {
          state.loadState = LoadState.ERROR;
        })
        .addCase(getCoworkerReviewsAsync.pending, (state, action) => {
          state.coworkerReviewsLoadState = LoadState.LOADING;
          state.coworkerReviewsSub = action.meta.arg;
        })
        .addCase(getCoworkerReviewsAsync.fulfilled, (state, action) => {
          state.coworkerReviewsLoadState = LoadState.LOADED;
          state.coworkerCompletedReviews = action.payload.completedReviews;
          state.coworkerCompletedReviews.sort(reviewSortFunction)
          state.coworkerRequestedReviews = action.payload.requestedReviews;
          state.coworkerRequestedReviews.sort(reviewSortFunction)
        })
        .addCase(getCoworkerReviewsAsync.rejected, (state, action) => {
          state.coworkerReviewsLoadState = LoadState.ERROR;
        })
        .addCase(getReviewWithIdAsync.pending, (state) => {
          state.activeReviewLoadState = LoadState.LOADING;
        })
        .addCase(getReviewWithIdAsync.fulfilled, (state, action) => {
          state.activeReviewLoadState = LoadState.LOADED;
          let review = flattenReviewAndDeleteResponses(action.payload);
          state.activeReview = {...review, deadlineDate: parseInt(action.payload.deadlineDate as any) }
        })
        .addCase(getReviewWithIdAsync.rejected, (state, action) => {
          state.activeReviewLoadState = LoadState.ERROR;
        })
        .addCase(getPeerReviewWithIdAsync.pending, (state) => {
          state.activeReviewLoadState = LoadState.LOADING;
        })
        .addCase(getPeerReviewWithIdAsync.fulfilled, (state, action) => {
          state.activeReviewLoadState = LoadState.LOADED;
          let review = flattenReviewAndDeleteResponses(action.payload)
          state.activeReview = {...review, deadlineDate: parseInt(action.payload.deadlineDate as any || "0") }
        })
        .addCase(getPeerReviewWithIdAsync.rejected, (state, action) => {
          state.activeReviewLoadState = LoadState.ERROR;
        })
        .addCase(submitReviewAsync.pending, (state) => {
          state.submitReviewLoadState = LoadState.LOADING;
        })
        .addCase(submitReviewAsync.fulfilled, (state, action) => {
          state.submitReviewLoadState = LoadState.LOADED;
          console.log(action);
        })
        .addCase(submitReviewAsync.rejected, (state, action) => {
          state.submitReviewLoadState = LoadState.ERROR;
        })
        .addCase(submitPeerReviewAsync.pending, (state) => {
          state.submitReviewLoadState = LoadState.LOADING;
        })
        .addCase(submitPeerReviewAsync.fulfilled, (state, action) => {
          state.submitReviewLoadState = LoadState.LOADED;
        })
        .addCase(submitPeerReviewAsync.rejected, (state, action) => {
          state.submitReviewLoadState = LoadState.ERROR;
        })
      },
});

export const {
    startNewReview,
    resetActiveReviewState,
    resetReviewsState
} = reviewsSlice.actions;

export default reviewsSlice.reducer;



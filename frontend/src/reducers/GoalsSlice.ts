import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { CreateGoalRequest } from '../apiTypes';
import { Goal, LoadState, Review, ThunkApiType } from '../types';


interface GoalState {
    loadState: LoadState,
    goals: Array<Goal>,
    reviewsPerGoal: {[key: string]: Array<Review>}
    reviewsPerGoalLoadState: LoadState,
    createLoadState: LoadState,
};

const initialState: GoalState  = {
    loadState: LoadState.INIT,
    goals: [],
    reviewsPerGoal: {},
    reviewsPerGoalLoadState: LoadState.INIT,
    createLoadState: LoadState.INIT,
};


export const getGoalsAsync = createAsyncThunk<{goals: Goal[]}, void, ThunkApiType>(
    'goalsState/getGoals',
    async (_, thunkApi) => {
      const state = thunkApi.getState();
      const responses = await Promise.all([
        await thunkApi.extra.api(state).goalsService.get(),
      ]);
      return {goals: responses[0]}
    }
);

export const getReviewsPerGoalsAsync = createAsyncThunk<{reviews: Review[]}, void, ThunkApiType>(
  'goalsState/getReviewsPerGoal',
  async (_, thunkApi) => {
    const state = thunkApi.getState();
    const responses = await Promise.all([
      await thunkApi.extra.api(state).reviewService.getReviewsForGoals(),
    ]);
    return {reviews: responses[0]}
  }
);

export const createGoalAsync = createAsyncThunk<void, CreateGoalRequest, ThunkApiType>(
  '/goalsState/createGoal',
  async(goal, thunkApi) => {
    const state = thunkApi.getState();
    const response = await thunkApi.extra.api(state).goalsService.create(goal);
    return response;
  }
);

export const goalsSlice = createSlice({
    name: 'ConfigState',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
          .addCase(getGoalsAsync.pending, (state) => {
            state.loadState = LoadState.LOADING;
          })
          .addCase(getGoalsAsync.fulfilled, (state, action) => {
            state.loadState = LoadState.LOADED;
            state.goals = action.payload.goals;
          })
          .addCase(getGoalsAsync.rejected, (state, action) => {
            state.loadState = LoadState.ERROR;
          })
          .addCase(getReviewsPerGoalsAsync.pending, (state) => {
            state.reviewsPerGoalLoadState = LoadState.LOADING;
          })
          .addCase(getReviewsPerGoalsAsync.fulfilled, (state, action) => {
            state.reviewsPerGoalLoadState = LoadState.LOADED;
            state.reviewsPerGoal = action.payload.reviews.reduce<{[key: string]: Review[]}>((resp, review) => {
              if (review.companyGoals && resp.hasOwnProperty(review.companyGoals)) {
                resp[review.companyGoals] = [...resp[review.companyGoals], review]
              } else if (review.companyGoals) {
                resp[review.companyGoals] = [review]
              }
              return resp;
            }, {})
          })
          .addCase(getReviewsPerGoalsAsync.rejected, (state, action) => {
            state.reviewsPerGoalLoadState = LoadState.ERROR;
          })
          .addCase(createGoalAsync.pending, (state) => {
            state.createLoadState = LoadState.LOADING;
          })
          .addCase(createGoalAsync.fulfilled, (state, action) => {
            state.createLoadState = LoadState.LOADED
          })
          .addCase(createGoalAsync.rejected, (state, action) => {
            state.createLoadState = LoadState.ERROR;
          })
      },
});

export default goalsSlice.reducer;



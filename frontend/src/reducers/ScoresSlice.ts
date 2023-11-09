import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { DirectReportPerformanceSummary, GetDirectReportsPerformanceResponse } from '../apiTypes';
import { LoadState, PerformanceSummary, ProjectSizeSummary, Summary, ThunkApiType, User } from '../types';
import camelize from 'camelize';
interface ScoresState {
    loadState: LoadState,
    employeeScore: number | undefined,
    summaries: Summary[],
    summariesLoadState: LoadState,
    reportSummaries: DirectReportPerformanceSummary[],
};

const initialState: ScoresState  = {
    loadState: LoadState.INIT,
    employeeScore: undefined,
    summaries: [],
    summariesLoadState: LoadState.INIT,
    reportSummaries: [],
};

export const getEmployeeScoreAsync = createAsyncThunk<number, void, ThunkApiType>(
    'scoresState/getEmployeeScore',
    async (_, thunkApi) => {
      const state = thunkApi.getState();
      const response = await thunkApi.extra.api(state).scoresService.getEmployeeScore();
      return response;
    }
);

export const getSummaryAsync = createAsyncThunk<PerformanceSummary, void, ThunkApiType>(
    'scoresState/getSummary',
    async (_, thunkApi) => {
      const state = thunkApi.getState();
      const response = await thunkApi.extra.api(state).scoresService.getSummary();
      return response;
    }
);

export const getDirectReportsSummaryAsync = createAsyncThunk<GetDirectReportsPerformanceResponse, string | undefined, ThunkApiType>(
  'scoresState/getDirectReportSummary',
  async (sub, thunkApi) => {
    const state = thunkApi.getState();
    const pResponse = await thunkApi.extra.api(state).userService.getDirectReportsPerformance();
    return pResponse;
  }
)


export const scoresSlice = createSlice({
    name: 'ScoresState',
    initialState,
    reducers: {
      resetScoresState: (state) => {
        return {...initialState}
      }
    },
    extraReducers: (builder) => {
        builder
        .addCase(getEmployeeScoreAsync.pending, (state) => {
          state.loadState = LoadState.LOADING;
        })
        .addCase(getEmployeeScoreAsync.fulfilled, (state, action) => {
          state.loadState = LoadState.LOADED;
          state.employeeScore = action.payload;
        })
        .addCase(getEmployeeScoreAsync.rejected, (state, action) => {
          state.loadState = LoadState.ERROR;
        })
        .addCase(getSummaryAsync.pending, (state) => {
          state.loadState = LoadState.LOADING;
        })
        .addCase(getSummaryAsync.fulfilled, (state, action) => {
          state.loadState = LoadState.LOADED;
          let ps: PerformanceSummary = camelize(action.payload);
          state.summaries = ps.reviewSummaries;
          state.employeeScore = ps.employeeScore;
        })
        .addCase(getSummaryAsync.rejected, (state, action) => {
          state.loadState = LoadState.ERROR;
        })
        .addCase(getDirectReportsSummaryAsync.pending, (state) => {
          state.summariesLoadState = LoadState.LOADING;
        })
        .addCase(getDirectReportsSummaryAsync.fulfilled, (state, action) => {
          state.summariesLoadState = LoadState.LOADED;
          state.reportSummaries = camelize(action.payload);
        })
        .addCase(getDirectReportsSummaryAsync.rejected, (state, action) => {
          state.summariesLoadState = LoadState.ERROR;
        })
      },
});

export const {
    resetScoresState
} = scoresSlice.actions;

export default scoresSlice.reducer;



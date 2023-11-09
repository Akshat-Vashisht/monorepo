import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { GetBudgetDataResponse, GetCompDataResponse, GetDirectReportsCompensationResponse, GetDirectReportsPerformanceResponse } from '../apiTypes';
import { BudgetData, LoadState, ThunkApiType, User } from '../types';
import camelize from 'camelize';

interface CompensationState {
    loadState: LoadState,
    uploadDataLoadState: LoadState,
    budgetLoadState: LoadState,
    uploadUrl: string,
    salary?: number,
    basePay?: number,
    variablePay?: number,
    targetCommissions?: number,
    percentile?: number,
    budgetData: BudgetData[],
    directReports?: GetCompDataResponse[],
    directReportsLoadState: LoadState,
};

const initialState: CompensationState  = {
    loadState: LoadState.INIT,
    uploadDataLoadState: LoadState.INIT,
    budgetLoadState: LoadState.INIT,
    uploadUrl: '',
    budgetData: [],
    directReportsLoadState: LoadState.LOADED,
};


export const getUploadUrlAsync = createAsyncThunk<string, void, ThunkApiType>(
    'compensationState/getUploadUrl',
    async (_, thunkApi) => {
      const state = thunkApi.getState();
      const response = await thunkApi.extra.api(state).compensationService.getUploadUrl();
      return response;
    }
);

export const uploadCompDataAsync = createAsyncThunk<void, File, ThunkApiType>(
    'compensationState/uploadCompData',
    async (fileToUpload, thunkApi) => {
      const state = thunkApi.getState();
      const response = await thunkApi.extra.api(state).compensationService.getUploadUrl();
      const s3Response = await thunkApi.extra.api(state).compensationService.uploadToS3(fileToUpload, response);
      return s3Response;
    }
);

export const getCompDataAsync = createAsyncThunk<GetCompDataResponse, void, ThunkApiType>(
  'compensationState/getCompData',
  async (_, thunkApi) => {
    const state = thunkApi.getState();
    const response = await thunkApi.extra.api(state).compensationService.getCompData();
    return response;
  }
);

export const getBudgetDataAsync = createAsyncThunk<GetBudgetDataResponse, void, ThunkApiType>(
  'compensationState/getBudgetData',
  async (_, thunkApi) => {
    const state = thunkApi.getState();
    const response = await thunkApi.extra.api(state).compensationService.getBudgetData();
    return response;
  }
)

export const getDirectReportsCompensationAsync = createAsyncThunk<GetDirectReportsCompensationResponse, string | undefined, ThunkApiType>(
  'compensationState/getDirectReportsCompensation',
  async (sub, thunkApi) => {
    const state = thunkApi.getState();
    const response = await thunkApi.extra.api(state).userService.getDirectReports(sub);
    const pResponse = await thunkApi.extra.api(state).userService.getDirectReportsCompensationData(response as User[]);
    return pResponse;
  }
)

export const compensationSlice = createSlice({
    name: 'CompensationState',
    initialState,
    reducers: {
      resetCompensationState: (state) => {
        return {...initialState};
      }
    },
    extraReducers: (builder) => {
        builder
          .addCase(getUploadUrlAsync.pending, (state) => {
            state.uploadDataLoadState = LoadState.LOADING;
          })
          .addCase(getUploadUrlAsync.fulfilled, (state, action) => {
            state.uploadDataLoadState = LoadState.LOADED;
          })
          .addCase(getUploadUrlAsync.rejected, (state, action) => {
            state.uploadDataLoadState = LoadState.ERROR;
          })
          .addCase(getCompDataAsync.pending, (state) => {
            state.loadState = LoadState.LOADING;
          })
          .addCase(getCompDataAsync.fulfilled, (state, action) => {
            state.loadState = LoadState.LOADED;
            let comp_data = camelize(action.payload);
            state.salary = action.payload.salary;
            state.basePay = comp_data.basePay;
            state.targetCommissions = comp_data.targetCommissions;
            state.variablePay = comp_data.variablePay;
            state.percentile = action.payload.percentile
          })
          .addCase(getCompDataAsync.rejected, (state, action) => {
            state.loadState = LoadState.ERROR;
          })
          .addCase(getBudgetDataAsync.pending, (state) => {
            state.budgetLoadState = LoadState.LOADING;
          })
          .addCase(getBudgetDataAsync.fulfilled, (state, action) => {
            state.budgetLoadState = LoadState.LOADED;
            // const arr:Array<BudgetData> = action.payload.employees.map(e => ({
            //   email: e.email,
            //   firstName: e.given_name,
            //   lastName: e.family_name,
            //   salary: e.salary,
            //   score: e.score,
            //   managerName: e.manager_name,
            //   basePay: e.basePay,
            //   targetCommissions: e.targetCommissions,
            //   variablePay: e.variablePay,
            // }));
            state.budgetData = camelize(action.payload);
          })
          .addCase(getBudgetDataAsync.rejected, (state, action) => {
            state.budgetLoadState = LoadState.ERROR;
          })
          .addCase(getDirectReportsCompensationAsync.pending, (state) => {
            state.directReportsLoadState = LoadState.INIT;
          })
          .addCase(getDirectReportsCompensationAsync.fulfilled, (state, action) => {
            state.directReportsLoadState = LoadState.LOADED;
            state.directReports = action.payload;
          })
          .addCase(getDirectReportsCompensationAsync.rejected, (state) => {
            state.directReportsLoadState = LoadState.ERROR;
          })
      },
});

export const {
    resetCompensationState,
} = compensationSlice.actions;

export default compensationSlice.reducer;



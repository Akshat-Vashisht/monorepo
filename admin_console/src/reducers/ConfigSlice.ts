import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { Config, LoadState, ThunkApiType } from '../types';
import ConfigService from '../api/ConfigService';


interface ConfigState {
    loadState: LoadState,
    config?: Config,
};

const initialState: ConfigState  = {
    loadState: LoadState.LOADED,
    config: {
      userPoolId: 'us-west-2_D87XVBKdi',
      userPoolClientId: '6g0c90gbgni5cr8q6n2f8hbujv',
    },
};


export const getConfigAsync = createAsyncThunk<Config, void, ThunkApiType>(
    'configState/getConfig',
    async (_, thunkApi) => {
      const state = thunkApi.getState();
      const response = await thunkApi.extra.api(state).configService.get();
      return response;
    }
);

export const configSlice = createSlice({
    name: 'ConfigState',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
          .addCase(getConfigAsync.pending, (state) => {
            state.loadState = LoadState.LOADING;
          })
          .addCase(getConfigAsync.fulfilled, (state, action) => {
            state.loadState = LoadState.LOADED;
            state.config = action.payload;
          })
          .addCase(getConfigAsync.rejected, (state, action) => {
            state.loadState = LoadState.ERROR;
          })
      },
});

export default configSlice.reducer;



import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { Config, LoadState, ThunkApiType } from '../types';
import ConfigService from '../api/ConfigService';


interface ConfigState {
    loadState: LoadState,
    config?: Config,
};

const initialState: ConfigState  = {
    loadState: LoadState.INIT,
    config: {},
};

interface ServerConfig {
  user_pool_id: string,
  user_pool_client_id: string,
}

export const getConfigAsync = createAsyncThunk<ServerConfig, string, ThunkApiType>(
    'configState/getConfig',
    async (subdomain, thunkApi) => {
      const state = thunkApi.getState();
      const response = await thunkApi.extra.api(state).configService.get(subdomain);
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
            state.config = {
              userPoolId: action.payload.user_pool_id,
              userPoolClientId: action.payload.user_pool_client_id,
            }
          })
          .addCase(getConfigAsync.rejected, (state, action) => {
            state.loadState = LoadState.ERROR;
          })
      },
});

export default configSlice.reducer;



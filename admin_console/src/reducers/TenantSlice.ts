import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ApiUser, CreateTenantRequest, GetCompDataResponse, InviteUserRequest, Tenant, UpdateUserRequest } from '../apiTypes';
import { LoadState, ThunkApiType, User } from '../types';


interface TenantState {
    loadState: LoadState,
    tenants: Tenant[],
};

const initialState: TenantState  = {
    loadState: LoadState.INIT,
    tenants: [],
};


export const getTenantsAsync = createAsyncThunk<Tenant[], void, ThunkApiType>(
    'usersState/getTenants',
    async (_, thunkApi) => {
      const state = thunkApi.getState();
      const response = await thunkApi.extra.api(state).tenantService.getTenants();
      return response;
    }
);

export const registerTenantAsync = createAsyncThunk<any[], CreateTenantRequest, ThunkApiType>(
  'usersState/registerTenant',
  async (request, thunkApi) => {
    const state = thunkApi.getState();
    const response = await thunkApi.extra.api(state).tenantService.registerTenant(request);
    return response;
  }
);

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

export const uploadOrgDataAsync = createAsyncThunk<void, File, ThunkApiType>(
  'usersState/uploadOrgData',
  async (fileToUpload, thunkApi) => {
    const state = thunkApi.getState();
    const response = await thunkApi.extra.api(state).userService.getUploadUrl();
    const s3Response = await thunkApi.extra.api(state).userService.uploadToS3(fileToUpload, response);
    return s3Response;
  }
);

export const tenantSlice = createSlice({
    name: 'UsersState',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {
        builder
          .addCase(getTenantsAsync.pending, (state, action) => {
            console.log('Pending', action)
            state.loadState = LoadState.LOADING;
          })
          .addCase(getTenantsAsync.fulfilled, (state, action) => {
            state.loadState = LoadState.LOADED;
            state.tenants = action.payload;            
          })
          .addCase(getTenantsAsync.rejected, (state, action) => {
            state.loadState = LoadState.ERROR;
          })
          .addCase(registerTenantAsync.pending, (state) => {
            state.loadState = LoadState.LOADING;
          })
          .addCase(registerTenantAsync.fulfilled, (state, action) => {
            state.loadState = LoadState.LOADED;
            state.tenants = action.payload;            
          })
          .addCase(registerTenantAsync.rejected, (state, action) => {
            state.loadState = LoadState.ERROR;
          })
      },
});

// export const {
//     setInviteUserLoadState,
// } = usersSlice.actions;

export default tenantSlice.reducer;



import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ApiUser, InviteUserRequest, UpdateUserRequest } from '../apiTypes';
import { LoadState, ThunkApiType, User } from '../types';


interface UsersState {
    usersByTenant: {[key:string] : {loadState: LoadState, users: User[]}},
};

const initialState: UsersState  = {
    usersByTenant: {}
};


export const getUsersAsync = createAsyncThunk<ApiUser[], void, ThunkApiType>(
    'usersState/getUsers',
    async (_, thunkApi) => {
      const state = thunkApi.getState();
      const response = await thunkApi.extra.api(state).userService.getUsers();
      return response;
    }
);

export const getUsersForTenantAsync = createAsyncThunk<ApiUser[], string, ThunkApiType>(
  'usersState/getUsers',
  async (tenantId, thunkApi) => {
    const state = thunkApi.getState();
    const response = await thunkApi.extra.api(state).userService.getUsersForTenant(tenantId);
    return response;
  }
);

export const inviteUserAsync = createAsyncThunk<void, InviteUserRequest, ThunkApiType>(
    'usersState/inviteUser',
    async (req, thunkApi) => {
      const state = thunkApi.getState();
      const response = await thunkApi.extra.api(state).userService.inviteUser(req);
      return response;
    }
);

export const updateUserAsync = createAsyncThunk<void, UpdateUserRequest, ThunkApiType>(
  'usersState/updateUser',
  async(req, thunkApi) => {
    const state = thunkApi.getState();
    const resp = await thunkApi.extra.api(state).userService.updateUser(req);
    return resp;
  }
)

export const uploadOrgDataAsync = createAsyncThunk<void, File, ThunkApiType>(
  'usersState/uploadOrgData',
  async (fileToUpload, thunkApi) => {
    const state = thunkApi.getState();
    const response = await thunkApi.extra.api(state).userService.getUploadUrl();
    const s3Response = await thunkApi.extra.api(state).userService.uploadToS3(fileToUpload, response);
    return s3Response;
  }
);

export const usersSlice = createSlice({
    name: 'UsersState',
    initialState,
    reducers: {
        // setInviteUserLoadState: (state, action) => {
        //     state.inviteUserLoadState = action.payload;
        // },
    },
    extraReducers: (builder) => {
        builder
          .addCase(getUsersForTenantAsync.pending, (state, action) => {
            const tenantId = action.meta.arg;
            console.log(action.meta.arg);
            state.usersByTenant = {
              ...state.usersByTenant,
              [tenantId]: {
                loadState: LoadState.LOADING,
                users: [],
              }
            }
          })
          .addCase(getUsersForTenantAsync.fulfilled, (state, action) => {
            const tenantId = action.meta.arg;
            state.usersByTenant = {
              ...state.usersByTenant,
              [tenantId]: {
                loadState: LoadState.LOADING,
                users: action.payload.map((returnedUser) => (
                  {
                    email: returnedUser.email,
                    username: returnedUser.user_name,
                    role: returnedUser.user_role,
                    familyName: returnedUser.last_name,
                    givenName: returnedUser.first_name,
                    enabled: returnedUser.enabled,
                  }
                ))
              }
            }
          })
          .addCase(getUsersForTenantAsync.rejected, (state, action) => {
            const tenantId = action.meta.arg;
            state.usersByTenant = {
              ...state.usersByTenant,
              [tenantId]: {
                loadState: LoadState.ERROR,
                users: [],
              }
            }
          })
          // .addCase(inviteUserAsync.pending, (state) => {
          //   state.inviteUserLoadState = LoadState.LOADING;
          // })
          // .addCase(inviteUserAsync.fulfilled, (state, action) => {
          //   state.inviteUserLoadState = LoadState.LOADED;
          // })
          // .addCase(inviteUserAsync.rejected, (state, action) => {
          //   state.inviteUserLoadState = LoadState.ERROR;
          // })
          // .addCase(updateUserAsync.pending, (state) => {
          //   state.inviteUserLoadState = LoadState.LOADING;
          // })
          // .addCase(updateUserAsync.fulfilled, (state, action) => {
          //   state.inviteUserLoadState = LoadState.LOADED;
          // })
          // .addCase(updateUserAsync.rejected, (state, action) => {
          //   state.inviteUserLoadState = LoadState.ERROR;
          // })
      },
});

// export const {
//     setInviteUserLoadState,
// } = usersSlice.actions;

export default usersSlice.reducer;



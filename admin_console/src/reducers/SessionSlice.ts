import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { AuthCodeExchangeResponse, AuthState, ExchangeCodeRequest, LoadState, ThunkApiType, User } from '../types';
import { CognitoIdToken,  } from 'amazon-cognito-identity-js';


interface SessionState {
    loadState: LoadState,
    authState: AuthState,
    user: User
};

const initialState: SessionState  = {
    loadState: LoadState.INIT,
    authState: AuthState.INIT,
    user: {},
};

export const exchangeCodeForTokenAsync = createAsyncThunk<AuthCodeExchangeResponse, ExchangeCodeRequest, ThunkApiType>(
    'sessionState/exchangeCodeForToken',
    async (req, thunkApi) => {
        const state = thunkApi.getState();
        const resp = await thunkApi.extra.api(state).sessionService.exchangeCodeForTokens(req.clientId, req.code, req.redirectUrl);
        return resp;
    }
);

export const sessionSlice = createSlice({
    name: 'SessionState',
    initialState,
    reducers: {
        setCurrentUser: (state, action) => {
            state.user = action.payload.user;
            state.authState = action.payload.user === null ? AuthState.UNAUTHENTICATED : AuthState.AUTHENTICATED;
        },
        updateUserFromCachedSession: (state, action) => {
            const idTokenPayload = action.payload.idToken.decodePayload();
            state.loadState = LoadState.LOADED;
            state.authState = AuthState.AUTHENTICATED;
            state.user = {
                ...state.user,
                idToken: action.payload.idToken.getJwtToken(),
                accessToken: action.payload.accessToken.getJwtToken(),
                username: idTokenPayload['cognito:username'],
                givenName: idTokenPayload.given_name,
                familyName: idTokenPayload.family_name,
                role: idTokenPayload['custom:userRole'],
            }
        },
        setAuthState: (state, action) => {
            state.authState = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
          .addCase(exchangeCodeForTokenAsync.pending, (state) => {
            state.loadState = LoadState.LOADING;
          })
          .addCase(exchangeCodeForTokenAsync.fulfilled, (state, action) => {
            const idTokenPayload = new CognitoIdToken( {IdToken: action.payload.id_token}).decodePayload();
            state.loadState = LoadState.LOADED;
            state.authState = AuthState.AUTHENTICATED;
            state.user = {
                ...state.user,
                idToken: action.payload.id_token,
                accessToken: action.payload.access_token,
                username: idTokenPayload['cognito:username'],
                givenName: idTokenPayload.given_name,
                familyName: idTokenPayload.family_name,
                role: idTokenPayload['custom:userRole'],
            }
          })
          .addCase(exchangeCodeForTokenAsync.rejected, (state, action) => {
            state.loadState = LoadState.ERROR;
            console.log("session err", action);
          })
      },
});

export const {
    updateUserFromCachedSession,
    setAuthState,
} = sessionSlice.actions;

export default sessionSlice.reducer;



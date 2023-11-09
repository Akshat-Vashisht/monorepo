import { configureStore, ThunkAction, Action, getDefaultMiddleware, Store } from '@reduxjs/toolkit';
import { PagoApi } from '../api/PagoApi';

import rootReducer from '../reducers/rootReducer';
import { getApiUrl } from '../utils';

const base_url = getApiUrl(window.location.href);

interface MiddlewareType {
  thunk: {
    extraArgument: {
      api: (state:any) => PagoApi,
    }
  }
}

const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware<MiddlewareType>({
      thunk: {
        extraArgument: {
          api: (state) => new PagoApi(state, base_url),
        }
      }
    }),
});

// const sessionIdFromStorage = localStorage.getItem('sessionId');

// if (sessionIdFromStorage === null) {
//   store.dispatch(createSessionAsync());
// } else {
//   store.dispatch(getValidSessionAsync(sessionIdFromStorage));
// }


// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export default store;
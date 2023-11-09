import { combineReducers } from 'redux';
import configReducer from './ConfigSlice';
import sessionReducer from './SessionSlice';
import usersReducer from './UsersSlice';
import tenantReducer from './TenantSlice';

const rootReducer = combineReducers({
    configState: configReducer,
    sessionState: sessionReducer,
    usersState: usersReducer,
    tenantState: tenantReducer,
});

export default rootReducer;
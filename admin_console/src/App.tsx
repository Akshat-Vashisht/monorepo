import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import  store  from './store';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements
} from "react-router-dom";
import Home from './pages/Home';
import AppContainer from './components/AppContainer';

import './App.css';
import CreateTenant from './pages/CreateTenant';
import TenantDetails from './pages/TenantDetails';

const router =  createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AppContainer />} >
      <Route index element={<Home />} />
      <Route path="/tenant/create" element={<CreateTenant />} />
      <Route path="/tenant/:tenantId" element={<TenantDetails />} />
      
      <Route path="*" element={<div>404</div>} />
    </Route>
  )
)

function App() {
  return (
    <div className="App">
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </div>
  );
}

export default App;

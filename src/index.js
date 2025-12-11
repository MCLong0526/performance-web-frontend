// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./slices";
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


axios.interceptors.request.use(
  (config) => {
    const userString = localStorage.getItem("user");

    if (userString) {
      try {
        const user = JSON.parse(userString);
        const token = user?.token;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);



const store = configureStore({ reducer: rootReducer, devTools: true });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <App />
      </BrowserRouter>
      <ToastContainer />
    </>
  </Provider>
);


reportWebVitals();

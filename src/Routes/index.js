// src/Routes/Index.js
import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
// Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";
// Routes
import { authProtectedRoutes, publicRoutes } from "./allRoutes";
// ProtectedRoute component
import ProtectedRoute from './Auth/ProtectedRoute';

const Index = () => {
  return (
    <React.Fragment>
      <Routes>
        {/* Public Routes (No login required) */}
        {publicRoutes.map((route, idx) => (
          <Route
            path={route.path}
            element={
              <NonAuthLayout>
                {route.component}
              </NonAuthLayout>
            }
            key={idx}
          />
        ))}

        {/* Protected Routes (Login required) */}
        <Route element={<ProtectedRoute />}>
          {authProtectedRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                <VerticalLayout>
                  {route.component}
                </VerticalLayout>
              }
              key={idx}
            />
          ))}
        </Route>

        {/* Redirect to login if no route matches */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </React.Fragment>
  );
};

export default Index;

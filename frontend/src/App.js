import React from 'react';
import Register from './components/Register';
import Login from './components/Login';
import TournamentList from './components/TournamentList';
import PrivateRoute from './components/PrivateRoute';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Route bảo vệ: chỉ vào nếu đã login */}
        <Route
          path="/tournaments"
          element={
            <PrivateRoute>
              <TournamentList />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

import React from 'react';
import Register from './components/Register';
import Login from './components/Login';
import TournamentList from './components/TournamentList';
import TournamentDetail from './components/TournamentDetail'
import PrivateRoute from './components/PrivateRoute';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PlayerList from './components/PlayerList';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/players" element={<PlayerList />} />

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

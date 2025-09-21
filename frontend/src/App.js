import React from 'react';
import Register from './components/Register';
import Login from './components/Login';
import TournamentList from './components/TournamentList';
import TournamentDetail from './components/TournamentDetail'
import PrivateRoute from './components/PrivateRoute';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PlayerList from './components/PlayerList';
import TournamentRegistration from './components/TournamentRegistration'; // đường dẫn tới file bạn đã tạo
import TournamentRegistrationSingle from './components/TournamentRegistrationSingle';
import AdminRegistrationList from './components/AdminRegistrationList';
import RegistrationDetail from './components/RegistrationDetail';
import TournamentCompetitorList from './components/TournamentCompetitorList';
import ReactModal from 'react-modal';
import MainPage from './screens/MainPage';
import MainPageSettings from './screens/MainPageSettings';
import TournamentGroupDetail from './screens/TournamentGroupDetail';
import UserManagement from './screens/UserManagement';
import MembersScreen from './screens/MembersScreen';
import TournamentGroupDetailForPlayer from './screens/TournamentGroupDetailForPlayer';


ReactModal.setAppElement('#root');

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/tournament_events/:id/register-single" element={<TournamentRegistrationSingle />} />
        <Route path="/tournament_events/:id" element={<TournamentDetail />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/players" element={<PlayerList />} />
        <Route path="/tournament_events/:id/register" element={<TournamentRegistration />} />
        <Route path="/admin/registrations" element={<AdminRegistrationList />} />
        <Route path="/registrations" element={<AdminRegistrationList />} />
        <Route path="/registration/:id/detail" element={<RegistrationDetail />} />
        <Route path="/tournament_events/:id/competitors" element={<TournamentCompetitorList />} />
        <Route path="/settings" element={<MainPageSettings />} />
        <Route path="/tournament-group/:groupId" element={<TournamentGroupDetail />} />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <UserManagement />
            </PrivateRoute>
          }
        />
        <Route path="/members" element={<MembersScreen />} />
        <Route path="/tournament_events" element={<TournamentList />} />
        <Route path="/tournament-group/:groupId/for-player" element={<TournamentGroupDetailForPlayer />} />
      </Routes>
    </BrowserRouter>
  );
}

// src/components/MainLayout.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../MainLayout.scss';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const [logoFile, setLogoFile] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const logo = localStorage.getItem('logo_file');
    if (logo) setLogoFile(logo);

    const userInfo = localStorage.getItem('user_info');
    if (userInfo) setUser(JSON.parse(userInfo));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    navigate('/login');
  };

  return (
    <div className="main-layout">
      <header className="layout-header">
        <div className="logo" onClick={() => navigate('/')}>
          {logoFile && (
            <img
              src={`${process.env.REACT_APP_API_BASE_URL}/uploads/logos/${logoFile}`}
              alt="Logo"
              style={{ height: 50, cursor: 'pointer' }}
            />
          )}
        </div>
        <div className="header-right">
          {user && <span>Xin chào, <strong>{user.name}</strong></span>}
          <button onClick={handleLogout}>Đăng Xuất</button>
        </div>
      </header>

      <main className="layout-body">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
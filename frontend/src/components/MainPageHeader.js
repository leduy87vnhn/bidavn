// File: /src/components/MainPageHeader.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/mainpage.css';

const MainPageHeader = () => {
  const [logos, setLogos] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mainpage/logos`).then((res) => {
      const valid = res.data?.filter(logo => logo.settings_value);
      setLogos(valid);
    });

    const userInfo = localStorage.getItem('user_info');
    if (userInfo) setUser(JSON.parse(userInfo));
  }, []);

  const getLogoUrl = (value) => {
    const cleanPath = value.replace(/^~\/billard\/bidavn\/backend/, '');
    return `${process.env.REACT_APP_API_BASE_URL}${cleanPath}`;
  };

  const hbsfLogo = logos.find(logo => logo.settings_item === 'hbsf_logo');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="mainpage-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {hbsfLogo && (
          <img
            src={getLogoUrl(hbsfLogo.settings_value)}
            alt="HBSF Logo"
            className="logo"
            style={{ height: '50px', marginRight: '20px' }}
          />
        )}
        <div className="header-text">
          <div className="line1">LIÊN ĐOÀN BILLIARDS & SNOOKER</div>
          <div className="line2">THÀNH PHỐ HỒ CHÍ MINH</div>
        </div>
      </div>

      {/* <div>
        {user ? (
          <>
            <span style={{ marginRight: '12px' }}>Xin chào, <strong>{user.name}</strong></span>
            <button onClick={handleLogout} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px' }}>
              Đăng xuất
            </button>
          </>
        ) : (
          <button onClick={handleLogin} style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px' }}>
            Đăng nhập
          </button>
        )}
      </div> */}
    </div>
  );
};

export default MainPageHeader;
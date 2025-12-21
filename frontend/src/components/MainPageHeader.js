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
    <div className="mainpage-header-banner">
      <div className="header-banner-badge">LIÊN ĐOÀN</div>
      <div className="header-banner-title">
        <div className="title-line1">BILLIARDS & SNOOKER</div>
        <div className="title-line2">THÀNH PHỐ HỒ CHÍ MINH</div>
      </div>
    </div>
  );
};

export default MainPageHeader;
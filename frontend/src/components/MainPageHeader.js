import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/mainpage.css'; // Đảm bảo đường dẫn đúng

const MainPageHeader = () => {
  const [logos, setLogos] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mainpage/logos`).then((res) => {
      const valid = res.data?.filter(logo => logo.settings_value);
      setLogos(valid);
    });
  }, []);

  if (!logos || logos.length === 0) return null;

  const getLogoUrl = (value) => {
    const cleanPath = value.replace(/^~\/billard\/bidavn\/backend/, '');
    return `${process.env.REACT_APP_API_BASE_URL}${cleanPath}`;
  };

  const hbsfLogo = logos.find(logo => logo.settings_item === 'hbsf_logo');

  return (
    <div className="mainpage-header">
      {hbsfLogo && (
        <img
          src={getLogoUrl(hbsfLogo.settings_value)}
          alt="HBSF Logo"
          className="logo"
        />
      )}
      <div className="header-text">
        <div className="line1">LIÊN ĐOÀN BILLARDS & SNOOKER</div>
        <div className="line2">THÀNH PHỐ HỒ CHÍ MINH</div>
      </div>
    </div>
  );
};

export default MainPageHeader;
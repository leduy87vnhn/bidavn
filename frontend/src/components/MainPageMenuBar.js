import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MainPageMenuBar = () => {
  const user = JSON.parse(localStorage.getItem('user_info'));
  const navigate = useNavigate();
  const [logos, setLogos] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mainpage/logos`).then((res) => {
      const valid = res.data?.filter(logo => logo.settings_value);
      setLogos(valid);
    });
  }, []);

  const getLogoUrl = (value) => {
    const cleanPath = value.replace(/^~\/billard\/bidavn\/backend/, '');
    return `${process.env.REACT_APP_API_BASE_URL}${cleanPath}`;
  };

  const hbsfLogo = logos.find(logo => logo.settings_item === 'hbsf_logo');

  return (
    <div className="mainpage-menu-bar">
      <div className="menu-left">
        {hbsfLogo && (
          <img
            src={getLogoUrl(hbsfLogo.settings_value)}
            alt="HBSF Logo"
            className="menu-logo"
          />
        )}
        <span className="menu-item" onClick={() => window.location.href = 'https://hbsf.com.vn/'}>Trang Chủ </span>
        <span
          className={`menu-item ${user ? 'blink-sport' : ''}`}
          onClick={() => navigate('/tournament_events')}
        >
          Giải Thể Thao
        </span>
        {/* <span className="menu-item">Liên Đoàn</span> */}
        <span className="menu-item" onClick={() => navigate('/members')}>Hội Viên</span>
        <span className="menu-item" onClick={() => window.location.href = 'https://hbsf.com.vn/players'}>Bảng Xếp Hạng</span>
        {user?.user_type === 2 && (
          <span className="menu-item" onClick={() => navigate('/settings')}>Thiết lập</span>
        )}
        {user?.user_type === 2 && (
          <span className="menu-item" onClick={() => navigate('/users')}>Users</span>
        )}
        {/* <span className="menu-item" onClick={() => window.location.href = 'https://hbsf.com.vn/register'}>Đăng Ký Tài Khoản</span> */}
      </div>
      <div className="menu-right">
        {user ? (
          <>
            <span className="user-name">{user.name}</span>
            <button onClick={() => {
              localStorage.removeItem('user_info');
              window.location.reload();
            }}>Đăng Xuất</button>
          </>
        ) : (
          //<button onClick={() => navigate('/login')}>Đăng Nhập</button>
          <button className="blink-login" onClick={() => navigate('/login')}>
            Đăng Nhập
          </button>
        )}
      </div>
    </div>
  );
};

export default MainPageMenuBar;
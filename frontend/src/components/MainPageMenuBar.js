import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainPageMenuBar = () => {
  const user = JSON.parse(localStorage.getItem('user_info'));
  const navigate = useNavigate();

  return (
    <div className="mainpage-menu-bar">
      <div className="menu-left">
        <span className="menu-item">Thông tin chung</span>
        <span className="menu-item" onClick={() => navigate('/tournaments')}>Giải đấu</span>
        <span className="menu-item" onClick={() => window.location.href = 'https://hbsf.com.vn/players'}>Bảng xếp hạng</span>
        <span className="menu-item">Nhà tài trợ</span>
        <span className="menu-item">Liên hệ</span>
        {user?.user_type === 2 && (
          <span className="menu-item" onClick={() => navigate('/settings')}>Thiết lập</span>
        )}
      </div>
      <div className="menu-right">
        {user ? (
          <>
            <span className="user-name">{user.user_name}</span>
            <button onClick={() => {
              localStorage.removeItem('user_info');
              window.location.reload();
            }}>Logout</button>
          </>
        ) : (
          <button onClick={() => navigate('/login')}>Login</button>
        )}
      </div>
    </div>
  );
};

export default MainPageMenuBar;
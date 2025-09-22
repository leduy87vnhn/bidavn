import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainPageMenuBar = () => {
  const user = JSON.parse(localStorage.getItem('user_info'));
  const navigate = useNavigate();

  return (
    <div className="mainpage-menu-bar">
      <div className="menu-left">
        <span className="menu-item" onClick={() => window.location.href = 'https://hbsf.com.vn/'}>Trang Chủ </span>
        <span className="menu-item" onClick={() => navigate('/tournament_events')}>Giải Thể Thao</span>
        {/* <span className="menu-item">Liên Đoàn</span> */}
        <span className="menu-item" onClick={() => navigate('/members')}>Hội Viên</span>
        <span className="menu-item" onClick={() => window.location.href = 'https://hbsf.com.vn/players'}>Bảng Xếp Hạng</span>
        {user?.user_type === 2 && (
          <span className="menu-item" onClick={() => navigate('/settings')}>Thiết lập</span>
        )}
        {user?.user_type === 2 && (
          <span className="menu-item" onClick={() => navigate('/users')}>Users</span>
        )}
        <span className="menu-item" onClick={() => window.location.href = 'https://hbsf.com.vn/register'}>Đăng Ký Tài Khoản</span>
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
          <button onClick={() => navigate('/login')}>Đăng Nhập</button>
        )}
      </div>
    </div>
  );
};

export default MainPageMenuBar;
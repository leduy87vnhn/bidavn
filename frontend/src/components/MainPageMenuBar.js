import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainPageMenuBar = () => {
  const user = JSON.parse(localStorage.getItem('user_info'));
  const navigate = useNavigate();

  return (
    <div className="mainpage-menu-bar">
      <div className="menu-left">
        <span className="menu-item">Thông tin chung</span>
        <span className="menu-item" onClick={() => navigate('/tournament_events')}>Giải đấu</span>
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
      {/* <div className="menu-right">
        {user ? (
          <>
            <span style={{ marginRight: '10px' }}><strong>{user.name}</strong></span>
            <button
              onClick={() => {
                localStorage.removeItem('user_info');
                localStorage.removeItem('token');
                window.location.reload();
              }}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Đăng nhập
          </button>
        )}
      </div> */}
    </div>
  );
};

export default MainPageMenuBar;
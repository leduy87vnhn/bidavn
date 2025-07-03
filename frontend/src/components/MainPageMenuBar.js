import React from 'react';

const MainPageMenuBar = () => {
  const user = JSON.parse(localStorage.getItem('user_info'));

  return (
    <div className="menu-bar">
      <div className="menu-left">
        <span className="menu-item">Menu1</span>
        <span className="menu-item">Menu2</span>
        <span className="menu-item">Menu3</span>
        <span className="menu-item">Menu4</span>
        <span className="menu-item">Menu5</span>
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
          <button onClick={() => window.location.href = '/login'}>Login</button>
        )}
      </div>
    </div>
  );
};

export default MainPageMenuBar;
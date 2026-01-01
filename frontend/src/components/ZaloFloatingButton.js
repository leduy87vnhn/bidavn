import React from 'react';
import '../css/zaloButton.css';

const ZaloFloatingButton = () => {
  const handleZaloClick = () => {
    window.open('https://zalo.me/0902824444', '_blank');
  };

  return (
    <div className="zalo-floating-button" onClick={handleZaloClick}>
      <svg
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="zalo-icon"
      >
        <circle cx="25" cy="25" r="25" fill="#0068FF" />
        <path
          d="M20.5 32.5C20.5 32.5 19 32.5 19 31C19 29.5 20.5 26 25 26C29.5 26 31 29.5 31 31C31 32.5 29.5 32.5 29.5 32.5H20.5Z"
          fill="white"
        />
        <circle cx="25" cy="21" r="3.5" fill="white" />
        <path
          d="M15 20C15 16.5 17 14 20 12.5C22.5 11.5 27.5 11.5 30 12.5C33 14 35 16.5 35 20C35 23.5 33 26 30 27.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="zalo-text">Chat Zalo</span>
    </div>
  );
};

export default ZaloFloatingButton;

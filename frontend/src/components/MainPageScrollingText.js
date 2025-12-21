import React from 'react';
import '../css/mainpage.css';

const MainPageScrollingText = () => {
  const text = "LIÊN ĐOÀN BILLIARDS & SNOOKER THÀNH PHỐ HỒ CHÍ MINH";
  
  return (
    <div className="scrolling-text-container">
      <div className="scrolling-text">
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
};

export default MainPageScrollingText;

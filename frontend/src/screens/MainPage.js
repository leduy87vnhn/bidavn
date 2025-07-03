import React from 'react';
import MainPageHeader from '../components/MainPageHeader';
import MainPageMenuBar from '../components/MainPageMenuBar';
import MainPageEventSlider from '../components/MainPageEventSlider';
import MainPageNewsList from '../components/MainPageNewsList';
import MainPageVideoSection from '../components/MainPageVideoSection';
import '../css/mainpage.css';

const MainPage = () => {
  return (
    <div className="main-container">
      <MainPageHeader />
      <MainPageMenuBar />
      <MainPageEventSlider />
      <MainPageNewsList />
      <MainPageVideoSection />
    </div>
  );
};

export default MainPage;
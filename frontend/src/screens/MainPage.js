import React from 'react';
import Header from '../components/MainPageHeader';
import MenuBar from '../components/MainPageMenuBar';
import EventSlider from '../components/MainPageEventSlider';
import NewsList from '../components/MainPageNewsList';
import VideoSection from '../components/MainPageVideoSection';
import '../css/mainpage.css';

const MainPage = () => {
  return (
    <div className="main-container">
      <Header />
      <MenuBar />
      <EventSlider />
      <NewsList />
      <VideoSection />
    </div>
  );
};

export default MainPage;
import React from 'react';
import MainPageHeader from '../components/MainPageHeader';
import MainPageMenuBar from '../components/MainPageMenuBar';
import MainPageEventSlider from '../components/MainPageEventSlider';
import MainPageNewsList from '../components/MainPageNewsList';
import MainPageVideoSection from '../components/MainPageVideoSection';
import MainPageHbsfInfo from '../components/MainPageHbsfInfo';
import MainPageTournamentSummary from '../components/MainPageTournamentSummary';

import '../css/mainpage.css';

const MainPage = () => {
  return (
    <div className="main-container">
      <MainPageHeader />
      <MainPageMenuBar />
      <MainPageEventSlider />
      <div style={{ marginTop: '20px' }}></div>
      <MainPageNewsList />
      <MainPageTournamentSummary />
      <MainPageVideoSection />
      <MainPageHbsfInfo />
    </div>
  );
};

export default MainPage;
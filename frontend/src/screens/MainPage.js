import React from 'react';
import MainPageHeader from '../components/MainPageHeader';
import MainPageMenuBar from '../components/MainPageMenuBar';
import MainPageScrollingText from '../components/MainPageScrollingText';
import MainPageEventSlider from '../components/MainPageEventSlider';
import MainPageNewsList from '../components/MainPageNewsList';
import MainPageVideoSection from '../components/MainPageVideoSection';
import MainPageHbsfInfo from '../components/MainPageHbsfInfo';
import MainPageTournamentSummary from '../components/MainPageTournamentSummary';
import ZaloFloatingButton from '../components/ZaloFloatingButton';

import '../css/mainpage.css';

const MainPage = () => {
  return (
    <div className="main-container">
      <MainPageMenuBar />
      <MainPageHeader />
      <MainPageScrollingText />
      <MainPageEventSlider />
      <MainPageScrollingText />
      <div style={{ marginTop: '20px' }}></div>
      <MainPageTournamentSummary />
      <MainPageNewsList />
      <MainPageVideoSection />
      <MainPageHbsfInfo />
      <ZaloFloatingButton />
    </div>
  );
};

export default MainPage;
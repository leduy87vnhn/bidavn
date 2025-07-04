import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MainPageNewsList = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    axios.get('http://18.143.246.46:5000/api/mainpage/news').then((res) => {
      const filtered = res.data.filter(e => e.event_photo);
      setNews(filtered);
    });
  }, []);

  const getEventPhotoUrl = (value) => {
    const cleanPath = value.replace(/^~\/billard\/bidavn\/backend/, '');
    return `http://18.143.246.46:5000${cleanPath}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  if (!news.length) return null;

  return (
    <div className="mainpage-news-list">
      {news.map((item, idx) => (
        <div key={idx} className="news-item">
          <img src={getEventPhotoUrl(item.event_photo)} alt="news" />
          <div className="news-text">
            <div className="news-title">{item.event_name}</div>
            <div className="news-date">{formatDate(item.event_date)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MainPageNewsList;
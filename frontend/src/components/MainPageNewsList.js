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

  if (!news.length) return null;

  return (
    <div className="mainpage-news-list">
      {news.map((item, idx) => (
        <div key={idx} className="news-item">
          <img src={item.event_photo.replace('~', '')} alt="news" />
          <div className="news-text">
            <div className="news-title">{item.event_name}</div>
            <div className="news-date">{item.event_date}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MainPageNewsList;
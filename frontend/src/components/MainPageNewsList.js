import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MainPageNewsList = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    axios.get('/api/mainpage/news').then((res) => {
      setNews(res.data);
    });
  }, []);

  return (
    <div className="news-list">
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
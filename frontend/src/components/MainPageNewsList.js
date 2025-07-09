import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MainPageNewsList = () => {
  const [news, setNews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mainpage/news`).then((res) => {
      const filtered = res.data.filter(e => e.event_photo);
      setNews(filtered);
    });
  }, []);

  const getEventPhotoUrl = (value) => {
    const cleanPath = value.replace(/^~\/billard\/bidavn\/backend/, '');
    return `${process.env.REACT_APP_API_BASE_URL}${cleanPath}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  if (!news.length) return null;

  const handleNewsClick = async (eventName) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mainpage/tournament-group-by-name?name=${encodeURIComponent(eventName)}`);
      const groupId = res.data.group_id;
      if (groupId) {
        navigate(`/tournament-group/${groupId}`);
      } else {
        // Nếu không có group trùng, có thể làm gì đó khác (mở modal chi tiết, hoặc không phản hồi)
        console.log('No matching tournament group');
      }
    } catch (err) {
      console.error('Failed to check tournament group', err);
    }
  };

  return (
    <div className="mainpage-news-list">
      {news.map((item, idx) => (
        <div
          key={idx}
          className="news-item"
          onClick={() => handleNewsClick(item.event_name)}
          style={{ cursor: 'pointer' }}
        >
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
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../components/MainLayout.scss'; 

const MainPageEventSlider = () => {
  const [events, setEvents] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mainpage/events`).then((res) => {
      const filtered = res.data.filter(e => e.event_photo);
      setEvents(filtered);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % events.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [events]);

  const getEventPhotoUrl = (value) => {
    const cleanPath = value.replace(/^~\/billard\/bidavn\/backend/, '');
    return `${process.env.REACT_APP_API_BASE_URL}${cleanPath}`;
  };

  if (!events.length) return null;

  return (
    <div className="mainpage-event-slider">
      <img src={getEventPhotoUrl(events[index].event_photo)} alt="event" />
      <div className="event-content">{events[index].event_content}</div>
    </div>
  );
};

export default MainPageEventSlider;
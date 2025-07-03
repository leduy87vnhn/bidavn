import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MainPageEventSlider = () => {
  const [events, setEvents] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    axios.get('/api/mainpage/events').then((res) => {
      setEvents(res.data);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % events.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [events]);

  if (!events.length) return null;

  return (
    <div className="event-slider">
      <img src={events[index].event_photo.replace('~', '')} alt="event" />
      <div className="event-content">{events[index].event_content}</div>
    </div>
  );
};

export default MainPageEventSlider;
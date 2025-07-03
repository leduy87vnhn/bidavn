import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MainPageVideoSection = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    axios.get('http://18.143.246.46:5000/api/mainpage/videos').then((res) => {
      const filtered = res.data.filter(e => e.event_video);
      setVideos(filtered);
    });
  }, []);

  if (!videos.length) return null;

  return (
    <div className="mainpage-video-section">
      {videos.map((item, idx) => (
        <div key={idx} className="video-item">
          <iframe
            width="360"
            height="215"
            src={item.event_video.replace('watch?v=', 'embed/')}
            title={item.event_name}
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>
      ))}
    </div>
  );
};

export default MainPageVideoSection;
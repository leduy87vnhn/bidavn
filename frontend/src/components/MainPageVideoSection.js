import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MainPageVideoSection = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    axios.get('/api/mainpage/videos').then((res) => {
      setVideos(res.data);
    });
  }, []);

  return (
    <div className="video-section">
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
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

  const convertToEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname.startsWith('/watch')) {
          return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
        } else if (u.pathname.startsWith('/shorts/')) {
          const videoId = u.pathname.split('/')[2];
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  if (!videos.length) return null;

  return (
    <div className="mainpage-video-section">
      {videos.map((item, idx) => (
        <div key={idx} className="video-item">
          <iframe
            width="360"
            height="215"
            src={convertToEmbedUrl(item.event_video)}
            title={item.event_name || `video-${idx}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      ))}
    </div>
  );
};

export default MainPageVideoSection;
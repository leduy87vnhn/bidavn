import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MainPageVideoSection = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mainpage/videos`).then((res) => {
      const filtered = res.data.filter(e => e.event_video);
      setVideos(filtered);
    });
  }, []);

  const convertToEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url);

      // ✅ YouTube
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname.startsWith('/watch')) {
          return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
        } else if (u.pathname.startsWith('/shorts/')) {
          const videoId = u.pathname.split('/')[2];
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      // ✅ TikTok
      if (u.hostname.includes('tiktok.com')) {
        return `https://www.tiktok.com/embed/${u.pathname.split('/').filter(Boolean).pop()}`;
      }

      // ✅ Facebook
      if (u.hostname.includes('facebook.com')) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=false`;
      }

      // fallback
      return url;
    } catch (e) {
      return url;
    }
  };

  const getPlatform = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('facebook.com')) return 'facebook';
    return 'other';
  };

  if (!videos.length) return null;

  return (
    <div className="mainpage-video-section">
      {videos.map((item, idx) => {
        const embedUrl = convertToEmbedUrl(item.event_video);
        const platform = getPlatform(item.event_video);

        return (
          <div key={idx} className="video-item" style={{ marginBottom: '20px' }}>
            {platform === 'facebook' ? (
              <iframe
                src={embedUrl}
                width="360"
                height="215"
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                title={item.event_name || `video-${idx}`}
              ></iframe>
            ) : platform === 'tiktok' ? (
              <iframe
                src={embedUrl}
                width="360"
                height="600"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                title={item.event_name || `video-${idx}`}
              ></iframe>
            ) : (
              <iframe
                width="360"
                height="215"
                src={embedUrl}
                title={item.event_name || `video-${idx}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MainPageVideoSection;
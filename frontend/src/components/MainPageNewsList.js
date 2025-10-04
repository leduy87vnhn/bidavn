// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import '../css/mainpage.css';

// const MainPageNewsList = () => {
//   const [news, setNews] = useState([]);
//   const navigate = useNavigate();
//   const [groupInfoMap, setGroupInfoMap] = useState({});

//   useEffect(() => {
//     axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mainpage/news`).then((res) => {
//       const filtered = res.data.filter(e => e.event_photo);
//       setNews(filtered);
//     });
//   }, []);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mainpage/news`);
//         const filtered = res.data.filter(e => e.event_photo);
//         setNews(filtered);

//         // Lấy thông tin tournament_group + ngày + địa điểm
//         const groupRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mainpage/tournament-groups-info`);
//         const map = {};
//         for (let group of groupRes.data) {
//           map[group.tournament_name?.trim()] = {
//             start: group.start_date,
//             end: group.end_date,
//             location: group.location
//           };
//         }
//         setGroupInfoMap(map);
//       } catch (err) {
//         console.error('Error loading data:', err);
//       }
//     };

//     fetchData();
//   }, []);

//   const formatDateRange = (startStr, endStr) => {
//     const d = (s) => {
//       const date = new Date(s);
//       return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
//     };
//     return `Từ ${d(startStr)} đến ${d(endStr)}`;
//   };

//   const getEventPhotoUrl = (value) => {
//     const cleanPath = value.replace(/^~\/billard\/bidavn\/backend/, '');
//     return `${process.env.REACT_APP_API_BASE_URL}${cleanPath}`;
//   };

//   const formatDate = (dateStr) => {
//     const date = new Date(dateStr);
//     const dd = String(date.getDate()).padStart(2, '0');
//     const mm = String(date.getMonth() + 1).padStart(2, '0');
//     const yyyy = date.getFullYear();
//     return `${dd}-${mm}-${yyyy}`;
//   };

//   if (!news.length) return null;

//   const handleNewsClick = async (eventName) => {
//     try {
//       const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mainpage/tournament-group-by-name?name=${encodeURIComponent(eventName)}`);
//       const groupId = res.data.group_id;
//       if (groupId) {
//         window.location.href = 'https://hbsf.com.vn/tournament_events';
//       } else {
//         console.log('No matching tournament group');
//       }
//     } catch (err) {
//       console.error('Failed to check tournament group', err);
//     }
//   };

//   return (
//     <div className="mainpage-news-list">
//       {news.map((item, idx) => {
//         const group = groupInfoMap[item.event_name?.trim()];
//         return (
//           <div key={idx} className="news-item" onClick={() => handleNewsClick(item.event_name)}>
//             <div className="news-text-block">
//               <div className="news-title">{item.event_name}</div>
//               {group ? (
//                 <>
//                   <div className="news-date">
//                     {formatDateRange(group.start, group.end)}
//                   </div>
//                   <div className="news-location">Địa điểm: {group.location}</div>
//                 </>
//               ) : (
//                 <div className="news-date">{formatDate(item.event_date)}</div>
//               )}
//             </div>
//             <img src={getEventPhotoUrl(item.event_photo)} alt="news" />
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default MainPageNewsList;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/mainpage.css'; // đảm bảo chứa style mới

const MainPageNewsList = () => {
  const [news, setNews] = useState([]);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mainpage/news`);
        const filtered = res.data
          .filter(e => e.event_photo_second || e.event_photo)
          .sort((a, b) => new Date(a.event_date) - new Date(b.event_date)); // sắp xếp theo event_date tăng dần

        setNews(filtered.slice(0, 5)); // lấy 5 sự kiện đầu
      } catch (err) {
        console.error('Error loading news data:', err);
      }
    };
    fetchData();
  }, []);

  const getEventPhotoUrl = (value) => {
    const cleanPath = value.replace(/^~\/billard\/bidavn\/backend/, '');
    return `${process.env.REACT_APP_API_BASE_URL}${cleanPath}`;
  };

  if (!news.length) return null;

  const selectedEvent = news[selectedEventIndex];

  return (
    <div className="news-container">
      <div className="news-image">
        <img src={getEventPhotoUrl(selectedEvent.event_photo_second)} alt="event" />
      </div>
      <div className="news-list">
        <div className="news-header">TIN TỨC - SỰ KIỆN</div>
        {news.map((item, idx) => (
          <div
            key={idx}
            className={`news-title-line ${selectedEventIndex === idx ? 'selected' : ''}`}
            onClick={() => setSelectedEventIndex(idx)}
          >
            {item.event_name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainPageNewsList;
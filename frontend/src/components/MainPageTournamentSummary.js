import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import '../css/mainpage.css';

const MainPageTournamentSummary = () => {
  const [groups, setGroups] = useState([]);
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setUserLoaded(true);
  }, []);

  useEffect(() => {
    if (!userLoaded) return;

    const fetchGroups = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/upcoming-groups`);
        let data = Array.isArray(res.data) ? res.data : [];

        // Chỉ lọc nếu user != admin
        if (user?.user_type !== 2) {
          data = data.filter(g => g.display !== false);
        }

        setGroups(data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách nhóm giải:', err);
        setGroups([]);
      }
    };

    fetchGroups();
  }, [user, userLoaded]);

  const toggleDisplay = async (groupId, newDisplay) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/tournament-group/${groupId}`, {
        display: newDisplay
      });
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, display: newDisplay } : g));
    } catch (err) {
      console.error('Lỗi khi cập nhật display:', err);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return `${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/groups/${imagePath}`;
  };

  return (
    <div className="mainpage-tournament-summary">
      <div className="tournament-summary-header">
        <h2>
          <span className="text-orange">GIẢI</span>
          {' '}
          <span className="text-blue">THỂ THAO</span>
        </h2>
      </div>
      <div className="tournament-cards-container">
        {groups
          .slice()
          .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
          .map((item, index) => {
            // Card lẻ (index 0, 2, 4...) -> hình trái
            // Card chẵn (index 1, 3, 5...) -> hình phải
            const isOddCard = index % 2 === 0;
            const imageUrl = getImageUrl(item.background_image);
            
            return (
              <div key={item.id} className={`tournament-card ${isOddCard ? 'left-image' : 'right-image'}`}>
                <div className="tournament-image">
                  <img 
                    src={imageUrl || 'https://via.placeholder.com/350x250?text=Tournament'} 
                    alt="Tournament Image"
                  />
                </div>
                <div className="tournament-info">
                  <h3 
                    className="tournament-title"
                    onClick={() => window.location.href = `/tournament-group/${item.id}/for-player`}
                  >
                    {item.tournament_name}
                  </h3>
                  <div className="tournament-details">
                    <p className="tournament-info-item">
                      <FaCalendarAlt className="info-icon" />
                      <span>{new Date(item.start_date).toLocaleDateString('vi-VN')} - {new Date(item.end_date).toLocaleDateString('vi-VN')}</span>
                    </p>
                    {item.event_location && (
                      <p className="tournament-info-item">
                        <FaMapMarkerAlt className="info-icon" />
                        <span>{item.event_location}</span>
                      </p>
                    )}
                  </div>
                  <div className="tournament-arrow">
                    <div className="arrow-box">
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <path d="M10 10 L25 20 L10 30" stroke="#FF8800" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </div>
                    <div className="arrow-box">
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <path d="M10 10 L25 20 L10 30" stroke="#FF8800" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </div>
                  </div>
                  {user?.user_type === 2 && (
                    <div className="tournament-admin-controls">
                      <button
                        className="btn-toggle-display"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDisplay(item.id, !item.display);
                        }}
                      >
                        {item.display ? '👁️ Ẩn' : '🚫 Hiện'}
                      </button>
                      {item.display === false && (
                        <span className="hidden-badge">(ĐÃ ẨN)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default MainPageTournamentSummary;
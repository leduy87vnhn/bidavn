import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';
import '../css/mainpage.css';
import giaiTheThaoImage from '../assets/images/giaithethao1.PNG';

const MainPageTournamentSummary = () => {
  const [groups, setGroups] = useState([]);
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

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

  const toggleExpand = (itemId, field) => {
    setExpandedItems(prev => ({
      ...prev,
      [`${itemId}-${field}`]: !prev[`${itemId}-${field}`]
    }));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return `${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/groups/${imagePath}`;
  };

  const openGoogleMaps = (location) => {
    if (!location || location === 'Chưa cập nhật') return;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="mainpage-tournament-summary">
      <div className="tournament-summary-header">
        <img src={giaiTheThaoImage} alt="Giải Thể Thao" className="tournament-header-image" />
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
                <div 
                  className="tournament-image"
                  onClick={() => window.location.href = `/tournament-group/${item.id}/for-player`}
                  style={{ cursor: 'pointer' }}
                >
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
                  <div className="tournament-details-grid">
                    <div className="tournament-details-left">
                      <div 
                        className={`info-box info-time ${expandedItems[`${item.id}-time`] ? 'expanded' : ''}`}
                        onClick={() => toggleExpand(item.id, 'time')}
                      >
                        <div className="info-icon-wrapper">
                          <FaCalendarAlt className="info-icon" />
                        </div>
                        <div className="info-content">
                          {new Date(item.start_date).toLocaleDateString('vi-VN')} - {new Date(item.end_date).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <div 
                        className={`info-box info-location ${expandedItems[`${item.id}-location`] ? 'expanded' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openGoogleMaps(item.event_location);
                        }}
                      >
                        <div className="info-icon-wrapper">
                          <FaMapMarkerAlt className="info-icon" />
                        </div>
                        <div className="info-content">
                          {item.event_location || 'Chưa cập nhật'}
                        </div>
                      </div>
                    </div>
                    <div className="tournament-details-right">
                      <div 
                        className={`info-box info-description ${expandedItems[`${item.id}-description`] ? 'expanded' : ''}`}
                        onClick={() => toggleExpand(item.id, 'description')}
                      >
                        <div className="info-icon-wrapper">
                          <FaInfoCircle className="info-icon" />
                        </div>
                        <div className="info-content">
                          {item.description || 'Chưa có mô tả'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="tournament-register-btn"
                    onClick={() => window.location.href = `/tournament-group/${item.id}/for-player`}
                  >
                    Đăng Ký
                  </button>
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
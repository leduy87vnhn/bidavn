import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
    const cleanPath = imagePath.replace(/^~\/billard\/bidavn\/backend/, '');
    return `${process.env.REACT_APP_API_BASE_URL}${cleanPath}`;
  };

  return (
    <div className="mainpage-tournament-summary">
      <div className="tournament-summary-header">
        <h2>GIẢI THỂ THAO</h2>
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
                  <p className="tournament-description">
                    {item.description || `Thời gian: ${new Date(item.start_date).toLocaleDateString('vi-VN')} - ${new Date(item.end_date).toLocaleDateString('vi-VN')}`}
                    <br />
                    {item.event_location && `Địa điểm: ${item.event_location}`}
                  </p>
                  <div className="tournament-arrow">
                    <svg width="50" height="40" viewBox="0 0 50 40" fill="none">
                      <path d="M5 10 L15 20 L5 30" stroke="#FF8800" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      <path d="M25 10 L35 20 L25 30" stroke="#FF8800" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
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
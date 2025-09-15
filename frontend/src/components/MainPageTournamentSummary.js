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

  const formatRange = (start, end) => {
    const format = (dateStr) => {
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    };
    return `${format(start)} - ${format(end)}`;
  };

  const toggleDisplay = async (groupId, newDisplay) => {
    try {
      await axios.put(`/api/tournament_events/tournament-group/${groupId}`, {
        display: newDisplay
      });
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, display: newDisplay } : g));
    } catch (err) {
      console.error('Lỗi khi cập nhật display:', err);
    }
  };

  return (
    <div className="mainpage-tournament-summary">
      <div className="summary-header">GIẢI THỂ THAO</div>
      {groups
      .slice() // copy ra để không làm mutate state
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date)) // sắp xếp tăng dần theo start_date
      .map((item) => (
        <div key={item.id} className="summary-row">
          <div
            className="summary-col name"
            onClick={() => window.location.href = 'https://hbsf.com.vn/tournament_events'}
            style={{ cursor: 'pointer', color: '#007bff' }}
          >
            {item.tournament_name}
            {user?.user_type === 2 && item.display === false && (
              <span style={{ marginLeft: 8, color: 'red', fontWeight: 'bold' }}>
                (đang ẨN)
              </span>
            )}
          </div>
          <div className="summary-col date">{formatRange(item.start_date, item.end_date)}</div>
          <div className="summary-col address">{item.event_location}</div>
          {/* 🔽 Cột mới: Điều Lệ */}
          <div className="summary-col action">
            {item.regulations ? (
              <a
                href={`${process.env.REACT_APP_API_BASE_URL}/uploads/regulations/${item.regulations}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-download"
              >
                📥 Điều lệ
              </a>
            ) : (
              <button className="btn-disabled" disabled>📄 Điều lệ</button>
            )}
          </div>
          {user?.user_type === 2 && (
            <div className="summary-col action">
              <button
                className="btn-download"
                onClick={() => toggleDisplay(item.id, !item.display)}
              >
                {item.display ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MainPageTournamentSummary;
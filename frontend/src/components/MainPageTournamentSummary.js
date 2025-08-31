import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/mainpage.css';

const MainPageTournamentSummary = () => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groupRes = await axios.get('/api/tournament_events/upcoming-groups');
        setGroups(groupRes.data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách nhóm giải:', err);
      }
    };

    fetchGroups();
  }, []);

  const formatRange = (start, end) => {
    const format = (dateStr) => {
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    };
    return `${format(start)} - ${format(end)}`;
  };

  return (
    <div className="mainpage-tournament-summary">
      <div className="summary-header">GIẢI THỂ THAO</div>
      {groups.map((item, idx) => (
        <div key={idx} className="summary-row">
          <div
            className="summary-col name"
            onClick={() => window.location.href = 'https://hbsf.com.vn/tournament_events'}
            style={{ cursor: 'pointer', color: '#007bff' }}
          >
            {item.tournament_name}
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
        </div>
      ))}
    </div>
  );
};

export default MainPageTournamentSummary;
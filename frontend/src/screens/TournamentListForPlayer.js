import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaUsers, FaMoneyBillWave, FaGift, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../css/tournamentGroupDetailForPlayer.scss';
import MainPageHeader from '../components/MainPageHeader';
import MainPageMenuBar from '../components/MainPageMenuBar';

import giaiTheThaoImage from '../assets/images/giaithethao4.PNG';

const TournamentListForPlayer = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [eventIndexes, setEventIndexes] = useState({});
  const [expandedEventId, setExpandedEventId] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/groups-with-events?status=all`
        );

        // Không lọc display, lấy toàn bộ group từ API
        // Sắp xếp group theo group_start_date tăng dần (sớm lên đầu)
        const sortedGroups = [...res.data].sort((a, b) => {
          const dateA = a.group_start_date ? new Date(a.group_start_date) : new Date(8640000000000000); // max date nếu null
          const dateB = b.group_start_date ? new Date(b.group_start_date) : new Date(8640000000000000);
          return dateA - dateB;
        });

        // Sắp xếp event trong mỗi group: start_date DESC (muộn → sớm)
        sortedGroups.forEach((g) => {
          g.tournament_events.sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date) : new Date(0);
            const dateB = b.start_date ? new Date(b.start_date) : new Date(0);
            return dateB - dateA;
          });
        });

        setGroups(sortedGroups);
        const initIndexes = {};
        sortedGroups.forEach((g) => (initIndexes[g.group_id] = 0));
        setEventIndexes(initIndexes);
      } catch (err) {
        console.error('❌ Lỗi tải danh sách group:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) setUser(JSON.parse(userInfo));
  }, []);

  // useEffect(() => {
  // const interval = setInterval(() => {
  //     setEventIndexes((prev) => {
  //     const updated = { ...prev };
  //     groups.forEach((g) => {
  //         const max = g.tournament_events.length;
  //         if (max > 2) {
  //         const nextIndex = prev[g.group_id] + 1;
  //         updated[g.group_id] = nextIndex > max - 2 ? 0 : nextIndex;
  //         }
  //     });
  //     return updated;
  //     });
  // }, 5000); // đổi 5000 → 3000 nếu muốn nhanh hơn
  // return () => clearInterval(interval);
  // }, [groups]);

  // const formatDate = (isoStr) => {
  //   if (!isoStr) return '';
  //   const d = new Date(isoStr);
  //   if (isNaN(d.getTime())) return '';
  //   return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1)
  //     .toString()
  //     .padStart(2, '0')}-${d.getFullYear()}`;
  // };
  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`; // chỉ hiển thị ngày-tháng
  };

  // const handleSlide = (groupId, direction) => {
  //   setEventIndexes((prev) => {
  //       const max = groups.find((g) => g.group_id === groupId)?.tournament_events.length || 0;
  //       const newIndex =
  //       direction === 'left'
  //           ? Math.max(0, prev[groupId] - 1)
  //           : Math.min(max - 2, prev[groupId] + 1);
  //       return { ...prev, [groupId]: newIndex };
  //   });
  // };

  const handleSlide = (groupId, direction) => {
    setEventIndexes((prev) => {
      const group = groups.find((g) => g.group_id === groupId);
      const max = group?.tournament_events.length || 0;
      if (max <= 2) return prev; // không cần xoay nếu chỉ có ≤2 event

      let newIndex;
      if (direction === 'left') {
        // nếu đang ở đầu thì xoay vòng về cuối
        newIndex = prev[groupId] - 1 < 0 ? max - 2 : prev[groupId] - 1;
      } else {
        // nếu đang ở cuối thì xoay vòng về đầu
        newIndex = prev[groupId] + 1 > max - 2 ? 0 : prev[groupId] + 1;
      }

      return { ...prev, [groupId]: newIndex };
    });
  };




  if (loading) return <p className="tgdp-loading">Đang tải danh sách...</p>;

  return (
    <div className="tgdp-wrapper">
      <MainPageMenuBar />
      <MainPageHeader />
      <div className="tournament-summary-header">
        <img src={giaiTheThaoImage} alt="Giải Thể Thao" className="tournament-header-image" />
      </div>
      {groups.length === 0 ? (
        <p className="tgdp-error">Không có giải đấu nào.</p>
      ) : (
        groups.map((group) => (
          <div key={group.group_id} className="tgdp-group-card">
            {/* ...existing code... */}
          </div>
        ))
      )}
    </div>
  );
};

export default TournamentListForPlayer;
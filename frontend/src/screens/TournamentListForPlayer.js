import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaUsers, FaMoneyBillWave, FaGift, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../css/tournamentGroupDetailForPlayer.scss';
import MainPageHeader from '../components/MainPageHeader';
import MainPageMenuBar from '../components/MainPageMenuBar';

const TournamentListForPlayer = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [eventIndexes, setEventIndexes] = useState({});
  const [expandedEventId, setExpandedEventId] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/groups-with-events`
        );

        // 🔹 Lọc chỉ các group có display = true (hoặc = 'yes')
        const visibleGroups = res.data.filter(
        (g) => g.display === true || g.display === 'yes'
        );

        const sortedGroups = [...visibleGroups].sort((a, b) => {
        const dateA = a.group_start_date ? new Date(a.group_start_date) : new Date(0);
        const dateB = b.group_start_date ? new Date(b.group_start_date) : new Date(0);
        return dateB - dateA;
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
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1)
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
    <MainPageHeader />
    <MainPageMenuBar />

    {groups.length === 0 ? (
      <p className="tgdp-error">Không có giải đấu nào.</p>
    ) : (
      groups.map((group) => {
        return (
          <div key={group.group_id} className="tgdp-group-card">
            <div
              className="tournament-group-header"
              style={{
                background: '#e8fbe8',
                borderRadius: '12px',
                padding: '24px 36px',
                marginTop: '30px',
                textAlign: 'center',
              }}
            >

              {group.background_image && (
                <div className="tgdp-group-bg">
                  <img
                    src={`${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/groups/${group.background_image}`}
                    alt="Group Background"
                  />
                </div>
              )}
              <h1 className="tournament-group-title">
                {group.group_name}
              </h1>

              {(group.group_start_date || group.group_end_date) && (
                <p
                  style={{
                    fontSize: '2.2em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: '#333',
                  }}
                >
                  <FaCalendarAlt className="tgdp-icon purple" />
                  {`${formatDate(group.group_start_date)} đến ${formatDate(group.group_end_date)}`}
                </p>
              )}

              {/* 🔹 Địa chỉ của event đầu tiên */}
              {group.tournament_events[0]?.location && (
                <p
                  style={{
                    fontSize: '2.4em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: '#555',
                    marginTop: '4px',
                  }}
                >
                  <FaMapMarkerAlt className="tgdp-icon red" />
                  {group.tournament_events[0].location}
                </p>
              )}

              {/* 🔹 Nút điều lệ */}
              {group.group_regulations ? (
                <a
                  href={`${process.env.REACT_APP_API_BASE_URL}/uploads/regulations/${group.group_regulations}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="top-action-button primary"
                  style={{ marginTop: '10px', fontSize: '1.2em', display: 'inline-block', }}
                >
                  📥 Điều lệ
                </a>
              ) : (
                <button className="top-action-button grey" disabled style={{ marginTop: '10px', fontSize: '1.2em', display: 'inline-block',  }}>
                  📄 Điều lệ
                </button>
              )}
            </div>

            {/* 🔹 Carousel */}
            <div className="event-carousel-container">
              {group.tournament_events.length > 3 && (
                <button className="slide-btn left" onClick={() => handleSlide(group.group_id, 'left')}>
                  <FaChevronLeft />
                </button>
              )}

              <div className="event-carousel" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: '20px'
              }}>
                {group.tournament_events
                  .slice(eventIndexes[group.group_id], eventIndexes[group.group_id] + 2)
                  .map((ev) => (
                    <div key={ev.id} className="event-card">
                      {ev.ev_background_image && (
                        <img
                          src={`${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/${ev.ev_background_image}`}
                          alt="Event Background"
                          style={{
                            width: '100%',
                            height: '160px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                        />
                      )}
                      <h2
                        style={{
                          fontSize: '2.0em',
                          color: '#0044cc',
                          fontFamily: "'Oswald', sans-serif",
                          fontWeight: '700',
                          letterSpacing: '0.5px',
                          height: '3em', // giữ cố định 2 dòng
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        <Link
                          to={`/tournament_events/${ev.id}/detail-for-player`}
                          style={{
                            color: '#0044cc',
                            textDecoration: 'none',
                            display: 'inline-block',
                            width: '100%',
                          }}
                        >
                          {ev.name}
                        </Link>
                      </h2>

                      {(ev.start_date || ev.end_date) && (
                        <p style={{ fontSize: '1.4em' }}>
                          <FaCalendarAlt className="tgdp-icon purple" /> {`${formatDate(ev.start_date)} đến ${formatDate(ev.end_date)}`}
                        </p>
                      )}

                      {/* {ev.location && (
                      <p
                          style={{
                          fontSize: '1.1em',
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: expandedEventId === ev.id ? 'unset' : 3, // ✅ Mở rộng nếu đang click
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minHeight: expandedEventId === ev.id ? 'auto' : '4.5em', // giữ đều khi thu gọn
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          }}
                          title="Bấm để xem đầy đủ"
                          onClick={() =>
                          setExpandedEventId(expandedEventId === ev.id ? null : ev.id)
                          }
                      >
                          <FaMapMarkerAlt className="tgdp-icon red" /> {ev.location}
                      </p>
                      )} */}

                        {ev.maximum_competitors && (
                        <p style={{ fontSize: '1.4em' }}>
                            <FaUsers className="tgdp-icon blue" />{' '}
                            {`${ev.approved_competitors_count || 0}/${ev.maximum_competitors} players`}
                        </p>
                        )}

                        {ev.attendance_fee_common && (
                        <p style={{ fontSize: '1.4em' }}>
                            <FaMoneyBillWave className="tgdp-icon green" /> Lệ phí:{' '}
                            {Number(ev.attendance_fee_common).toLocaleString()} VNĐ
                        </p>
                        )}

                        {ev.prize && (
                        <p style={{ fontSize: '1.4em' }}>
                            <FaGift className="tgdp-icon orange" /> {ev.prize}
                        </p>
                        )}

                        {/* 🔹 Các nút hành động */}
                        {/* <div className="tgdp-event-actions">
                            <div
                                style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '10px',
                                marginTop: '10px',
                                flexWrap: 'wrap',
                                }}
                            >
                            {ev.registration_deadline && new Date(ev.registration_deadline) < new Date() ? (
                                <button className="tgdp-btn grey" disabled>
                                📝 Hết hạn đăng ký
                                </button>
                            ) : (
                                <Link
                                to={`/tournament_events/${ev.id}/register-single`}
                                className="tgdp-btn primary"
                                >
                                📝 Đăng Ký
                                </Link>
                            )}
                            </div>
                        </div> */}
                        {/* 🔹 Các nút hành động */}
                        <div
                        className="tgdp-event-actions"
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            //height: '100vh', // toàn màn hình
                        }}
                        >
                        <div
                            style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            gap: '10px',
                            flexWrap: 'wrap',
                            }}
                        >
                            {ev.registration_deadline && new Date(ev.registration_deadline) < new Date() ? (
                            <button className="tgdp-btn grey" disabled>
                                📝 Hết hạn đăng ký
                            </button>
                            ) : (
                            <Link
                                to={`/tournament_events/${ev.id}/register-single`}
                                className="tgdp-btn primary"
                            >
                                📝 Đăng Ký
                            </Link>
                            )}
                        </div>
                        </div>

                        <div className="tgdp-event-actions">
                          {/* 🔹 Nhóm 2 nút xuống hàng */}
                          <div
                              style={{
                              display: 'flex',
                              flexDirection: 'column', // 🔹 chuyển sang dọc
                              alignItems: 'center', // 🔹 canh giữa
                              justifyContent: 'center',
                              width: '100%',
                              gap: '10px',
                              marginTop: '10px',
                              //flexWrap: 'wrap',
                              }}
                          >
                              {ev.schedule_url ? (
                              <a
                                  href={ev.schedule_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="tgdp-btn primary"
                              >
                                  📅 Lịch Thi Đấu
                              </a>
                              ) : (
                              <button className="tgdp-btn grey" disabled>
                                  📅 Lịch Thi Đấu
                              </button>
                              )}

                              <Link to={`/tournament_events/${ev.id}/competitors`} className="tgdp-btn primary">
                              📋 Danh Sách Thi Đấu
                              </Link>
                          </div>
                        </div>
                    </div>
                  ))}
              </div>

              {group.tournament_events.length > 2 && (
                <button className="slide-btn right" onClick={() => handleSlide(group.group_id, 'right')}>
                  <FaChevronRight />
                </button>
              )}
            </div>
          </div>
        );
      })
    )}
  </div>
);
};

export default TournamentListForPlayer;
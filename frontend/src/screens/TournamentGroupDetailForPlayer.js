import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaUsers,
  FaMoneyBillWave,
  FaGift,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
} from 'react-icons/fa';
import '../css/tournamentGroupDetailForPlayer.scss';
import MainPageHeader from '../components/MainPageHeader';
import MainPageMenuBar from '../components/MainPageMenuBar';

const TournamentGroupDetailForPlayer = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventIndex, setEventIndex] = useState(0);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/groups-with-events`
        );
        const found = res.data.find(
          (g) => String(g.group_id) === String(groupId)
        );
        if (found) {
          // Sắp xếp event theo start_date DESC
          found.tournament_events.sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date) : new Date(0);
            const dateB = b.start_date ? new Date(b.start_date) : new Date(0);
            return dateB - dateA;
          });
          setGroup(found);
        }
      } catch (err) {
        console.error('❌ Lỗi tải group:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId]);

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
  };

  const handleSlide = (direction) => {
    if (!group) return;
    const max = group.tournament_events.length;
    if (max <= 2) return;

    let newIndex = eventIndex;
    if (direction === 'left') {
      newIndex = eventIndex - 1 < 0 ? max - 2 : eventIndex - 1;
    } else {
      newIndex = eventIndex + 1 > max - 2 ? 0 : eventIndex + 1;
    }
    setEventIndex(newIndex);
  };

  if (loading) return <p className="tgdp-loading">Đang tải...</p>;
  if (!group) return <p className="tgdp-error">Không tìm thấy nhóm giải.</p>;

  return (
    <div className="tgdp-wrapper">
      <MainPageHeader />
      <MainPageMenuBar />

      {/* Nút quay lại */}
      <div style={{ padding: '20px 40px' }}>
        <button
          onClick={() => navigate('/tournament_events')}
          className="tgdp-back-btn"
        >
          <FaArrowLeft /> Quay lại danh sách
        </button>
      </div>

      {/* Thông tin group */}
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
          <h1 className="tournament-group-title">{group.group_name}</h1>

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
              {`${formatDate(group.group_start_date)} đến ${formatDate(
                group.group_end_date
              )}`}
            </p>
          )}

          {group.tournament_events[0]?.location && (
            <p
              style={{
                fontSize: '2.2em',
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

          {group.group_regulations ? (
            <a
              href={`${process.env.REACT_APP_API_BASE_URL}/uploads/regulations/${group.group_regulations}`}
              target="_blank"
              rel="noopener noreferrer"
              className="top-action-button primary"
              style={{
                marginTop: '10px',
                fontSize: '1.2em',
                display: 'inline-block',
              }}
            >
              📥 Điều lệ
            </a>
          ) : (
            <button
              className="top-action-button grey"
              disabled
              style={{
                marginTop: '10px',
                fontSize: '1.2em',
                display: 'inline-block',
              }}
            >
              📄 Điều lệ
            </button>
          )}
        </div>

        {/* Danh sách event trong group */}
        <div className="event-carousel-container">
          {group.tournament_events.length > 3 && (
            <button className="slide-btn left" onClick={() => handleSlide('left')}>
              <FaChevronLeft />
            </button>
          )}

          <div
            className="event-carousel"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: '20px',
            }}
          >
            {group.tournament_events
              .slice(eventIndex, eventIndex + 2)
              .map((ev) => (
                <div key={ev.id} className="event-card">
                  {ev.ev_background_image && (
                    <img
                      className="event-image"
                      src={`${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/${ev.ev_background_image}`}
                      alt="Event Background"
                    />
                  )}
                  <h2
                    style={{
                      fontSize: '2.4em',
                      color: '#0044cc',
                      fontFamily: "'Oswald', sans-serif",
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                      height: '3em',
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
                    <p style={{ fontSize: '2.0em' }}>
                      <FaCalendarAlt className="tgdp-icon purple" />{' '}
                      {`${formatDate(ev.start_date)} đến ${formatDate(
                        ev.end_date
                      )}`}
                    </p>
                  )}

                  {ev.maximum_competitors && (
                    <p style={{ fontSize: '2.0em' }}>
                      <FaUsers className="tgdp-icon blue" />{' '}
                      {`${ev.approved_competitors_count || 0}/${
                        ev.maximum_competitors
                      } players`}
                    </p>
                  )}

                  {ev.attendance_fee_common && (
                    <p style={{ fontSize: '2.0em' }}>
                      <FaMoneyBillWave className="tgdp-icon green" /> Lệ phí:{' '}
                      {Number(ev.attendance_fee_common).toLocaleString()} VNĐ
                    </p>
                  )}

                  {ev.prize && (
                    <p style={{ fontSize: '2.0em' }}>
                      <FaGift className="tgdp-icon orange" /> {ev.prize}
                    </p>
                  )}

                  {/* Nút hành động */}
                  <div className="tgdp-event-actions">
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
                      {ev.registration_deadline &&
                      new Date(ev.registration_deadline) < new Date() ? (
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

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        gap: '10px',
                        marginTop: '10px',
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

                      <Link
                        to={`/tournament_events/${ev.id}/competitors`}
                        className="tgdp-btn primary"
                      >
                        📋 Danh Sách Thi Đấu
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {group.tournament_events.length > 2 && (
            <button className="slide-btn right" onClick={() => handleSlide('right')}>
              <FaChevronRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentGroupDetailForPlayer;
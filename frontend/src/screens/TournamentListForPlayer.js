import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaUsers,
  FaMoneyBillWave,
  FaGift,
  FaCalendarAlt,
} from 'react-icons/fa';
import '../css/tournamentGroupDetailForPlayer.scss';
import MainPageHeader from '../components/MainPageHeader';
import MainPageMenuBar from '../components/MainPageMenuBar';

const TournamentListForPlayer = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/groups-with-events`
        );

        // Sắp xếp group: start_date DESC (muộn → sớm)
        const sortedGroups = [...res.data].sort((a, b) => {
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

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${d.getFullYear()}`;
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
          const groupBgUrl = group.background_image
            ? `${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/groups/${group.background_image}`
            : null;

          return (
            <div key={group.group_id} className="tgdp-group-section">
              {/* Ảnh nền group */}
              {groupBgUrl && (
                <div className="tgdp-group-bg">
                  <img src={groupBgUrl} alt="Group Background" />
                  <div className="tgdp-regulation-btn">
                    {group.group_regulations ? (
                      <a
                        href={`${process.env.REACT_APP_API_BASE_URL}/uploads/regulations/${group.group_regulations}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="top-action-button primary"
                      >
                        📥 Điều lệ
                      </a>
                    ) : (
                      <button className="top-action-button grey" disabled>
                        📄 Điều lệ
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tiêu đề nhóm */}
              <div className="tournament-group-header">
                <h1 className="tournament-title">{group.group_name}</h1>
                {(group.group_start_date || group.group_end_date) && (
                  <p className="tgdp-event-line">
                    <FaCalendarAlt className="tgdp-icon purple" />{' '}
                    {`${formatDate(group.group_start_date)} - ${formatDate(
                      group.group_end_date
                    )}`}
                  </p>
                )}
              </div>

              {/* Các giải đấu (event) trong group */}
              <div className="tgdp-events">
                {group.tournament_events.map((ev) => (
                  <div key={ev.id} className="tgdp-event-card">
                    {/* Ảnh nền event */}
                    {ev.ev_background_image && (
                      <div className="tgdp-event-bg">
                        <img
                          src={`${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/${ev.ev_background_image}`}
                          alt="Event Background"
                        />
                      </div>
                    )}

                    <h2 className="tgdp-event-title">{ev.name}</h2>

                    {(ev.start_date || ev.end_date) && (
                      <p className="tgdp-event-line">
                        <FaCalendarAlt className="tgdp-icon purple" />{' '}
                        {`${formatDate(ev.start_date)} - ${formatDate(ev.end_date)}`}
                      </p>
                    )}

                    {ev.location && (
                      <p className="tgdp-event-line">
                        <FaMapMarkerAlt className="tgdp-icon red" /> {ev.location}
                      </p>
                    )}

                    {ev.maximum_competitors && (
                      <p className="tgdp-event-line">
                        <FaUsers className="tgdp-icon blue" />{' '}
                        {`${ev.approved_competitors_count || 0}/${ev.maximum_competitors} players`}
                      </p>
                    )}

                    {ev.attendance_fee_common && (
                      <p className="tgdp-event-line">
                        <FaMoneyBillWave className="tgdp-icon green" /> Lệ phí:{' '}
                        {Number(ev.attendance_fee_common).toLocaleString()} VNĐ
                      </p>
                    )}

                    {ev.prize && (
                      <p className="tgdp-event-line">
                        <FaGift className="tgdp-icon orange" /> {ev.prize}
                      </p>
                    )}

                    {/* Các nút hành động */}
                    <div className="tgdp-event-actions">
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
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TournamentListForPlayer;
// File: frontend/src/screens/TournamentGroupDetailForPlayer.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  FaMapMarkerAlt,
  FaUsers,
  FaMoneyBillWave,
  FaGift,
  FaArrowLeft,
  FaCalendarAlt 
} from 'react-icons/fa';
import '../css/tournamentGroupDetailForPlayer.scss';

const TournamentGroupDetailForPlayer = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/group/${groupId}`
        );
        setGroup(res.data.group);
        setEvents(res.data.tournament_events || []);
      } catch (err) {
        console.error('❌ Lỗi tải group:', err);
        setGroup(null);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId]);

    useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) setUser(JSON.parse(userInfo));
    }, []);

  if (loading) return <p className="tgdp-loading">Đang tải...</p>;
  if (!group) return <p className="tgdp-error">Không tìm thấy nhóm giải</p>;

  const logoUrl = group.logo_image
    ? `${process.env.REACT_APP_API_BASE_URL}/uploads/logos/${group.logo_image}`
    : null;

  const groupBgUrl = group.background_image
    ? `${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/groups/${group.background_image}`
    : null;

    const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${d.getFullYear()}`;
    };

  return (
    <div
      className="tgdp-wrapper"
    //   style={{
    //     backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
    //   }}
    >
      {/* Nút quay lại */}
      <div className="tgdp-header">
        <button onClick={() => navigate('/tournament_events')} className="tgdp-back-btn">
          <FaArrowLeft /> Quay lại
        </button>
      </div>

    {/* Ảnh background group + nút Điều Lệ */}
    {groupBgUrl && (
    <div className="tgdp-group-bg">
        <img src={groupBgUrl} alt="Group Background" />

        {/* Nút Điều Lệ đè góc dưới bên phải */}
        <div className="tgdp-regulation-btn">
        {group?.regulations ? (
            <a
            href={`${process.env.REACT_APP_API_BASE_URL}/uploads/regulations/${group.regulations}`}
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

      {/* Logo Group */}
      {/* {logoUrl && (
        <div className="tgdp-logo">
          <img src={logoUrl} alt="Tournament Logo" />
        </div>
      )} */}

      {/* Các sự kiện */}
      <div className="tgdp-events">
        {events.map((ev) => (
          <div key={ev.id} className="tgdp-event-card">

            {/* Ảnh background event */}
            {ev.background_image && (
            <div className="tgdp-event-bg">
                <img
                src={`${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/${ev.background_image}`}
                alt="Event Background"
                />
            </div>
            )}
            <h2 className="tgdp-event-title">{ev.name}</h2>
            {/* Thời gian */}
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
            <Link to={`/tournament/${ev.id}/register`} className="tgdp-btn primary">
                Đăng Ký
            </Link>
            <Link to={`/tournament_events/${ev.id}/competitors`} className="tgdp-btn secondary">
                Danh Sách Thi Đấu
            </Link>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentGroupDetailForPlayer;
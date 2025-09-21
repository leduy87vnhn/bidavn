// File: frontend/src/screens/TournamentGroupDetailForPlayer.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaMapMarkerAlt,
  FaUsers,
  FaMoneyBillWave,
  FaGift,
  FaArrowLeft,
} from 'react-icons/fa';
import '../css/tournamentGroupDetailForPlayer.scss';

const TournamentGroupDetailForPlayer = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="tgdp-loading">Đang tải...</p>;
  if (!group) return <p className="tgdp-error">Không tìm thấy nhóm giải</p>;

  const logoUrl = group.logo_image
    ? `${process.env.REACT_APP_API_BASE_URL}/uploads/logos/${group.logo_image}`
    : null;

  const backgroundUrl = group.background_image
    ? `${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/groups/${group.background_image}`
    : null;

  return (
    <div
      className="tgdp-wrapper"
      style={{
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
      }}
    >
      {/* Nút quay lại */}
      <div className="tgdp-header">
        <button onClick={() => navigate('/tournament_events')} className="tgdp-back-btn">
          <FaArrowLeft /> Quay lại
        </button>
      </div>

      {/* Logo Group */}
      {logoUrl && (
        <div className="tgdp-logo">
          <img src={logoUrl} alt="Tournament Logo" />
        </div>
      )}

      {/* Các sự kiện */}
      <div className="tgdp-events">
        {events.map((ev) => (
          <div key={ev.id} className="tgdp-event-card">
            <h2 className="tgdp-event-title">{ev.name}</h2>

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
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentGroupDetailForPlayer;
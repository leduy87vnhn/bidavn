import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaMapMarkerAlt,
  FaUsers,
  FaMoneyBillWave,
  FaGift,
  FaArrowLeft,
  FaCalendarAlt,
} from "react-icons/fa";
import "../css/tournamentGroupDetailForPlayer.scss";

const TournamentEventForPlayer = () => {
  const { eventId } = useParams(); // id của tournament_event
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [group, setGroup] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultFace =
    "https://cdn.pixabay.com/photo/2014/04/03/10/32/billiards-311939_1280.png"; // ảnh mặc định anime billiard

  const formatDate = (isoStr) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    return `${d.getDate().toString().padStart(2, "0")}-${(
      d.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${d.getFullYear()}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy thông tin event
        const evRes = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/${eventId}`
        );
        setEvent(evRes.data);

        // Lấy thông tin group
        if (evRes.data.group_id) {
          const groupRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/group/${evRes.data.group_id}`
          );
          setGroup(groupRes.data.group);
        }

        // Lấy danh sách vận động viên
        const compRes = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/registration_form/by-tournament/${eventId}`
        );
        setCompetitors(compRes.data.filter((c) => String(c.status) === "1")); // chỉ hiện VĐV đã duyệt
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  if (loading) return <p className="tgdp-loading">Đang tải...</p>;
  if (!event) return <p className="tgdp-error">Không tìm thấy giải đấu</p>;

  const groupBgUrl = group?.background_image
    ? `${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/groups/${group.background_image}`
    : null;

  const evBgUrl = event.background_image
    ? `${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/${event.background_image}`
    : null;

  return (
    <div className="tgdp-wrapper">
      {/* 🔙 Nút quay lại */}
      <div className="tgdp-header">
        <button
          onClick={() => navigate("/tournament_events")}
          className="tgdp-back-btn"
        >
          <FaArrowLeft /> Quay lại
        </button>
      </div>

      {/* Ảnh nền Group */}
      {groupBgUrl && (
        <div className="tgdp-group-bg">
          <img src={groupBgUrl} alt="Group Background" />
        </div>
      )}

      {/* Thông tin nhóm */}
      {group && (
        <div className="tgdp-group-info">
          <h1 className="tgdp-group-title">{group.tournament_name}</h1>
          {(group.start_date || group.end_date) && (
            <p className="tgdp-event-line">
              <FaCalendarAlt className="tgdp-icon purple" />{" "}
              {`${formatDate(group.start_date)} - ${formatDate(group.end_date)}`}
            </p>
          )}
        </div>
      )}

      {/* Thông tin event */}
      <div className="tgdp-event-card">
        {evBgUrl && (
          <div className="tgdp-event-bg">
            <img src={evBgUrl} alt="Event Background" />
          </div>
        )}

        <h2 className="tgdp-event-title">{event.name}</h2>

        {(event.start_date || event.end_date) && (
          <p className="tgdp-event-line">
            <FaCalendarAlt className="tgdp-icon purple" />{" "}
            {`${formatDate(event.start_date)} - ${formatDate(event.end_date)}`}
          </p>
        )}

        {event.location && (
          <p className="tgdp-event-line">
            <FaMapMarkerAlt className="tgdp-icon red" /> {event.location}
          </p>
        )}

        {event.maximum_competitors && (
          <p className="tgdp-event-line">
            <FaUsers className="tgdp-icon blue" />{" "}
            {`${event.approved_competitors_count || 0}/${
              event.maximum_competitors
            } players`}
          </p>
        )}

        {event.attendance_fee_common && (
          <p className="tgdp-event-line">
            <FaMoneyBillWave className="tgdp-icon green" /> Lệ phí:{" "}
            {Number(event.attendance_fee_common).toLocaleString()} VNĐ
          </p>
        )}

        {event.prize && (
          <p className="tgdp-event-line">
            <FaGift className="tgdp-icon orange" /> {event.prize}
          </p>
        )}
      </div>

      {/* Danh sách VĐV */}
      <div className="tgdp-competitor-grid">
        {competitors.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: 30 }}>
            Chưa có vận động viên nào được duyệt.
          </p>
        ) : (
          competitors.map((c, idx) => (
            <div key={idx} className="tgdp-competitor-card">
              <img
                src={
                  c.face_photo
                    ? `${process.env.REACT_APP_API_BASE_URL}/uploads/players/${c.face_photo}`
                    : defaultFace
                }
                alt={c.name}
                className="tgdp-competitor-photo"
              />
              <div className="tgdp-competitor-info">
                <h4>{c.name}</h4>
                <p>SĐT: {c.phone}</p>
                {c.club && <p>CLB: {c.club}</p>}
                {c.uniform_size && <p>Size: {c.uniform_size}</p>}
                {c.selected_date && (
                  <p>
                    Ngày thi đấu: {formatDate(c.selected_date.slice(0, 10))}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TournamentEventForPlayer;
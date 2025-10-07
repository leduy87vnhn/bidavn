// File: frontend/src/screens/TournamentEventForPlayer.js
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
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [group, setGroup] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultFace =
    "https://cdn.pixabay.com/photo/2014/04/03/10/32/billiards-311939_1280.png";

  const formatDate = (isoStr) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getFullYear()}`;
  };

  // ⭐ Chỉ hiện 3 số cuối, còn lại là *
  const maskPhone = (phone) => {
    if (!phone) return "";
    const digits = String(phone).replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    const last3 = digits.slice(-3);
    return "*".repeat(digits.length - 3) + last3;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const evRes = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/${eventId}`
        );
        setEvent(evRes.data);

        if (evRes.data.group_id) {
          const groupRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/group/${evRes.data.group_id}`
          );
          setGroup(groupRes.data.group);
        }

        const compRes = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/registration_form/by-tournament/${eventId}`
        );
        setCompetitors(compRes.data.filter((c) => String(c.status) === "1"));
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

  const googleMapUrl = event.location
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        event.location
      )}&output=embed`
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

      {/* 🗺️ Google Map */}
      {googleMapUrl && (
        <div
          style={{
            margin: "30px auto",
            width: "90%",
            maxWidth: "800px",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
          }}
        >
          <iframe
            src={googleMapUrl}
            title="Google Map"
            width="100%"
            height="350"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>
      )}

      {/* 🏆 Label Danh sách VĐV */}
      <h2
        style={{
          fontFamily: "'Oswald', sans-serif",
          textAlign: "center",
          fontSize: "1.8em",
          color: "#0044cc",
          marginTop: "40px",
          marginBottom: "20px",
          letterSpacing: "1px",
        }}
      >
        Danh sách vận động viên
      </h2>

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
                alt="" // tránh lộ chữ alt khi lỗi ảnh
                className="tgdp-competitor-photo"
                onError={(e) => {
                  // fallback khi ảnh 404/lỗi
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultFace;
                }}
              />
              <div className="tgdp-competitor-info">
                <h4>{c.name}</h4>
                <p>SĐT: {maskPhone(c.phone)}</p>
                {c.club && <p>CLB: {c.club}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TournamentEventForPlayer;
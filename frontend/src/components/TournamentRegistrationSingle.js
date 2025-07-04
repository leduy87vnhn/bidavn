import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../tournamentRegistration.scss';
import ReactModal from 'react-modal';

const TournamentRegistrationSingle = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [competitor, setCompetitor] = useState({ name: '', phone: '', nickname: '', club: '', selected_date: '', uniform_size: 'L' });
  const [playerSuggestions, setPlayerSuggestions] = useState([]);
  const [playerSearchText, setPlayerSearchText] = useState('');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [status, setStatus] = useState(0);
  const [message, setMessage] = useState('');
  const [user] = useState(JSON.parse(localStorage.getItem('user_info')));
  const [availableDates, setAvailableDates] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalInfo, setModalInfo] = useState({});
  const [resolvedPlayerId, setResolvedPlayerId] = useState('');
  const [clubSuggestions, setClubSuggestions] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState({ id: '', name: '', phone: '' });

  useEffect(() => {
    if (!user) {
      alert('Bạn cần đăng nhập để tiếp tục.');
      navigate('/login');
    }
  }, [user, navigate]);

  const loadAvailableSlots = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/slots?tournament_id=${tournamentId}`);
      setAvailableDates(res.data.available_dates || []);
    } catch (err) {
      console.error('Lỗi khi tải slot:', err);
    }
  };

  const loadTournament = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${tournamentId}`);
      setTournament(res.data);
      setBackgroundImage(res.data.background_image);
      loadAvailableSlots();
    } catch {
      setMessage('❌ Không tìm thấy giải đấu.');
    }
  };

  useEffect(() => {
    loadTournament();
    setRegisteredPhone(user?.phone_number || '');
  }, [tournamentId]);

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/clubs`);
        setClubSuggestions(res.data);
      } catch (err) {
        console.warn('Không thể tải danh sách CLB.');
      }
    };
    loadClubs();
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (playerSearchText.length < 2) {
        setPlayerSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/search?query=${playerSearchText}`);
        setPlayerSuggestions(res.data);
      } catch (err) {
        console.error('Lỗi tìm kiếm theo ID:', err);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [playerSearchText]);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!playerSearchText && !competitor.name && competitor.phone?.length >= 4) {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/search?query=${competitor.phone}`);
          setPlayerSuggestions(res.data.slice(0, 5));
        } catch (err) {
          console.error('Lỗi tìm theo phone:', err);
        }
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [competitor.phone]);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!playerSearchText && !competitor.phone && competitor.name?.length >= 2) {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/search?query=${competitor.name}`);
          setPlayerSuggestions(res.data.slice(0, 5));
        } catch (err) {
          console.error('Lỗi tìm theo tên:', err);
        }
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [competitor.name]);

  const getFilteredClubs = () => {
    if (!competitor.club.trim()) return [];
    return clubSuggestions.filter(c => c.toLowerCase().includes(competitor.club.toLowerCase())).slice(0, 5);
  };

  const handleSelectSuggestion = (player) => {
    setCompetitor({
      name: player.name,
      phone: player.phone,
      nickname: player.nickname || '',
      club: player.club || '',
      selected_date: '',
      uniform_size: 'L'
    });
    setPlayerSearchText(player.id.toString());
    setPlayerSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!competitor.name || !competitor.phone || !registeredPhone) {
      setMessage('❌ Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    if (competitor.selected_date) {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/slots?tournament_id=${tournamentId}`);
        const remaining = res.data.available_dates.find(d => d.value === competitor.selected_date)?.remaining ?? 0;
        if (remaining <= 0) {
          alert(`Đã vượt quá số lượng VĐV cho ngày ${competitor.selected_date}`);
          return;
        }
      } catch (err) {
        console.error('Lỗi kiểm tra slot:', err);
      }
    }

    if (tournament.maximum_competitors > 0) {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/count?tournament_id=${tournamentId}`);
        if (res.data.total >= tournament.maximum_competitors) {
          alert('🚫 Đã vượt quá số lượng VĐV tối đa toàn giải.');
          return;
        }
      } catch (err) {
        console.error('Lỗi kiểm tra số lượng VĐV toàn giải:', err);
        alert('Không thể kiểm tra giới hạn VĐV. Vui lòng thử lại.');
        return;
      }
    }

    try {
      const resolveRes = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/resolve-player`, {
        name: competitor.name,
        phone: competitor.phone
      });

      if (resolveRes.data.status !== 'ok') {
        setMessage('❌ Không xác định được VĐV.');
        return;
      }

      const player_id = resolveRes.data.player_id;
      setResolvedPlayerId(player_id);

      const formRes = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form`, {
        tournament_id: tournament.id,
        registered_phone: registeredPhone,
        user_id: user?.id
      });

      const registration_form_id = formRes.data.id;

      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/competitors`, {
        registration_form_id,
        player_id,
        nick_name: competitor.nickname?.trim() || competitor.name,
        club: competitor.club,
        uniform_size: competitor.uniform_size || 'L',
        selected_date: competitor.selected_date || null
      });

      const totalFee = parseInt(tournament.attendance_price || 0);
      setModalInfo({
        tournamentName: tournament.name,
        totalFee,
        bankNumber: tournament.bank_number,
        bankAccName: tournament.bank_acc_name,
        bankName: tournament.bank_name,
        bankQr: tournament.bank_qr
      });
      setShowSuccessModal(true);
      setMessage('');
    } catch (err) {
      if (
        err.response?.status === 400 &&
        err.response.data?.message?.includes('SĐT đã tồn tại với VĐV khác.')
      ) {
        try {
          const conflictRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/by-phone?phone=${competitor.phone}`);
          const conflict = conflictRes.data;
          setConflictInfo({
            id: conflict.id,
            name: conflict.name,
            phone: conflict.phone
          });
          setShowConflictModal(true);
        } catch {
          setMessage('❌ Không thể lấy thông tin VĐV bị trùng.');
        }
      } else {
        setMessage(err.response?.data?.message || '❌ Lỗi khi xác định VĐV.');
      }
    }
  };

  return (
    <div className="tournament-registration" style={{
      backgroundImage: backgroundImage ? `url(${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/${backgroundImage})` : 'none',
      backgroundSize: 'cover',
      minHeight: '100vh',
      padding: 40
    }}>
      <div style={{ backgroundColor: 'white', maxWidth: 800, margin: 'auto', padding: 20, borderRadius: 12 }}>
        <button onClick={() => navigate(`/tournaments/${tournamentId}`)}>⬅️ Quay Lại Chi Tiết Giải Đấu</button>
        <h2>Đăng ký thi đấu cá nhân <span style={{ backgroundColor: '#ffe0b3', padding: '4px 8px', borderRadius: 6 }}>Chưa Phê Duyệt</span></h2>

        {tournament && (
          <div>
            <p><strong>Tên giải:</strong> {tournament.name}</p>
            <p><strong>Thời gian:</strong> {new Date(tournament.start_date).toLocaleDateString('vi-VN')} → {new Date(tournament.end_date).toLocaleDateString('vi-VN')}</p>
            <p><strong>Địa điểm:</strong> {tournament.location}</p>
            <p><strong>Nội dung:</strong> {tournament.content}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ✅ SĐT Người đăng ký */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ width: '160px', fontWeight: 'bold' }}>SĐT Người đăng ký:</label>
            <input
              type="text"
              placeholder="Số điện thoại người đăng ký (*)"
              value={registeredPhone}
              onChange={e => setRegisteredPhone(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          {/* ✅ ID VĐV */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ width: '160px', fontWeight: 'bold' }}>ID VĐV:</label>
            <input
              type="text"
              placeholder="Gõ vài ký tự đầu để được gợi ý. ID có dạng H01234"
              value={playerSearchText}
              onChange={e => setPlayerSearchText(e.target.value.toUpperCase())}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            {playerSearchText && playerSuggestions.length > 0 && !competitor.name && !competitor.phone && (
              <ul className="autocomplete-list">
                {playerSuggestions.map(p => (
                  <li key={p.id} onClick={() => handleSelectSuggestion(p)}>#{p.id} - {p.name} ({p.phone})</li>
                ))}
              </ul>
            )}
          </div>

          {/* ✅ Tên VĐV */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ width: '160px', fontWeight: 'bold' }}>Tên VĐV:</label>
            <input
              type="text"
              placeholder="Tên VĐV có dấu (*)"
              value={competitor.name}
              onChange={e => setCompetitor({ ...competitor, name: e.target.value.toUpperCase() })}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            {!playerSearchText && !competitor.phone && competitor.name && playerSuggestions.length > 0 && (
              <ul className="autocomplete-list">
                {playerSuggestions.map(p => (
                  <li key={p.id} onClick={() => handleSelectSuggestion(p)}>#{p.id} - {p.name} ({p.phone})</li>
                ))}
              </ul>
            )}
          </div>

          {/* ✅ SĐT VĐV */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ width: '160px', fontWeight: 'bold' }}>SĐT VĐV:</label>
            <input
              type="text"
              placeholder="SĐT VĐV (*)"
              value={competitor.phone}
              onChange={e => setCompetitor({ ...competitor, phone: e.target.value })}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            {!playerSearchText && !competitor.name && competitor.phone && playerSuggestions.length > 0 && (
              <ul className="autocomplete-list">
                {playerSuggestions.map(p => (
                  <li key={p.id} onClick={() => handleSelectSuggestion(p)}>#{p.id} - {p.name} ({p.phone})</li>
                ))}
              </ul>
            )}
          </div>

          {/* ✅ Nickname */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ width: '160px', fontWeight: 'bold' }}>Nickname:</label>
            <input
              type="text"
              placeholder="Tên thường gọi (có thể bỏ trống)"
              value={competitor.nickname}
              onChange={e => setCompetitor({ ...competitor, nickname: e.target.value })}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          {/* ✅ Đơn vị */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ width: '160px', fontWeight: 'bold' }}>Đơn vị:</label>
            <input
              type="text"
              placeholder="Tên CLB hoặc nơi sinh hoạt (*)"
              value={competitor.club}
              onChange={e => setCompetitor({ ...competitor, club: e.target.value })}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            {getFilteredClubs().length > 0 && (
              <ul className="autocomplete-list">
                {getFilteredClubs().map((club, i) => (
                  <li key={i} onClick={() => setCompetitor({ ...competitor, club })}>{club}</li>
                ))}
              </ul>
            )}
          </div>

          {/* ✅ Ngày thi đấu */}
          {availableDates.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontWeight: 'bold' }}>Chọn ngày thi đấu:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="selected_date"
                    value=""
                    checked={competitor.selected_date === ''}
                    onChange={() => setCompetitor({ ...competitor, selected_date: '' })}
                  />
                  <span>Không chọn ngày</span>
                </label>
                {availableDates.map(({ value, display, remaining }) => (
                  <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      name="selected_date"
                      value={value}
                      checked={competitor.selected_date === value}
                      onChange={(e) => setCompetitor({ ...competitor, selected_date: e.target.value })}
                    />
                    <span>{display} (còn lại: {remaining})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button type="submit">📤 Gửi Đăng Ký</button>

          {message && <p style={{ marginTop: '10px', color: message.includes('❌') ? 'red' : 'green', fontWeight: 'bold' }}>{message}</p>}
        </form>
      </div>

      <ReactModal isOpen={showSuccessModal} onRequestClose={() => setShowSuccessModal(false)} ariaHideApp={false}>
        <h2>Thông tin nộp lệ phí</h2>
        <p>Chuyển khoản <strong>{modalInfo.totalFee?.toLocaleString('vi-VN')} VND</strong> đến:</p>
        <p>📄 STK: {modalInfo.bankNumber}</p>
        <p>👤 Chủ TK: {modalInfo.bankAccName}</p>
        <p>🏦 Ngân hàng: {modalInfo.bankName}</p>
        {modalInfo.bankQr && <img src={`${process.env.REACT_APP_API_BASE_URL}/uploads/qr/${modalInfo.bankQr}`} alt="QR" style={{ width: 200 }} />}
        <button
          onClick={() => {
            setShowSuccessModal(false);
            navigate(`/tournament/${tournamentId}/competitors`);
          }}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: '#28a745',
            color: '#fff',
            border: 'none',
            fontWeight: 'bold'
          }}
        >
          Đóng
        </button>
      </ReactModal>

      <ReactModal isOpen={showConflictModal} onRequestClose={() => setShowConflictModal(false)} ariaHideApp={false}>
        <h2>⚠️ SĐT đã tồn tại</h2>
        <p>Thông tin VĐV bị trùng:</p>
        <p><strong>ID:</strong> {conflictInfo.id}</p>
        <p><strong>Tên:</strong> {conflictInfo.name}</p>
        <p><strong>SĐT:</strong> {conflictInfo.phone}</p>
        <button onClick={() => setShowConflictModal(false)}>Đóng</button>
      </ReactModal>
    </div>
  );
};

export default TournamentRegistrationSingle;
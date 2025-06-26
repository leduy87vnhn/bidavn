import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ReactModal from 'react-modal';
import '../tournamentRegistration.scss';

const TournamentRegistrationSingle = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user_info'));

  const [tournament, setTournament] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [playerSuggestions, setPlayerSuggestions] = useState([]);
  const [playerSearchText, setPlayerSearchText] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [resolvedPlayerId, setResolvedPlayerId] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalInfo, setModalInfo] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [status, setStatus] = useState(0);

  const [competitor, setCompetitor] = useState({
    name: '',
    phone: '',
    nickname: '',
    club: '',
    selected_date: '',
    uniform_size: 'L',
    registered_phone: user?.phone_number || ''
  });

  const getStatusStyle = () => {
    switch (status) {
      case 1: return { backgroundColor: '#d0ecff', color: '#0056b3', padding: '6px 12px', borderRadius: '6px' };
      case 2: return { backgroundColor: '#ccc', color: '#000', padding: '6px 12px', borderRadius: '6px' };
      default: return { backgroundColor: '#ffe0b3', color: '#cc7000', padding: '6px 12px', borderRadius: '6px' };
    }
  };

  useEffect(() => {
    if (!user) {
      alert('Bạn cần đăng nhập để tiếp tục.');
      navigate('/login');
    }
  }, []);

  useEffect(() => {
    const fetchTournament = async () => {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${tournamentId}`);
      setTournament(res.data);
      setBackgroundImage(res.data.background_image);
      const slots = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/slots?tournament_id=${tournamentId}`);
      setAvailableDates(slots.data.available_dates || []);
    };
    fetchTournament();
  }, [tournamentId]);

    // Gợi ý theo ID (playerSearchText)
    useEffect(() => {
    const delayDebounce = setTimeout(async () => {
        if (playerSearchText.length < 2) {
        setPlayerSuggestions([]);
        return;
        }
        try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/search?query=${playerSearchText}`);
        setPlayerSuggestions(res.data);
        } catch (err) {
        console.error('Lỗi tìm kiếm VĐV:', err);
        }
    }, 300);
    return () => clearTimeout(delayDebounce);
    }, [playerSearchText]);

    // Gợi ý theo SĐT nếu chưa có tên và chưa gõ ID
    useEffect(() => {
    const delayDebounce = setTimeout(async () => {
        if (
        competitor.name === '' &&
        playerSearchText === '' &&
        competitor.phone?.length >= 4
        ) {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/search?query=${competitor.phone}`);
            setPlayerSuggestions(res.data.slice(0, 5));
        } catch (err) {
            console.error('Lỗi tìm VĐV theo phone:', err);
        }
        }
    }, 300);
    return () => clearTimeout(delayDebounce);
    }, [competitor.phone]);

    // Gợi ý theo Tên nếu chưa có SĐT và chưa gõ ID
    useEffect(() => {
    const delayDebounce = setTimeout(async () => {
        if (
        playerSearchText === '' &&
        competitor.phone === '' &&
        competitor.name?.length >= 2
        ) {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/search?query=${competitor.name}`);
            setPlayerSuggestions(res.data.slice(0, 5));
        } catch (err) {
            console.error('Lỗi tìm VĐV theo tên:', err);
        }
        }
    }, 300);
    return () => clearTimeout(delayDebounce);
    }, [competitor.name]);

  const handleSelectSuggestion = (player) => {
    setCompetitor({
      ...competitor,
      name: player.name,
      phone: player.phone,
      nickname: player.nickname || '',
      club: player.club || '',
      selected_date: '',
      uniform_size: 'L'
    });
    setPlayerSearchText(player.id.toString());
    setResolvedPlayerId(player.id);
    setPlayerSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!competitor.name || !competitor.phone) {
      setMessage('❌ Thiếu tên hoặc SĐT vận động viên.');
      return;
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

      setResolvedPlayerId(resolveRes.data.player_id);
      setShowConfirmModal(true);
    } catch (err) {
      setMessage(err.response?.data?.message || '❌ Lỗi khi xác định VĐV.');
    }
  };

  const confirmRegister = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form`, {
        tournament_id: tournamentId,
        registered_phone: competitor.registered_phone,
        user_id: user?.id
      });

      const registration_form_id = res.data.id;

      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/competitors`, {
        registration_form_id,
        player_id: resolvedPlayerId,
        nick_name: competitor.nickname?.trim() || competitor.name,
        club: competitor.club,
        uniform_size: competitor.uniform_size,
        selected_date: competitor.selected_date || null
      });

      setStatus(0);

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
    } catch (err) {
      setMessage(err.response?.data?.message || '❌ Lỗi khi gửi đăng ký.');
    } finally {
      setShowConfirmModal(false);
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
        <div style={{ textAlign: 'right', marginBottom: '10px' }}>
          <button
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
            style={{ backgroundColor: '#6c757d', color: 'white', padding: '8px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >⬅️ Quay Lại Chi Tiết Giải Đấu</button>
        </div>

        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Đăng ký thi đấu cá nhân
          <span style={getStatusStyle()}>
            {status === 1 ? 'Đã Phê Duyệt' : status === 2 ? 'Đã Hủy' : 'Chưa Phê Duyệt'}
          </span>
        </h2>

        {tournament && (
          <div className="tournament-info">
            <p><strong>Tên giải:</strong> {tournament.name}</p>
            <p><strong>Thời gian:</strong> {new Date(tournament.start_date).toLocaleDateString('vi-VN')} → {new Date(tournament.end_date).toLocaleDateString('vi-VN')}</p>
            <p><strong>Địa điểm:</strong> {tournament.location}</p>
            <p><strong>Nội dung:</strong> {tournament.content}</p>
            <p>
              👉 <a href={`/tournament/${tournament.id}/competitors`} style={{ color: '#007bff', textDecoration: 'underline' }}>
                Xem danh sách VĐV đã đăng ký
              </a>
            </p>
          </div>
        )}

        <div style={{ margin: '40px 0 20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '22px', color: '#333' }}>📝 Điền Thông Tin Vận Động Viên</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <label>SĐT Người đăng ký</label>
          <input value={competitor.registered_phone} onChange={(e) => setCompetitor({ ...competitor, registered_phone: e.target.value })} />

          <label>ID VĐV (gợi ý)</label>
          <input value={playerSearchText} onChange={(e) => setPlayerSearchText(e.target.value.toUpperCase())} />
          {playerSuggestions.length > 0 && competitor.name === '' && competitor.phone === '' && (
            <ul className="autocomplete-list">
              {playerSuggestions.map((p) => (
                <li key={p.id} onClick={() => handleSelectSuggestion(p)}>
                  #{p.id} - {p.name} ({p.phone})
                </li>
              ))}
            </ul>
          )}

          <label>Tên VĐV</label>
          <input value={competitor.name} onChange={(e) => setCompetitor({ ...competitor, name: e.target.value.toUpperCase() })} />

          <label>SĐT VĐV</label>
          <input value={competitor.phone} onChange={(e) => setCompetitor({ ...competitor, phone: e.target.value })} />

          <label>Nickname</label>
          <input value={competitor.nickname} onChange={(e) => setCompetitor({ ...competitor, nickname: e.target.value })} />

          <label>Đơn vị</label>
          <input value={competitor.club} onChange={(e) => setCompetitor({ ...competitor, club: e.target.value })} />

          {availableDates.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <label><strong>Chọn ngày thi đấu:</strong></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <label><input type="radio" name="selected_date" value="" checked={competitor.selected_date === ''} onChange={() => setCompetitor({ ...competitor, selected_date: '' })} /> Không chọn ngày</label>
                {availableDates.map(({ value, display, remaining }) => (
                  <label key={value}>
                    <input type="radio" name="selected_date" value={value} checked={competitor.selected_date === value} onChange={(e) => setCompetitor({ ...competitor, selected_date: e.target.value })} />
                    {display} (còn lại: {remaining})
                  </label>
                ))}
              </div>
            </div>
          )}

          <button type="submit">📤 Gửi đăng ký</button>
          {message && <p>{message}</p>}
        </form>
      </div>

      <ReactModal isOpen={showConfirmModal} onRequestClose={() => setShowConfirmModal(false)} ariaHideApp={false}>
        <h2>Xác nhận đăng ký</h2>
        <p>Bạn có chắc chắn muốn đăng ký vận động viên {competitor.name} ({competitor.phone})?</p>
        <button onClick={confirmRegister}>Xác nhận</button>
        <button onClick={() => setShowConfirmModal(false)}>Hủy</button>
      </ReactModal>

      <ReactModal isOpen={showSuccessModal} onRequestClose={() => setShowSuccessModal(false)} ariaHideApp={false}>
        <h2>Thông tin nộp lệ phí</h2>
        <p>Vui lòng chuyển khoản <strong>{modalInfo.totalFee?.toLocaleString('vi-VN')} VND</strong> đến:</p>
        <p>📄 STK: {modalInfo.bankNumber}</p>
        <p>👤 Chủ TK: {modalInfo.bankAccName}</p>
        <p>🏦 Ngân hàng: {modalInfo.bankName}</p>
        {modalInfo.bankQr && <img src={`${process.env.REACT_APP_API_BASE_URL}/uploads/qr/${modalInfo.bankQr}`} alt="QR" style={{ width: 200 }} />}
        <button onClick={() => setShowSuccessModal(false)}>Đóng</button>
      </ReactModal>
    </div>
  );
};

export default TournamentRegistrationSingle;
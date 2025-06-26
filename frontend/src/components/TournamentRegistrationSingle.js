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
  const [clubSuggestions, setClubSuggestions] = useState([]);
  const [playerSearchText, setPlayerSearchText] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [resolvedPlayerId, setResolvedPlayerId] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalInfo, setModalInfo] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [competitor, setCompetitor] = useState({
    name: '',
    phone: '',
    nickname: '',
    club: '',
    selected_date: '',
    uniform_size: 'L'
  });

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

  useEffect(() => {
    const fetchClubs = async () => {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/clubs`);
      setClubSuggestions(res.data);
    };
    fetchClubs();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const query = competitor.name || competitor.phone || playerSearchText;
      if (query.length >= 2) {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/search?query=${query}`);
        setPlayerSuggestions(res.data.slice(0, 5));
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [competitor.name, competitor.phone, playerSearchText]);

  const handleSelectSuggestion = (player) => {
    setCompetitor({
      name: player.name,
      phone: player.phone,
      nickname: player.nickname || '',
      club: player.club || '',
      selected_date: '',
      uniform_size: 'L'
    });
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
        registered_phone: user?.phone_number,
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
        <h2>Đăng ký thi đấu cá nhân</h2>
        <form onSubmit={handleSubmit}>
          <input placeholder="Tên VĐV" value={competitor.name}
            onChange={(e) => setCompetitor({ ...competitor, name: e.target.value })} />
          <input placeholder="SĐT VĐV" value={competitor.phone}
            onChange={(e) => setCompetitor({ ...competitor, phone: e.target.value })} />
          <input placeholder="Nickname" value={competitor.nickname}
            onChange={(e) => setCompetitor({ ...competitor, nickname: e.target.value })} />
          <input placeholder="Đơn vị" value={competitor.club}
            onChange={(e) => setCompetitor({ ...competitor, club: e.target.value })} />

          {availableDates.length > 0 && (
            <select value={competitor.selected_date}
              onChange={(e) => setCompetitor({ ...competitor, selected_date: e.target.value })}>
              <option value="">-- Không chọn ngày --</option>
              {availableDates.map((d) => (
                <option key={d.value} value={d.value}>{d.display} (còn lại: {d.remaining})</option>
              ))}
            </select>
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
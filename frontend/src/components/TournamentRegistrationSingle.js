import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../tournamentRegistration.scss';
import MainPageHeader from '../components/MainPageHeader';
import MainPageMenuBar from '../components/MainPageMenuBar';
import AccountCreationModal from '../components/AccountCreationModal';
import ReactModal from 'react-modal';

const TournamentRegistrationSingle = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [competitor, setCompetitor] = useState({
    name: '', phone: '', club: '', selected_date: '', uniform_size: 'L'
  });
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
  const [playerRanking, setPlayerRanking] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState({
    phone_number: '',
    name: '',
    password: '',
    email: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [accountError, setAccountError] = useState('');

  // useEffect(() => {
  //   if (!user) {
  //     alert('Bạn cần đăng nhập để tiếp tục.');
  //     navigate('/login');
  //   }
  // }, [user, navigate]);

  // Thêm ở trên cùng trong component (sau các useState/useEffect)
  const sanitizePhone = (v) => (v || '').replace(/\D/g, '').slice(0, 10);
  const handlePhoneChange = (e) => {
    const clean = sanitizePhone(e.target.value);
    setCompetitor(prev => ({ ...prev, phone: clean }));
  };

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
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/${tournamentId}`);
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
    const prefillFromUser = async () => {
      const userPhone = sanitizePhone(user?.phone_number);
      if (!userPhone) return;

      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/by-phone?phone=${userPhone}`);
        const p = res.data;
        setCompetitor(prev => ({
          ...prev,
          name: (p.name || '').toUpperCase(),
          phone: p.phone || '',
          club: p.competition_unit || ''
        }));
        setPlayerSearchText(p.id?.toString() || '');

        try {
          const rres = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/${p.id}/ranking?tournament_id=${tournamentId}`);
          setPlayerRanking(rres.data?.ranking ?? 'Chưa có');
        } catch (e) {
          // không cần làm gì nếu lỗi
        }
      } catch (err) {
        setCompetitor(prev => ({
          ...prev,
          phone: userPhone,
          name: (user?.name || '').toUpperCase(),
        }));
      }
    };

    if (user && tournamentId) {
      prefillFromUser();
    }
  }, [user, tournamentId]);

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

  const handleSelectSuggestion = async (player) => {
    setCompetitor({
      name: player.name,
      phone: player.phone,
      club: player.club || '',
      selected_date: '',
      uniform_size: 'L'
    });
    setPlayerSearchText(player.id.toString());
    setPlayerSuggestions([]);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/players/${player.id}/ranking?tournament_id=${tournamentId}`
      );
      setPlayerRanking(res.data.ranking ?? 'Chưa có');
    } catch (err) {
      console.warn('Không lấy được ranking:', err);
      setPlayerRanking('Chưa xác định');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    //if (!competitor.name || !competitor.phone || !registeredPhone) {
    if (!competitor.name || !competitor.phone) {
      setMessage('❌ Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    if (competitor.phone.length !== 10) {
      setMessage('❌ Số điện thoại phải gồm đúng 10 chữ số.');
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
      // const resolveRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/by-phone?phone=${competitor.phone}`);
      // if (!resolveRes.data || resolveRes.data.name !== competitor.name) {
      //   setMessage('❌ Bạn chưa đăng ký thông tin với liên đoàn hoặc thông tin không khớp.');
      //   return;
      // }      
      // const player_id = resolveRes.data.id;
      // setResolvedPlayerId(player_id);
      let player_id = '';
      try {
        const resolveRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/by-phone?phone=${competitor.phone}`);

        // Nếu tìm thấy player nhưng tên không khớp
        if (!resolveRes.data || resolveRes.data.name !== competitor.name) {
          throw new Error('Tên không khớp');
        }

        player_id = resolveRes.data.id;
        setResolvedPlayerId(player_id);
      } catch (err) {
        // 🎯 Nếu không tìm thấy player → Kiểm tra xem có đang login hay không
        if (!user) {
          // ✅ (1) chưa đăng nhập, (2) và số điện thoại không tồn tại → hiện popup tạo tài khoản
          setAccountForm({
            phone_number: competitor.phone,
            name: '',
            password: '',
            email: '',
          });
          setShowAccountModal(true);
          return;
        } else {
          // 🎯 Có đăng nhập nhưng số điện thoại không tồn tại
          setMessage('❌ Bạn chưa đăng ký thông tin với liên đoàn hoặc thông tin không khớp.');
          return;
        }
      }

      // Kiểm tra đã đăng ký trước đó chưa
      try {
        const checkRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/check-duplicate`, {
          params: {
            tournament_id: Number(tournamentId),
            phone: competitor.phone
          }
        });

        if (checkRes.data.exists) {
          setMessage('❌ Bạn đã đăng ký thi đấu cho giải này. Hãy đợi admin phê duyệt.');
          return;
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra trùng đăng ký:', err);
        setMessage('❌ Không thể kiểm tra thông tin đăng ký trước đó.');
        return;
      }

      const formRes = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form`, {
        tournament_id: tournament.id,
        registered_phone: competitor.phone,
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

      const compRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/${registration_form_id}/competitors`);
      const totalFee = compRes.data.reduce((sum, c) => sum + (parseFloat(c.attendance_fee) || 0), 0);
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
    <>
    <div style={{ position: 'relative', zIndex: 1000 }}>
        <MainPageHeader />
        <MainPageMenuBar />
    </div>
    <div className="tournament-registration" style={{
      backgroundImage: backgroundImage ? `url(${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/${backgroundImage})` : 'none',
      backgroundSize: 'cover',
      minHeight: '100vh',
      padding: 40
    }}>
      {tournament && (
        <>
          {/* Banner 1 - Group name */}
          <div style={{ width: '100%', backgroundColor: '#005f73', color: 'white', padding: '12px 0', textAlign: 'center', fontWeight: 'bold', fontSize: '20px' }}>
            <div>{tournament.group_name}</div>
            <div>{new Date(tournament.start_date).toLocaleDateString('vi-VN')} - {new Date(tournament.end_date).toLocaleDateString('vi-VN')}</div>
          </div>

          {/* Khoảng trắng */}
          <div style={{ height: '10px', backgroundColor: 'white' }} />

          {/* Banner 2 - Tournament name */}
          <div style={{ width: '100%', backgroundColor: '#d8f3dc', color: '#014421', padding: '12px 0', textAlign: 'center', fontWeight: 'bold', fontSize: '20px' }}>
            {tournament.name}
          </div>
        </>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
        <tbody>
          <tr style={{ display: 'none' }}>
            <td className="table-cell"><strong>ID VĐV:</strong></td>
            <td className="table-cell">
              <input
                type="text"
                value={playerSearchText}
                onChange={e => setPlayerSearchText(e.target.value.toUpperCase())}
                placeholder="Nhập ID (VD: H01234)"
                className="table-input"
              />
              {playerSearchText && playerSuggestions.length > 0 && !competitor.name && !competitor.phone && (
                <ul className="autocomplete-list">
                  {playerSuggestions.map(p => (
                    <li key={p.id} onClick={() => handleSelectSuggestion(p)}>#{p.id} - {p.name} ({p.phone})</li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
          <tr>
            <td className="table-cell"><strong>TÊN VĐV:</strong></td>
            <td className="table-cell">
              <input
                type="text"
                value={competitor.name}
                onChange={e => setCompetitor({ ...competitor, name: e.target.value.toUpperCase() })}
                placeholder="Nhập tên VĐV"
                className="table-input"
              />
              {!playerSearchText && !competitor.phone && competitor.name && playerSuggestions.length > 0 && (
                <ul className="autocomplete-list">
                  {playerSuggestions.map(p => (
                    <li key={p.id} onClick={() => handleSelectSuggestion(p)}>#{p.id} - {p.name} ({p.phone})</li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
          <tr>
            <td className="table-cell"><strong>ĐIỆN THOẠI LIÊN HỆ:</strong></td>
            <td className="table-cell">
              {/* <input
                type="text"
                value={competitor.phone}
                onChange={e => setCompetitor({ ...competitor, phone: e.target.value })}
                placeholder="Nhập số điện thoại"
                className="table-input"
              /> */}
              <input
                type="tel"
                inputMode="numeric"
                pattern="\d{10}"
                maxLength={10}
                value={competitor.phone}
                onChange={handlePhoneChange}
                onPaste={(e) => {
                  e.preventDefault();
                  const text = (e.clipboardData || window.clipboardData).getData('text');
                  setCompetitor(prev => ({ ...prev, phone: sanitizePhone(text) }));
                }}
                placeholder="Nhập số điện thoại (10 số)"
                className="table-input"
              />
              {!playerSearchText && !competitor.name && competitor.phone && playerSuggestions.length > 0 && (
                <ul className="autocomplete-list">
                  {playerSuggestions.map(p => (
                    <li key={p.id} onClick={() => handleSelectSuggestion(p)}>#{p.id} - {p.name} ({p.phone})</li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
          {playerRanking !== null && (
            <tr>
              <td className="table-cell"><strong>RANKING:</strong></td>
              <td className="table-cell">
                <span style={{ fontWeight: 'bold', color: '#0066cc' }}>{playerRanking}</span>
              </td>
            </tr>
          )}
          <tr>
            <td className="table-cell"><strong>ĐƠN VỊ (TỈNH/THÀNH):</strong></td>
            <td className="table-cell">
              <input
                type="text"
                value={competitor.club}
                onChange={e => setCompetitor({ ...competitor, club: e.target.value })}
                placeholder="Nhập tên đơn vị, tỉnh thành"
                className="table-input"
              />
              {getFilteredClubs().length > 0 && (
                <ul className="autocomplete-list">
                  {getFilteredClubs().map((club, i) => (
                    <li key={i}
                        onMouseDown={() => {
                          setCompetitor({ ...competitor, club });
                          setClubSuggestions([]);
                        }}>
                      {club}
                    </li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ backgroundColor: 'white', maxWidth: 800, margin: 'auto', padding: 20, borderRadius: 12 }}>
        {/* ✅ Phần chọn ngày thi đấu */}
        <form onSubmit={handleSubmit}>
          {availableDates.length > 0 && (
            <div style={{ margin: '20px 0' }}>
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

          {/* ✅ Nút Gửi đăng ký */}
          <button type="submit" style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}>
            📤 Gửi Đăng Ký
          </button>

          {/* ✅ Nút điều hướng */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button
              type="button"
              onClick={() => navigate('/tournament_events')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#888',
                color: '#fff',
                border: 'none',
                fontWeight: 'bold'
              }}
            >
              Quay Lại Danh Sách Giải Đấu
            </button>

            <button
              type="button"
              onClick={() => navigate(`/tournament_events/${tournamentId}/competitors`)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#0066cc',
                color: '#fff',
                border: 'none',
                fontWeight: 'bold'
              }}
            >
              Danh sách vận động viên đã đăng ký
            </button>
          </div>

          {/* ✅ Thông báo lỗi/thành công */}
          {message && (
            <p style={{
              marginTop: '10px',
              color: message.includes('❌') ? 'red' : 'green',
              fontWeight: 'bold'
            }}>
              {message}
            </p>
          )}
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
            navigate(`/tournament_events/${tournamentId}/competitors`);
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

      <AccountCreationModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        phoneNumber={competitor.phone}
        onSuccess={(newUser) => {
          setCompetitor(prev => ({ ...prev, name: newUser.name, phone: newUser.phone_number }));
          setRegisteredPhone(newUser.phone_number);
          setResolvedPlayerId(''); // để cho phép submit lại
          handleSubmit(new Event('submit'));
        }}
      />

    </div>
  </>
  );
};

export default TournamentRegistrationSingle;
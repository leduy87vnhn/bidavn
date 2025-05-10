import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import '../tournamentRegistration.scss';

const TournamentRegistration = () => {
  const { id: tournamentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const registrationId = queryParams.get('id');

  const [tournament, setTournament] = useState(null);
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    phone: '',
    nickname: '',
    club: '',
    selected_date: ''
  });
  const [playerSuggestions, setPlayerSuggestions] = useState([]);
  const [playerSearchText, setPlayerSearchText] = useState('');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [status, setStatus] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user_info'));
  const [availableDates, setAvailableDates] = useState([]);

  const getStatusStyle = () => {
    switch (status) {
      case 1: return { backgroundColor: '#d0ecff', color: '#0056b3', padding: '6px 12px', borderRadius: '6px' };
      case 2: return { backgroundColor: '#ccc', color: '#000', padding: '6px 12px', borderRadius: '6px' };
      default: return { backgroundColor: '#ffe0b3', color: '#cc7000', padding: '6px 12px', borderRadius: '6px' };
    }
  };

  const loadTournament = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${tournamentId}`);
      setTournament(res.data);
      setBackgroundImage(res.data.background_image);

      const start = res.data.registerable_date_start ? new Date(res.data.registerable_date_start) : null;
      const end = res.data.registerable_date_end ? new Date(res.data.registerable_date_end) : null;

      if (start && end && start <= end) {
        const dates = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().slice(0, 10));
        }
        setAvailableDates(dates);
      } else {
        setAvailableDates([]); // Không có ngày nào hợp lệ
        setNewCompetitor(prev => ({ ...prev, selected_date: '' }));
      }
    } catch {
      setError('Không tìm thấy giải đấu.');
    }
  };

  const loadRegistrationInfo = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/${registrationId}`);
      setRegisteredPhone(res.data.registered_phone);
      setStatus(res.data.status);
    } catch (err) {
      console.error('Lỗi khi tải bản đăng ký:', err);
    }
  };

  const loadCompetitorList = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/${registrationId}/competitors`);
      const formatted = res.data.map(c => ({
        name: c.name,
        phone: c.phone_number,
        nickname: c.nick_name,
        club: c.club,
        selected_date: c.selected_date?.slice(0, 10) || ''
      }));
      setCompetitors(formatted);
    } catch (err) {
      console.error('Lỗi khi tải danh sách VĐV:', err);
    }
  };

  useEffect(() => {
    loadTournament();
    if (registrationId) {
      loadRegistrationInfo();
      loadCompetitorList();
    }
  }, [tournamentId, registrationId]);

  useEffect(() => {
    if (!registrationId && user?.phone_number) {
      setRegisteredPhone(user.phone_number);
    }
  }, [registrationId, user]);

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
    }, 300); // debounce 300ms
  
    return () => clearTimeout(delayDebounce);
  }, [playerSearchText]);

  // const handlePlayerSearch = async (e) => {
  //   const text = e.target.value;
  //   setPlayerSearchText(text);
  //   if (text.length < 2) {
  //     setPlayerSuggestions([]);
  //     return;
  //   }
  //   try {
  //     const res = await axios.get(`/api/players/search?query=${text}`);
  //     setPlayerSuggestions(res.data);
  //   } catch (err) {
  //     console.error('Lỗi tìm kiếm VĐV:', err);
  //   }
  // };

  const handleSelectSuggestion = (player) => {
    setNewCompetitor({
      name: player.name,
      phone: player.phone,
      nickname: player.nickname || '',
      club: player.club || '',
      selected_date: ''
    });
    setPlayerSearchText(player.id);
    setPlayerSuggestions([]);
  };

  const handleAddCompetitor = async (e) => {
    e.preventDefault();

    // Kiểm tra đủ thông tin cơ bản
    const { name, phone, nickname, club, selected_date } = newCompetitor;
    if (!registeredPhone || !name || !phone) {
      setMessage('Vui lòng nhập đủ thông tin.');
      return;
    }

    // Kiểm tra trùng trong danh sách local
    const duplicate = competitors.find(c => c.name === name && c.phone === phone);
    if (duplicate) {
      setMessage('Vận động viên này đã tồn tại trong danh sách.');
      return;
    }

    try {
      // Gọi API resolve-player để lấy player_id phù hợp
      const resolveRes = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/resolve-player`, {
        name,
        phone
      });

      if (resolveRes.data.status !== 'ok') {
        setMessage('❌ Lỗi khi xác định VĐV.');
        return;
      }

      const player_id = resolveRes.data.player_id;

      // Gửi competitor lên backend
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/competitors`, {
        registration_form_id: registrationId,
        player_id,
        nick_name: nickname,
        club,
        selected_date: selected_date || null
      });

      // Thêm vào danh sách local (hiển thị trên bảng)
      setCompetitors([...competitors, {
        id: player_id,
        name,
        phone,
        nickname,
        club,
        selected_date
      }]);

      // Reset form
      setNewCompetitor({ name: '', phone: '', nickname: '', club: '', selected_date: '' });
      setPlayerSearchText('');
      setMessage('✅ Đã thêm vận động viên.');

    } catch (err) {
      console.error('Lỗi khi thêm VĐV:', err);
      const errorMsg = err.response?.data?.message || '❌ Lỗi khi thêm vận động viên.';
      setMessage(errorMsg);
    }
  };

  const handleRemove = (index) => {
    const updated = [...competitors];
    updated.splice(index, 1);
    setCompetitors(updated);
  };

  const handleRegisterSubmit = async () => {
    console.log('📤 Đăng ký với:', { tournamentId: tournament.id, registeredPhone, userId: user?.id });
    console.log('👤 Danh sách VĐV:', competitors);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form`, {
        tournament_id: tournament.id,
        registered_phone: registeredPhone,
        user_id: user?.id,
      });
      const registration_form_id = res.data.id;
      for (const competitor of competitors) {
        if (!competitor.selected_date || !competitor.name || !competitor.phone) {
          console.error('🚫 Dữ liệu thiếu:', competitor);
        }
        await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/competitors`, {
          registration_form_id,
          name: competitor.name,
          phone: competitor.phone,
          nick_name: competitor.nickname,
          club: competitor.club,
          selected_date: competitor.selected_date,
        });
      }
      setMessage('✅ Đăng ký thành công!');
      setCompetitors([]);
    } catch (err) {
      console.error('Đăng ký thất bại:', err);
      setMessage('❌ Lỗi khi gửi đăng ký.');
    }
  };

  const handleApproval = async (newStatus) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/${registrationId}/approve`, { status: newStatus });
      setStatus(newStatus);
      alert('✅ Đã cập nhật trạng thái.');
    } catch (err) {
      alert('❌ Lỗi khi cập nhật trạng thái.');
    }
  };

  return (
    <div
      className="tournament-registration"
      style={{
        backgroundImage: backgroundImage ? `url(${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '40px 0',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div style={{ backgroundColor: 'white', maxWidth: 900, margin: '0 auto', padding: 20, borderRadius: 12 }}>
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Đăng ký thi đấu
          <span style={getStatusStyle()}>
            {status === 1 ? 'Đã Phê Duyệt' : status === 2 ? 'Đã Hủy' : 'Chưa Phê Duyệt'}
          </span>
        </h2>

        {user?.user_type === 2 && registrationId && (
          <div style={{ marginBottom: 10 }}>
            <button onClick={() => handleApproval(1)} style={{ marginRight: 10 }}>✔️ Phê Duyệt</button>
            <button onClick={() => handleApproval(2)}>❌ Từ Chối</button>
          </div>
        )}

        {tournament && (
          <div className="tournament-info">
            <p><strong>Tên giải:</strong> {tournament.name}</p>
            <p>
              <strong>Thời gian:</strong>{' '}
              {tournament.start_date?.slice(0, 10)} → {tournament.end_date?.slice(0, 10)}
            </p>
            <p><strong>Địa điểm:</strong> {tournament.location}</p>
            <p><strong>Nội dung:</strong> {tournament.content}</p>
          </div>
        )}

        <form onSubmit={handleAddCompetitor}>
          <input type="text" placeholder="Số điện thoại người đăng ký (*)" value={registeredPhone} onChange={(e) => setRegisteredPhone(e.target.value)} />
          <input
            type="text"
            placeholder="ID VĐV (Gõ vài ký tự đầu để được gợi ý. ID có dạng H01234)"
            value={playerSearchText}
            onChange={(e) => setPlayerSearchText(e.target.value)}
          />
          {playerSuggestions.length > 0 && (
            <ul className="autocomplete-list">
              {playerSuggestions.map((p) => (
                <li key={p.id} onClick={() => handleSelectSuggestion(p)}>
                  #{p.id} - {p.name} ({p.phone})
                </li>
              ))}
            </ul>
          )}
          <input type="text" placeholder="Tên VĐV có dấu(*)" value={newCompetitor.name} onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })} />
          <input type="text" placeholder="SĐT VĐV (*)" value={newCompetitor.phone} onChange={(e) => setNewCompetitor({ ...newCompetitor, phone: e.target.value })} />
          <input type="text" placeholder="Nickname" value={newCompetitor.nickname} onChange={(e) => setNewCompetitor({ ...newCompetitor, nickname: e.target.value })} />
          <input type="text" placeholder="Câu lạc bộ (*)" value={newCompetitor.club} onChange={(e) => setNewCompetitor({ ...newCompetitor, club: e.target.value })} />
          {availableDates.length > 0 ? (
            <div style={{ marginBottom: '10px' }}>
              <label><strong>Chọn ngày thi đấu (1 ngày):</strong></label>
              <div className="date-radio-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                {availableDates.map(date => (
                  <label key={date} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      name="selected_date"
                      value={date}
                      checked={newCompetitor.selected_date === date}
                      onChange={(e) => setNewCompetitor({ ...newCompetitor, selected_date: e.target.value })}
                    />
                    {date}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '10px' }}>
              <strong>Không có ngày thi đấu cụ thể — sẽ để trống ngày thi đấu.</strong>
            </div>
          )}
          <button type="submit">➕ Thêm vận động viên</button>
          {message && <div className={message.includes('Lỗi') ? 'error-message' : 'success-message'}>{message}</div>}
        </form>

        {competitors.length > 0 && (
          <>
            <table className="competitor-list">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên</th>
                  <th>SĐT</th>
                  <th>Nickname</th>
                  <th>CLB</th>
                  <th>Ngày thi đấu</th>
                  <th>Xoá</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{c.nickname}</td>
                    <td>{c.club}</td>
                    <td>{c.selected_date}</td>
                    <td><button onClick={() => handleRemove(i)} style={{ color: 'red' }}>Xoá</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={handleRegisterSubmit} style={{ marginTop: '20px' }}>
              📤 Gửi đăng ký
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TournamentRegistration;
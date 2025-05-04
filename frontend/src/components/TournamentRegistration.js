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
    } catch {
      setError('Không tìm thấy giải đấu.');
    }
  };

  const loadRegistrationInfo = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration-form/${registrationId}`);
      setRegisteredPhone(res.data.registered_phone);
      setStatus(res.data.status);
    } catch (err) {
      console.error('Lỗi khi tải bản đăng ký:', err);
    }
  };

  const loadCompetitorList = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration-form/${registrationId}/competitors`);
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

  const handlePlayerSearch = async (e) => {
    const text = e.target.value;
    setPlayerSearchText(text);
    if (text.length < 2) {
      setPlayerSuggestions([]);
      return;
    }
    try {
      const res = await axios.get(`/api/players/search?query=${text}`);
      setPlayerSuggestions(res.data);
    } catch (err) {
      console.error('Lỗi tìm kiếm VĐV:', err);
    }
  };

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

  const handleAddCompetitor = (e) => {
    e.preventDefault();
    if (!registeredPhone || !newCompetitor.name || !newCompetitor.phone || !newCompetitor.selected_date) {
      setMessage('Vui lòng nhập đủ thông tin.');
      return;
    }
    const duplicate = competitors.find(c => c.name === newCompetitor.name && c.phone === newCompetitor.phone);
    if (duplicate) {
      setMessage('Vận động viên này đã tồn tại.');
      return;
    }
    setCompetitors([...competitors, newCompetitor]);
    setNewCompetitor({ name: '', phone: '', nickname: '', club: '', selected_date: '' });
    setMessage('');
  };

  const handleRemove = (index) => {
    const updated = [...competitors];
    updated.splice(index, 1);
    setCompetitors(updated);
  };

  const handleRegisterSubmit = async () => {
    try {
      const res = await axios.post(`/api/registration_form`, {
        tournament_id: tournament.id,
        registered_phone: registeredPhone,
        user_id: user?.id,
      });
      const registration_form_id = res.data.id;
      for (const competitor of competitors) {
        await axios.post(`/api/registration_form/competitors`, {
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
      await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/registration-form/${registrationId}/approve`, { status: newStatus });
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
            <p><strong>Thời gian:</strong> {tournament.start_date} → {tournament.end_date}</p>
            <p><strong>Địa điểm:</strong> {tournament.location}</p>
            <p><strong>Nội dung:</strong> {tournament.content}</p>
          </div>
        )}

        <form onSubmit={handleAddCompetitor}>
          <input type="text" placeholder="Số điện thoại người đăng ký" value={registeredPhone} onChange={(e) => setRegisteredPhone(e.target.value)} />
          <input type="text" placeholder="ID VĐV (gõ vài ký tự)" value={playerSearchText} onChange={handlePlayerSearch} />
          {playerSuggestions.length > 0 && (
            <ul className="autocomplete-list">
              {playerSuggestions.map((p) => (
                <li key={p.id} onClick={() => handleSelectSuggestion(p)}>
                  #{p.id} - {p.name} ({p.phone})
                </li>
              ))}
            </ul>
          )}
          <input type="text" placeholder="Tên VĐV" value={newCompetitor.name} onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })} />
          <input type="text" placeholder="SĐT VĐV" value={newCompetitor.phone} onChange={(e) => setNewCompetitor({ ...newCompetitor, phone: e.target.value })} />
          <input type="text" placeholder="Nickname" value={newCompetitor.nickname} onChange={(e) => setNewCompetitor({ ...newCompetitor, nickname: e.target.value })} />
          <input type="text" placeholder="Câu lạc bộ" value={newCompetitor.club} onChange={(e) => setNewCompetitor({ ...newCompetitor, club: e.target.value })} />
          <input type="date" value={newCompetitor.selected_date} onChange={(e) => setNewCompetitor({ ...newCompetitor, selected_date: e.target.value })} />
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
            <button onClick={handleRegisterSubmit} style={{ marginTop: '20px' }}>📤 Gửi đăng ký</button>
          </>
        )}
      </div>
    </div>
  );
};

export default TournamentRegistration;
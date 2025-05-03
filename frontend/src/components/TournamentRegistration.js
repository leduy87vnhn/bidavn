import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../tournamentRegistration.scss';

const TournamentRegistration = () => {
  //const { id: tournamentId } = useParams();
  const { id } = useParams();

  const [tournament, setTournament] = useState(null);
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [message, setMessage] = useState('');
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    phone: '',
    nickname: '',
    club: '',
    selected_date: '',
  });
  const [playerSuggestions, setPlayerSuggestions] = useState([]);
  const [playerSearchText, setPlayerSearchText] = useState('');
  const [error, setError] = useState('');

  // Load thông tin giải đấu
//   useEffect(() => {
//     const fetchTournament = async () => {
//       try {
//         const res = await axios.get(`/api/tournaments/${tournamentId}`);
//         setTournament(res.data);
//       } catch (err) {
//         console.error(err);
//         setMessage('Lỗi khi tải thông tin giải đấu.');
//       }
//     };

//     fetchTournament();
//   }, [tournamentId]);

  const loadTournament = async () => {
    try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${id}`);
        setTournament(res.data);
        setLoading(false);
    } catch (err) {
        setError('Không tìm thấy giải đấu.');
        setLoading(false);
    }
  };
    useEffect(() => {
        loadTournament();
    }, [id]);

  // Thêm VĐV vào danh sách
  const handleAddCompetitor = (e) => {
    e.preventDefault();

    if (!registeredPhone || !newCompetitor.name || !newCompetitor.phone || !newCompetitor.selected_date) {
      setMessage('Vui lòng nhập đủ thông tin.');
      return;
    }

    const isDuplicate = competitors.some(
      (c) => c.name === newCompetitor.name && c.phone === newCompetitor.phone
    );

    if (isDuplicate) {
      setMessage('Vận động viên này đã tồn tại.');
      return;
    }

    setCompetitors([...competitors, newCompetitor]);
    setNewCompetitor({ name: '', phone: '', nickname: '', club: '', selected_date: '' });
    setMessage('');
  };

  // Xoá VĐV khỏi danh sách
  const handleRemove = (index) => {
    const updatedList = [...competitors];
    updatedList.splice(index, 1);
    setCompetitors(updatedList);
  };

  // Gửi đăng ký
  const handleRegisterSubmit = async () => {
    try {
      const res = await axios.post(`/api/registration_form`, {
        tournament_id: tournament.id,
        phone: registeredPhone,
        competitors,
      });
      setMessage(res.data.message || 'Đăng ký thành công');
      setCompetitors([]);
    } catch (err) {
      console.error(err);
      setMessage('Lỗi khi gửi đăng ký.');
    }
  };

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
      console.error('Lỗi khi tìm kiếm VĐV:', err);
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

  return (
    <div className="tournament-registration">
      <h2>Đăng ký thi đấu</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {tournament ? (
        <div className="tournament-info">
          <p><strong>Tên giải:</strong> {tournament.name}</p>
          <p><strong>Thời gian:</strong> {tournament.start_date} → {tournament.end_date}</p>
          <p><strong>Địa điểm:</strong> {tournament.location}</p>
          <p><strong>Nội dung:</strong> {tournament.content}</p>
        </div>
      ) : (
        <p>Đang tải thông tin giải đấu...</p>
      )}

      <form onSubmit={handleAddCompetitor}>
        <input
          type="text"
          placeholder="Số điện thoại người đăng ký"
          value={registeredPhone}
          onChange={(e) => setRegisteredPhone(e.target.value)}
        />
        <input
        type="text"
        placeholder="ID VĐV (gõ vài ký tự)"
        value={playerSearchText}
        onChange={handlePlayerSearch}
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
        <input
          type="text"
          placeholder="Tên vận động viên"
          value={newCompetitor.name}
          onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
        />

        <input
          type="text"
          placeholder="SĐT VĐV"
          value={newCompetitor.phone}
          onChange={(e) => setNewCompetitor({ ...newCompetitor, phone: e.target.value })}
        />

        <input
          type="text"
          placeholder="Nickname"
          value={newCompetitor.nickname}
          onChange={(e) => setNewCompetitor({ ...newCompetitor, nickname: e.target.value })}
        />

        <input
          type="text"
          placeholder="Câu lạc bộ"
          value={newCompetitor.club}
          onChange={(e) => setNewCompetitor({ ...newCompetitor, club: e.target.value })}
        />

        <input
          type="date"
          value={newCompetitor.selected_date}
          onChange={(e) => setNewCompetitor({ ...newCompetitor, selected_date: e.target.value })}
        />

        <button type="submit">➕ Thêm vận động viên</button>
        {message && <div className={message.includes('Lỗi') || message.includes('tồn tại') ? 'error-message' : 'success-message'}>{message}</div>}
      </form>

      <div className="competitor-list">
        {competitors.length > 0 && (
          <table>
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
              {competitors.map((c, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.nickname}</td>
                  <td>{c.club}</td>
                  <td>{c.selected_date}</td>
                  <td>
                    <button onClick={() => handleRemove(index)} style={{ color: 'red' }}>
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {competitors.length > 0 && (
        <button onClick={handleRegisterSubmit} style={{ marginTop: '20px' }}>📤 Gửi đăng ký</button>
      )}
    </div>
  );
};

export default TournamentRegistration;
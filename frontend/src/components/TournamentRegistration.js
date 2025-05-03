import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../tournamentRegistration.scss';

const TournamentRegistration = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    phone: '',
    nickname: '',
    club: '',
    selected_date: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchTournament = async () => {
      try {
        const res = await axios.get(`/api/tournaments/${tournamentId}`);
        setTournament(res.data);
      } catch (err) {
        setMessage('Lỗi khi tải thông tin giải đấu');
      }
    };

    fetchTournament();
  }, [tournamentId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!registeredPhone || !newCompetitor.name || !newCompetitor.phone || !newCompetitor.selected_date) {
      setMessage('Vui lòng nhập đủ thông tin trước khi thêm.');
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

  const handleRegister = async () => {
    try {
      const res = await axios.post(`/api/registration_form`, {
        tournament_id: tournamentId,
        phone: registeredPhone,
        competitors,
      });
      setMessage(res.data.message || 'Đăng ký thành công');
      setCompetitors([]);
    } catch (error) {
      setMessage('Lỗi khi gửi đăng ký.');
    }
  };

  return (
    <div className="tournament-registration">
      <h2>Đăng ký giải đấu</h2>

      {tournament && (
        <div>
          <p><strong>Tên giải:</strong> {tournament.name}</p>
          <p><strong>Thời gian:</strong> {tournament.start_date} → {tournament.end_date}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Số điện thoại người đăng ký"
          value={registeredPhone}
          onChange={(e) => setRegisteredPhone(e.target.value)}
        />

        <input
          type="text"
          placeholder="Tên vận động viên"
          value={newCompetitor.name}
          onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
        />

        <input
          type="text"
          placeholder="Số điện thoại VĐV"
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
          placeholder="Ngày chọn thi đấu"
          value={newCompetitor.selected_date}
          onChange={(e) => setNewCompetitor({ ...newCompetitor, selected_date: e.target.value })}
        />

        <button type="submit">Thêm vận động viên</button>
        {message && <div className={message.includes('Lỗi') || message.includes('tồn tại') ? 'error-message' : 'success-message'}>{message}</div>}
      </form>

      <div className="competitor-list">
        {competitors.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Tên</th>
                <th>SĐT</th>
                <th>Nickname</th>
                <th>CLB</th>
                <th>Ngày thi đấu</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c, index) => (
                <tr key={index}>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.nickname}</td>
                  <td>{c.club}</td>
                  <td>{c.selected_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {competitors.length > 0 && (
        <button onClick={handleRegister}>Gửi đăng ký</button>
      )}
    </div>
  );
};

export default TournamentRegistration;
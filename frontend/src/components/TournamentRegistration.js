import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './tournamentRegistration.scss';

const TournamentRegistration = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem('user'));
    setUser(loggedUser);
    fetchTournament();
  }, []);

  const fetchTournament = async () => {
    try {
      const res = await axios.get(`/api/tournaments/${tournamentId}`);
      setTournament(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCompetitor = () => {
    setCompetitors([...competitors, { player_id: '', name: '', phone: '', nick_name: '', club: '', selected_date: '' }]);
  };

  const handlePlayerIdChange = async (index, value) => {
    const updated = [...competitors];
    updated[index].player_id = value;
    try {
      const res = await axios.get(`/api/players/${value}`);
      updated[index].name = res.data.name;
      updated[index].phone = res.data.phone_number;
    } catch (err) {
      updated[index].name = 'Không tìm thấy';
      updated[index].phone = '';
    }
    setCompetitors(updated);
  };

  const handleCompetitorChange = (index, field, value) => {
    const updated = [...competitors];
    updated[index][field] = value;
    setCompetitors(updated);
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post('/api/registration-form', {
        user_id: user.id,
        tournament_id: tournamentId,
        registered_phone: registeredPhone
      });
      const registrationId = res.data.id;

      for (const comp of competitors) {
        await axios.post('/api/competitors', {
          registration_form_id: registrationId,
          player_id: comp.player_id,
          nick_name: comp.nick_name,
          club: comp.club,
          selected_date: comp.selected_date
        });
      }

      setMessage('Đăng ký thành công!');
    } catch (err) {
      setMessage('Lỗi khi đăng ký.');
    }
  };

  const handleApproval = async (status) => {
    try {
      await axios.patch(`/api/registration-form/${tournamentId}/approve`, { status });
      setMessage(status === 1 ? 'Đã phê duyệt' : 'Đã từ chối');
    } catch (err) {
      setMessage('Lỗi khi cập nhật trạng thái');
    }
  };

  return (
    <div
      className="registration-container"
      style={{ backgroundImage: `url(${tournament?.background_url})` }}
    >
      <div className="registration-box">
        <h2>Đăng ký Vận Động Viên</h2>
        <label>Số điện thoại đăng ký:</label>
        <input
          type="text"
          value={registeredPhone}
          onChange={(e) => setRegisteredPhone(e.target.value)}
        />

        <h3>Danh sách VĐV</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Họ Tên</th>
              <th>Nick Name</th>
              <th>SĐT</th>
              <th>CLB</th>
              <th>Ngày thi đấu</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((comp, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>
                  <input
                    type="text"
                    value={comp.player_id}
                    onChange={(e) => handlePlayerIdChange(idx, e.target.value)}
                  />
                </td>
                <td>{comp.name}</td>
                <td>
                  <input
                    type="text"
                    value={comp.nick_name}
                    onChange={(e) => handleCompetitorChange(idx, 'nick_name', e.target.value)}
                  />
                </td>
                <td>{comp.phone}</td>
                <td>
                  <input
                    type="text"
                    value={comp.club}
                    onChange={(e) => handleCompetitorChange(idx, 'club', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={comp.selected_date}
                    onChange={(e) => handleCompetitorChange(idx, 'selected_date', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={handleAddCompetitor}>➕ Thêm VĐV</button>

        <div className="button-group">
          <button onClick={handleSubmit}>Gửi đăng ký</button>
          {user?.user_type === 2 && (
            <>
              <button onClick={() => handleApproval(1)}>✅ Phê duyệt</button>
              <button onClick={() => handleApproval(2)}>❌ Từ chối</button>
            </>
          )}
        </div>
        <p className="message">{message}</p>
      </div>
    </div>
  );
};

export default TournamentRegistration;
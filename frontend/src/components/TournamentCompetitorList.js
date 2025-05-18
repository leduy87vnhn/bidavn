// File: TournamentCompetitorList.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const TournamentCompetitorList = () => {
  const { id: tournamentId } = useParams(); // tournament id
  const user = JSON.parse(localStorage.getItem('user_info'));
  const [data, setData] = useState([]);
  const [tournament, setTournament] = useState(null);
  const isAdmin = user?.user_type === 2;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tourRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${tournamentId}`);
        setTournament(tourRes.data);

        const compRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/by-tournament/${tournamentId}`);
        const allData = compRes.data;
        const filtered = isAdmin ? allData : allData.filter(c => String(c.status) === '1');
        setData(filtered);
      } catch (err) {
        console.error('Lỗi khi tải danh sách:', err);
      }
    };

    fetchData();
  }, [tournamentId]);

  const statusText = (status) => {
    if (String(status) === '0') return 'Chờ duyệt';
    if (String(status) === '1') return 'Đã duyệt';
    if (String(status) === '2') return 'Đã huỷ';
    return 'Chờ duyệt';
  };

  const maskPhone = (phone) => {
    if (!phone || phone.length < 3) return '***';
    return '*******' + phone.slice(-3);
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>📋 Danh sách VĐV đã đăng ký</h2>

      {tournament && (
        <div style={{ backgroundColor: '#e6ffe6', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <p><strong>Giải đấu:</strong> {tournament.name}</p>
          <p><strong>Thời gian:</strong> {tournament.start_date?.slice(0, 10)} → {tournament.end_date?.slice(0, 10)}</p>
        </div>
      )}

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>SĐT</th>
            <th>Đơn vị</th>
            <th>Size trang phục</th>
            <th>Ngày thi đấu</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c, idx) => (
            <tr key={idx}>
              <td>{c.player_id}</td>
              <td>{c.name}</td>
              <td>{isAdmin ? c.phone : maskPhone(c.phone)}</td>
              <td>{c.club}</td>
              <td>{c.uniform_size}</td>
              <td>{c.selected_date?.slice(0, 10)}</td>
              <td>{statusText(c.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TournamentCompetitorList;
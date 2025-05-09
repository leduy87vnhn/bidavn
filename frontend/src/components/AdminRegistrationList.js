import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const AdminRegistrationList = () => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const defaultTournament = queryParams.get('tournament'); // hoặc đặt tên là tournamentFilter

  const [filters, setFilters] = useState({
    tournament: defaultTournament,
    phone: '',
    user_name: '',
    club: ''
  });
  const fetchData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registrations`, {
        params: filters
      });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const tournament = params.get('tournament') || '';
//     setFilters(prev => ({ ...prev, tournament }));
//   }, [location.search]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchData();
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Danh sách đơn đăng ký</h2>
      <div style={{ marginBottom: 20, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input name="tournament" placeholder="Tên giải đấu" onChange={handleChange} value={filters.tournament} />
        <input name="phone" placeholder="SĐT đăng ký" onChange={handleChange} value={filters.phone} />
        <input name="user_name" placeholder="Người đăng ký" onChange={handleChange} value={filters.user_name} />
        <input name="club" placeholder="Tên câu lạc bộ" onChange={handleChange} value={filters.club} />
        <button onClick={handleSearch}>Tìm kiếm</button>
      </div>

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Giải đấu</th>
            <th>SĐT đăng ký</th>
            <th>Người đăng ký</th>
            <th>Trạng thái</th>
            <th>CLB</th>
            <th>VĐV</th>
            <th>Xem</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.registration_id}>
              <td>{row.registration_id}</td>
              <td>{row.tournament_name}</td>
              <td>{row.registered_phone}</td>
              <td>{row.user_name}</td>
              <td>
                {row.status === 0 && 'Chờ duyệt'}
                {row.status === 1 && 'Đã duyệt'}
                {row.status === 2 && 'Đã huỷ'}
              </td>
              <td>{row.club}</td>
              <td>{row.athlete_names}</td>
              <td>
                <button onClick={() => navigate(`/registration/${row.registration_id}/detail`)}>
                  Xem
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminRegistrationList;
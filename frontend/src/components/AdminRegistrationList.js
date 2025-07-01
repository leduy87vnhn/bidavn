// AdminRegistrationList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const AdminRegistrationList = () => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const defaultTournament = queryParams.get('tournament');
  const user = JSON.parse(localStorage.getItem('user_info'));
  const isAdmin = user?.user_type === 2;

  const [filters, setFilters] = useState({
    tournament: defaultTournament,
    phone: '',
    user_name: '',
    club: '',
    athlete_name: '',
    status: isAdmin ? '' : '1' // nếu không phải admin thì mặc định là đã duyệt
  });

  const fetchData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registrations`, {
        params: {
          ...filters,
          status: isAdmin ? filters.status : 1
        }
      });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleApproval = async (id, status) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/${id}/approve`, { status });
      fetchData(); // refresh
    } catch (err) {
      console.error('Error approving registration:', err);
    }
  };

  const maskPhone = (phone) => {
    if (!phone || phone.length < 3) return '***';
    return '*******' + phone.slice(-3);
  };

  const formatDate = (isoStr) => {
    const d = new Date(isoStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  };

  const statusText = (status) => {
    if (String(status) === '0') return 'Chờ duyệt';
    if (String(status) === '1') return 'Đã duyệt';
    if (String(status) === '2') return 'Đã huỷ';
    return 'Không rõ';
  };

  const buttonStyle = {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer'
  };

  const grayButton = {
    ...buttonStyle,
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Danh sách đơn đăng ký</h2>
      <div style={{ marginBottom: 20, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          name="tournament"
          placeholder="Tên giải đấu"
          value={filters.tournament}
          disabled
          style={{
            backgroundColor: '#f0f0f0',
            cursor: 'not-allowed',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            flex: 2 // 👈 Input này sẽ chiếm gấp đôi không gian so với các input khác
          }}
        />
        <input name="phone" placeholder="SĐT đăng ký" onChange={handleChange} value={filters.phone} />
        <input name="user_name" placeholder="Người đăng ký" onChange={handleChange} value={filters.user_name} />
        <input name="club" placeholder="Tên câu lạc bộ" onChange={handleChange} value={filters.club} />
        <input
          name="athlete_name"
          placeholder="Tên vận động viên"
          onChange={handleChange}
          value={filters.athlete_name}
        />
        <select
          name="status"
          onChange={handleChange}
          value={filters.status}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="0">Chờ duyệt</option>
          <option value="1">Đã duyệt</option>
          <option value="2">Đã huỷ</option>
        </select>
        <button onClick={handleSearch}>Tìm kiếm</button>
      </div>

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Mã</th>
            {/*<th>Giải đấu</th>*/}
            <th>Vận Động Viên</th>
            <th>Đơn vị</th>
            <th>Người đăng ký</th>
            <th>SĐT đăng ký</th>
            <th>Ngày đăng ký</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.registration_id}>
              <td>{row.registration_id}</td>
              {/*<td>{row.tournament_name}</td>*/}
              <td>{row.athlete_names}</td>
              <td>{row.club}</td>
              <td>{row.user_name}</td>
              <td>{isAdmin ? row.registered_phone : maskPhone(row.registered_phone)}</td>
              <td>{formatDate(row.created_date)}</td>
              <td>{statusText(row.status)}</td>
              <td>
                <button
                  onClick={() => navigate(`/registration/${row.registration_id}/detail`)}
                  style={buttonStyle}
                >
                  🔍 Xem
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleApproval(row.registration_id, 1)}
                      style={{ ...buttonStyle, marginLeft: 6 }}
                    >
                      ✔️ Duyệt
                    </button>
                    <button
                      onClick={() => handleApproval(row.registration_id, 2)}
                      style={{ ...buttonStyle, backgroundColor: '#dc3545', marginLeft: 6 }}
                    >
                      ❌ Từ chối
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminRegistrationList;
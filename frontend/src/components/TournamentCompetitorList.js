// File: TournamentCompetitorList.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const TournamentCompetitorList = () => {
  const { id: tournamentId } = useParams(); // tournament id
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user_info'));
  const [data, setData] = useState([]);
  const [tournament, setTournament] = useState(null);
  const isAdmin = user?.user_type === 2;
  const [allData, setAllData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tourRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${tournamentId}`);
        setTournament(tourRes.data);

        const compRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/by-tournament/${tournamentId}`);
        const rawData = compRes.data;

        // Lưu toàn bộ danh sách để filter sau
        setAllData(rawData);

        // Lọc nếu không phải admin → chỉ lấy status = 1 (Đã duyệt)
        const filtered = isAdmin ? rawData : rawData.filter(c => String(c.status) === '1');

        // Sắp xếp theo trạng thái: 1 (Đã duyệt) → 0 (Chờ duyệt) → 2 (Đã huỷ)
        filtered.sort((a, b) => {
          const order = { '1': 0, '0': 1, '2': 2 };
          return order[String(a.status)] - order[String(b.status)];
        });
        setData(filtered);
      } catch (err) {
        console.error('Lỗi khi tải danh sách:', err);
      }
    };

    fetchData();
  }, [tournamentId]);

  const exportToExcel = (rows) => {
    const formatted = rows.map(c => ({
      "ID": c.player_id,
      "Tên": c.name,
      "SĐT": isAdmin ? c.phone : maskPhone(c.phone),
      "Đơn vị": c.club,
      "Size trang phục": c.uniform_size,
      "Ngày thi đấu": c.selected_date?.slice(0, 10),
      "Trạng thái": statusText(c.status)
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "VĐV");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, `VDV_dang_ky_${tournament?.code || 'giai'}.xlsx`);
  };

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

  const handleStatusFilter = (value) => {
    let filtered = value === 'all'
      ? (isAdmin ? allData : allData.filter(c => String(c.status) === '1'))
      : allData.filter(c => String(c.status) === value);

    filtered.sort((a, b) => {
      const order = { '1': 0, '0': 1, '2': 2 };
      return order[String(a.status)] - order[String(b.status)];
    });

    setData(filtered);
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>📋 Danh sách VĐV đã đăng ký</h2>

      {tournament && (
        <div style={{ backgroundColor: '#e6ffe6', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <p><strong>Giải đấu:</strong> {tournament.name}</p>
          <p><strong>Thời gian:</strong> {tournament.start_date?.slice(0, 10)} đến {tournament.end_date?.slice(0, 10)}</p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <button
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '8px 14px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          onClick={() => exportToExcel(data)}
        >
          📥 Xuất danh sách
        </button>

        <button
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '8px 14px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          onClick={() => navigate(`/tournaments/${tournamentId}`)}
        >
          ⬅️ Quay Lại Chi Tiết Giải Đấu
        </button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Lọc theo trạng thái: </label>
        <select onChange={(e) => handleStatusFilter(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="1">Đã duyệt</option>
          <option value="0">Chờ duyệt</option>
          <option value="2">Đã huỷ</option>
        </select>
      </div>

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
            <tr key={idx} style={{
              backgroundColor:
                String(c.status) === '1' ? '#d0ebff' : // Xanh da trời nhạt
                String(c.status) === '2' ? '#f0f0f0' : 'white'
            }}>
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
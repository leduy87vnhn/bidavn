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
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tourRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${tournamentId}`);
        setTournament(tourRes.data);

        const compRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/by-tournament/${tournamentId}`);
        const rawData = compRes.data;
        setAllData(rawData);

        const filtered = isAdmin ? rawData : rawData.filter(c => String(c.status) === '1');

        // Sort theo trạng thái mặc định
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

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/slots?tournament_id=${tournamentId}`);
        setSlots(res.data.available_dates);
      } catch (err) {
        console.error('Lỗi khi lấy slot:', err);
      }
    };
    fetchSlots();
  }, [tournamentId]);

  // useEffect(() => {
  //   let sorted = [...data];
  //   if (sortConfig.key) {
  //     sorted.sort((a, b) => {
  //       const valA = a[sortConfig.key] || '';
  //       const valB = b[sortConfig.key] || '';
  //       return sortConfig.direction === 'asc'
  //         ? String(valA).localeCompare(String(valB))
  //         : String(valB).localeCompare(String(valA));
  //     });
  //     setData(sorted);
  //   }
  // }, [sortConfig]);

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

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sorted = [...data].sort((a, b) => {
      const valA = a[key] || '';
      const valB = b[key] || '';
      return direction === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    setSortConfig({ key, direction });
    setData(sorted);
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

      <p><strong>Tổng số VĐV (sau khi lọc):</strong> {data.length}</p>

      {isAdmin && (
        <div style={{ marginTop: 20, marginBottom: 30 }}>
          <h4>📅 Số lượng VĐV mỗi ngày</h4>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '50%' }}>
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Số lượng</th>
                <th>Số còn lại</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s, idx) => (
                <tr key={idx}>
                  <td>{s.display}</td>
                  <td>{s.remaining !== null ? (tournament.competitors_per_day - s.remaining) : '-'}</td>
                  <td>{s.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>SĐT</th>
            <th onClick={() => handleSort('club')} style={{ cursor: 'pointer' }}>
              Đơn vị {sortConfig.key === 'club' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th onClick={() => handleSort('selected_date')} style={{ cursor: 'pointer' }}>
              Ngày thi đấu {sortConfig.key === 'selected_date' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
            </th>
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
              {/* <td>{c.uniform_size}</td> */}
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
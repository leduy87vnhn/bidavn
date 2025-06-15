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
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchClub, setSearchClub] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tourRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${tournamentId}`);
        const tournament = tourRes.data;
        setTournament(tournament);

        const compRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/by-tournament/${tournamentId}`);
        const rawData = compRes.data;
        setAllData(rawData);

        // ✅ Nếu giải chưa kết thúc thì hiển thị, nếu đã kết thúc thì không hiển thị
        const now = new Date();
        const endDate = new Date(tournament.end_date);
        const isNotEnded = endDate >= now;

        let filtered = isNotEnded
          ? (isAdmin ? rawData : rawData.filter(c => String(c.status) === '1'))
          : [];

        // Sắp xếp theo trạng thái
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

  const getDailyCounts = () => {
    if (!slots || slots.length === 0 || !tournament) return [];

    let totalApproved = 0;
    let totalPending = 0;

    const daily = slots.map(slot => {
      const competitorsOfDay = allData.filter(c =>
        c.selected_date?.slice(0, 10) === slot.value && String(c.status) !== '2'
      );

      const approved = competitorsOfDay.filter(c => String(c.status) === '1').length;
      const pending = competitorsOfDay.filter(c => String(c.status) === '0').length;
      const dailyMax = tournament.competitors_per_day || 0;
      const remaining = dailyMax > 0 ? dailyMax - approved - pending : '-';

      totalApproved += approved;
      totalPending += pending;

      return {
        date: slot.display,
        approved,
        pending,
        max: dailyMax,
        remaining
      };
    });

    // Đếm thêm VĐV không chọn ngày thi đấu nhưng vẫn còn trong danh sách
    const noDateCompetitors = allData.filter(c => !c.selected_date && String(c.status) !== '2');
    const noDateApproved = noDateCompetitors.filter(c => String(c.status) === '1').length;
    const noDatePending = noDateCompetitors.filter(c => String(c.status) === '0').length;

    totalApproved += noDateApproved;
    totalPending += noDatePending;

    const totalMax = tournament.maximum_competitors && tournament.maximum_competitors > 0
      ? tournament.maximum_competitors
      : null;

    const totalRemaining =
      totalMax !== null
        ? totalMax - totalApproved - totalPending
        : '-';

    daily.push({
      date: 'Tổng cộng (gồm cả không chọn ngày)',
      approved: totalApproved,
      pending: totalPending,
      max: totalMax ?? '-',
      remaining: totalRemaining
    });

    return daily;
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
        <div style={{ marginTop: 10, marginBottom: 10, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Tìm theo tên"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Tìm theo SĐT"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
          />
          <input
            type="text"
            placeholder="Tìm theo đơn vị"
            value={searchClub}
            onChange={(e) => setSearchClub(e.target.value)}
          />
        </div>
      </div>

      <p><strong>Tổng số VĐV (sau khi lọc):</strong> {data.length}</p>

      {tournament && (
        <div style={{ marginTop: 20, marginBottom: 30 }}>
          <h4>📅 Số lượng VĐV thi đấu mỗi ngày</h4>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '80%' }}>
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Đã duyệt / Tối đa</th>
                <th>Chờ duyệt / Tối đa</th>
                <th>Số slot còn lại</th>
              </tr>
            </thead>
            <tbody>
              {getDailyCounts().map((s, idx) => {
                const isTotalRow = s.date === 'Tổng cộng (gồm cả không chọn ngày)';
                const slotValue = isTotalRow
                  ? null
                  : slots.find(sl => sl.display === s.date)?.value || 'nodate';

                return (
                  <tr
                    key={idx}
                    style={isTotalRow ? { fontWeight: 'bold', backgroundColor: '#f9f9f9' } : {}}
                  >
                    <td>
                      <span
                        onClick={() => setSelectedDateFilter(slotValue)}
                        style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {s.date}
                      </span>
                    </td>
                    <td>{s.approved} / {s.max}</td>
                    <td>{s.pending} / {s.max}</td>
                    <td>{s.remaining}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>STT</th>
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
          {(() => {
            const grouped = {};

            // Gom nhóm theo ngày thi đấu + trạng thái
            data 
            .filter(c =>
              c.name.toLowerCase().includes(searchName.toLowerCase()) &&
              c.phone.includes(searchPhone) &&
              c.club.toLowerCase().includes(searchClub.toLowerCase()) &&
              (
                selectedDateFilter === null ||
                (selectedDateFilter === 'nodate' && !c.selected_date) ||
                c.selected_date?.slice(0, 10) === selectedDateFilter
              )
            )
            .forEach(c => {
              const dateKey = c.selected_date?.slice(0, 10) || 'Không chọn ngày';
              const statusKey = statusText(c.status);
              const groupKey = `${dateKey}-${statusKey}`;
              if (!grouped[groupKey]) grouped[groupKey] = [];
              grouped[groupKey].push(c);
            });

            const rows = [];

            Object.entries(grouped).forEach(([groupKey, competitors]) => {
              competitors.forEach((c, index) => {
                rows.push(
                  <tr key={`${groupKey}-${index}`} style={{
                    backgroundColor:
                      String(c.status) === '1' ? '#d0ebff' :
                      String(c.status) === '2' ? '#f0f0f0' : 'white'
                  }}>
                    <td>{index + 1}</td> {/* STT theo nhóm */}
                    <td>{c.player_id}</td>
                    <td>{c.name}</td>
                    <td>{isAdmin ? c.phone : maskPhone(c.phone)}</td>
                    <td>{c.club}</td>
                    <td>{c.selected_date?.slice(0, 10) || 'Không chọn ngày'}</td>
                    <td>{statusText(c.status)}</td>
                  </tr>
                );
              });
            });

            return rows;
          })()}
        </tbody>
      </table>
    </div>
  );
};

export default TournamentCompetitorList;
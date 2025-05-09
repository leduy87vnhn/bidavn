import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const RegistrationDetail = () => {
  const { id } = useParams(); // registration_id
  const user = JSON.parse(localStorage.getItem('user_info'));

  const [competitors, setCompetitors] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(0);
  const [tournament, setTournament] = useState(null);

  const buttonStyle = {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    cursor: 'pointer'
  };
  
  const grayButton = {
    ...buttonStyle,
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  };

  const loadCompetitors = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/${id}/competitors`);
      setCompetitors(res.data);
      setOriginalData(res.data); // backup để cancel
    } catch (err) {
      console.error('Lỗi khi tải danh sách VĐV:', err);
    }
  };

  const loadRegistration = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/${id}`);
      setStatus(res.data.status);

      // Lấy thông tin giải đấu
      const tournamentId = res.data.tournament_id;
      const tourRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${tournamentId}`);
      setTournament(tourRes.data);
    } catch (err) {
      console.error('Lỗi khi tải bản đăng ký hoặc giải đấu:', err);
    }
  };

  useEffect(() => {
    loadCompetitors();
    loadRegistration();
  }, [id]);

  const handleInputChange = (index, field, value) => {
    const updated = [...competitors];
    updated[index][field] = value;
    setCompetitors(updated);
  };

  const handleDelete = (index) => {
    const updated = [...competitors];
    updated.splice(index, 1);
    setCompetitors(updated);
  };

  const handleCancelEdit = () => {
    setCompetitors(originalData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/${id}/update-competitors`, {
        competitors,
      });
      alert('✅ Đã lưu thay đổi');
      setIsEditing(false);
      loadCompetitors();
    } catch (err) {
      console.error('❌ Lỗi khi lưu:', err);
      alert('❌ Lỗi khi lưu thay đổi');
    }
  };

  const handleApproval = async (newStatus) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/${id}/approve`, {
        status: newStatus,
      });
      setStatus(newStatus);
      alert('✅ Cập nhật trạng thái thành công');
    } catch (err) {
      alert('❌ Lỗi khi cập nhật trạng thái');
    }
  };

  const getStatusStyle = () => {
    switch (status) {
      case 1:
        return { backgroundColor: '#d0ecff', color: '#0056b3', padding: '6px 12px', borderRadius: '6px' };
      case 2:
        return { backgroundColor: '#ccc', color: '#000', padding: '6px 12px', borderRadius: '6px' };
      default:
        return { backgroundColor: '#ffe0b3', color: '#cc7000', padding: '6px 12px', borderRadius: '6px' };
    }
  };

  return (
    <div style={{ padding: 30 }}>
    <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    Chi tiết đơn đăng ký #{id}
    <span style={getStatusStyle()}>
        {String(status) === '0' && 'Chờ duyệt'}
        {String(status) === '1' && 'Đã duyệt'}
        {String(status) === '2' && 'Đã huỷ'}
    </span>
    </h2>

      {tournament && (
        <div style={{ backgroundColor: '#e6ffe6', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <p><strong>Tên giải:</strong> {tournament.name}</p>
          <p><strong>Thời gian:</strong> {tournament.start_date?.slice(0, 10)} → {tournament.end_date?.slice(0, 10)}</p>
          <p><strong>Địa điểm:</strong> {tournament.location}</p>
          <p><strong>Nội dung:</strong> {tournament.content}</p>
        </div>
      )}

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>Nickname</th>
            <th>SĐT</th>
            <th>Ngày thi đấu</th>
            <th>CLB</th>
            {user?.user_type === 2 && isEditing && <th>Xoá</th>}
          </tr>
        </thead>
        <tbody>
          {competitors.map((c, index) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td>
                {user?.user_type === 2 && isEditing ? (
                  <input value={c.nick_name || ''} onChange={(e) => handleInputChange(index, 'nick_name', e.target.value)} />
                ) : c.nick_name}
              </td>
              <td>{c.phone_number}</td>
              <td>
                {user?.user_type === 2 && isEditing ? (
                  <input type="date" value={c.selected_date?.slice(0, 10)} onChange={(e) => handleInputChange(index, 'selected_date', e.target.value)} />
                ) : c.selected_date?.slice(0, 10)}
              </td>
              <td>
                {user?.user_type === 2 && isEditing ? (
                  <input value={c.club || ''} onChange={(e) => handleInputChange(index, 'club', e.target.value)} />
                ) : c.club}
              </td>
              {user?.user_type === 2 && isEditing && (
                <td>
                  <button onClick={() => handleDelete(index)} style={{ color: 'red' }}>Xoá</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 20 }}>
        {user?.user_type === 2 ? (
          isEditing ? (
            <>
              <button onClick={handleSave} style={buttonStyle}>💾 Lưu</button>
              <button onClick={handleCancelEdit} style={{ marginLeft: 10 }}>↩️ Huỷ</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} style={buttonStyle}>✏️ Chỉnh sửa</button>
          )
        ) : (
          <>
            <button disabled style={grayButton}>Chỉnh sửa</button>
            <button disabled style={{ ...grayButton, marginLeft: 10 }}>Lưu</button>
          </>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <strong>Trạng thái: </strong>
        {String(status) === '0' && 'Chờ duyệt'}
        {String(status) === '1' && 'Đã duyệt'}
        {String(status) === '2' && 'Đã huỷ'}

        {user?.user_type === 2 ? (
          <div style={{ marginTop: 10 }}>
            <button onClick={() => handleApproval(1)} style={buttonStyle}>✔️ Phê duyệt</button>
            <button onClick={() => handleApproval(2)} style={{ ...buttonStyle, backgroundColor: '#dc3545', marginLeft: 10 }}>❌ Từ chối</button>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <button disabled style={grayButton}>Phê duyệt</button>
            <button disabled style={{ ...grayButton, marginLeft: 10 }}>Từ chối</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationDetail;
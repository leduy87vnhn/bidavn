import React, { useState } from 'react';
import axios from 'axios';

const PlayerTableRow = ({ player, isAdmin, onUpdated, onDeleted, onApproved, onEditClick }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...player });
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [faceFile, setFaceFile] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const genderLabel = ['Nam', 'Nữ', 'Chưa rõ'][form.gender] || 'Chưa rõ';
  const memberStatusLabel = ['Tự do', 'Đăng ký', 'Hội viên'][form.member_status] || 'Chưa rõ';
  const memberFeeLabel = ['Chưa đóng', 'Đã đóng'][form.member_fee_status] || 'Không rõ';
  const disciplineLabel = ['Carom', 'Pool'][form.discipline] || '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  const uploadImage = async (file, fieldName) => {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const fileName = `${form.id}_${fieldName}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${ext}`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', fileName);

    const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/uploads/players`, formData);
    return res.data.filePath; // cần đảm bảo backend trả về { filePath: '...' }
  };

  const handleSave = async () => {
    try {
      const frontUrl = await uploadImage(frontFile, 'front_photo');
      const backUrl = await uploadImage(backFile, 'back_photo');
      const faceUrl = await uploadImage(faceFile, 'face_photo');

      const updatedPlayer = {
        ...form,
        citizen_id_front_photo: frontUrl || form.citizen_id_front_photo,
        citizen_id_back_photo: backUrl || form.citizen_id_back_photo,
        face_photo: faceUrl || form.face_photo,
        modified_date: new Date().toISOString()
      };

      await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/players/${form.id}`, updatedPlayer);
      onUpdated();
      setEditing(false);
    } catch (err) {
      console.error('❌ Lỗi khi cập nhật VĐV:', err);
    }
  };

  const handleApprove = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/players/${form.id}`, {
        ...form,
        member_status: 2,
        modified_date: new Date().toISOString()
      });
      onApproved();
    } catch (err) {
      console.error('❌ Lỗi phê duyệt:', err);
    }
  };

  const renderImage = (src) => (
    <img src={`${process.env.REACT_APP_API_BASE_URL}/${src}`} alt="Ảnh" style={{ height: 50, cursor: 'zoom-in' }} onClick={() => window.open(`${process.env.REACT_APP_API_BASE_URL}/${src}`, '_blank')} />
  );

  return (
    <tr style={{ cursor: 'default' }}>
      {isAdmin && (
      <td className="sticky-col col-id">{form.id}</td>
      )}
      {/* <td className="sticky-col col-name">
        {isAdmin ? (
          <span
            style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation(); // không lan sự kiện lên <tr>
              onEditClick(player);
            }}
          >
            {form.name}
          </span>
        ) : (
          form.name
        )}
      </td>
      <td className="sticky-col col-phone">
        {isAdmin ? (editing ? <input name="phone" value={form.phone} onChange={handleChange} /> : form.phone) : '***' + form.phone?.slice(-3)}
      </td> */}

      {/* Cột tên */}
      <td className={isAdmin ? 'sticky-col col-name' : ''}>
        {isAdmin ? (
          <span
            style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(player);
            }}
          >
            {form.name}
          </span>
        ) : (
          form.name
        )}
      </td>

      {/* Cột SĐT */}
      <td className={isAdmin ? 'sticky-col col-phone' : ''}>
        {isAdmin ? (
          editing ? (
            <input name="phone" value={form.phone} onChange={handleChange} />
          ) : (
            form.phone
          )
        ) : (
          '***' + form.phone?.slice(-3)
        )}
      </td>

      {/* Các cột chỉ hiển thị cho admin */}
      {isAdmin && (
        <>
          <td>{editing ? (
            <select name="gender" value={form.gender} onChange={handleSelectChange}>
              <option value={0}>Nam</option>
              <option value={1}>Nữ</option>
              <option value={2}>Chưa rõ</option>
            </select>
          ) : genderLabel}</td>

          <td>{editing ? <input type="date" name="birth_day" value={formatDate(form.birth_day)} onChange={handleChange} /> : formatDate(form.birth_day)}</td>
          <td>{editing ? <input name="citizen_id_passport" value={form.citizen_id_passport} onChange={handleChange} /> : form.citizen_id_passport}</td>
          <td>{editing ? <input type="date" name="citizen_id_issued_date" value={form.citizen_id_issued_date} onChange={handleChange} /> : formatDate(form.citizen_id_issued_date)}</td>
          <td>{editing ? <input name="citizen_id_issued_place" value={form.citizen_id_issued_place} onChange={handleChange} /> : form.citizen_id_issued_place}</td>
          <td>{memberStatusLabel}</td>
          <td>{editing ? (
            <select name="member_fee_status" value={form.member_fee_status} onChange={handleSelectChange}>
              <option value={0}>Chưa đóng</option>
              <option value={1}>Đã đóng</option>
            </select>
          ) : memberFeeLabel}</td>

          <td>{editing ? <input name="address" value={form.address} onChange={handleChange} /> : form.address}</td>
          <td>{editing ? <input name="competition_unit" value={form.competition_unit} onChange={handleChange} /> : form.competition_unit}</td>
          <td>{formatDate(form.joined_date)}</td>

          <td>{editing ? (
            <select name="discipline" value={form.discipline} onChange={handleSelectChange}>
              <option value={0}>Carom</option>
              <option value={1}>Pool</option>
            </select>
          ) : disciplineLabel}</td>
        </>
      )}

      {/* Các cột xếp hạng và điểm - luôn hiển thị cho mọi user */}
      <td>{form.ranking ?? ''}</td>
      <td>{form.points ?? ''}</td>
      <td>{form.pool_ranking ?? ''}</td>
      <td>{form.pool_points ?? ''}</td>

      {/* Các cột ảnh chỉ cho admin */}
      {isAdmin && (
        <>
          <td>{editing
            ? <input type="file" onChange={(e) => setFrontFile(e.target.files[0])} />
            : (form.citizen_id_front_photo && renderImage(form.citizen_id_front_photo))}</td>
          <td>{editing
            ? <input type="file" onChange={(e) => setBackFile(e.target.files[0])} />
            : (form.citizen_id_back_photo && renderImage(form.citizen_id_back_photo))}</td>
          <td>{editing
            ? <input type="file" onChange={(e) => setFaceFile(e.target.files[0])} />
            : (form.face_photo && renderImage(form.face_photo))}</td>
        </>
      )}

      {isAdmin && (
        <td>
          {editing ? (
            <>
              <button onClick={handleSave}>💾 Lưu</button>
              <button onClick={() => setEditing(false)}>❌ Huỷ</button>
            </>
          ) : (
            <>
              {/* <button onClick={() => setEditing(true)}>✏️ Sửa</button> */}
              <button onClick={() => onDeleted(form.id)}>🗑️ Xoá</button>
              {form.member_status === 1 && (
                <button onClick={handleApprove}>✔️ Phê duyệt</button>
              )}
            </>
          )}
        </td>
      )}
    </tr>
  );
};

export default PlayerTableRow;
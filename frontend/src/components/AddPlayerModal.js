import React, { useState } from 'react';
import '../css/playerList.scss';

const AddPlayerModal = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    phone: '',
    gender: 0,
    birth_day: '',
    citizen_id_passport: '',
    member_status: 0,
    member_fee_status: 0,
    address: '',
    competition_unit: '',
    discipline: 0,
    ranking: '',
    points: '',
    pool_ranking: '',
    pool_points: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  const handleConfirm = () => {
    const now = new Date().toISOString();
    const player = {
      ...formData,
      created_date: now,
      modified_date: now,
      ranking: formData.discipline === 0 ? Number(formData.ranking || 0) : null,
      points: formData.discipline === 0 ? Number(formData.points || 0) : null,
      pool_ranking: formData.discipline === 1 ? Number(formData.ranking || 0) : null,
      pool_points: formData.discipline === 1 ? Number(formData.points || 0) : null,
    };
    onConfirm(player);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Thêm vận động viên mới</h3>
        <div className="modal-grid">
          {/* <input name="id" value={formData.id} onChange={handleChange} placeholder="Mã VĐV" /> */}
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Họ tên" />
          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Số điện thoại" />

          <select name="gender" value={formData.gender} onChange={handleSelectChange}>
            <option value={0}>Nam</option>
            <option value={1}>Nữ</option>
            <option value={2}>Chưa rõ</option>
          </select>

          <input type="date" name="birth_day" value={formData.birth_day} onChange={handleChange} />
          <input name="citizen_id_passport" value={formData.citizen_id_passport} onChange={handleChange} placeholder="CCCD/Hộ chiếu" />
          
          <select name="member_status" value={formData.member_status} onChange={handleSelectChange}>
            <option value={0}>Tự do</option>
            <option value={1}>Đăng ký</option>
            <option value={2}>Hội viên</option>
          </select>

          <select name="member_fee_status" value={formData.member_fee_status} onChange={handleSelectChange}>
            <option value={0}>Chưa đóng hội phí</option>
            <option value={1}>Đã đóng hội phí</option>
          </select>

          <input name="address" value={formData.address} onChange={handleChange} placeholder="Địa chỉ thường trú" />
          <input name="competition_unit" value={formData.competition_unit} onChange={handleChange} placeholder="Đơn vị thi đấu" />

          <select name="discipline" value={formData.discipline} onChange={handleSelectChange}>
            <option value={0}>Carom</option>
            <option value={1}>Pool</option>
          </select>

          <input name="ranking" value={formData.ranking} onChange={handleChange} placeholder="Thứ hạng" />
          <input name="points" value={formData.points} onChange={handleChange} placeholder="Điểm số" />
        </div>

        <div className="modal-actions">
          <button onClick={handleConfirm} className="btn btn-confirm">Xác nhận</button>
          <button onClick={onClose} className="btn btn-cancel">Huỷ</button>
        </div>
      </div>
    </div>
  );
};

export default AddPlayerModal;
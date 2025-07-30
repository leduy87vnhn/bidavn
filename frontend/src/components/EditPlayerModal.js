import React, { useState, useEffect } from 'react';

const EditPlayerModal = ({ isOpen, player, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({ ...player });

  useEffect(() => {
    setFormData({ ...player });
  }, [player]);

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

        const updatedPlayer = {
            ...formData,
            modified_date: now,
            ranking: formData.discipline === 0 ? Number(formData.ranking || 0) : null,
            points: formData.discipline === 0 ? Number(formData.points || 0) : null,
            pool_ranking: formData.discipline === 1 ? Number(formData.ranking || 0) : null,
            pool_points: formData.discipline === 1 ? Number(formData.points || 0) : null
        };

        onConfirm(updatedPlayer);
    };

    if (!isOpen || !formData) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Cập nhật vận động viên</h3>
                <div className="modal-grid">
                <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Họ tên" />
                <input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="Số điện thoại" />
                <select name="gender" value={formData.gender || 0} onChange={handleSelectChange}>
                    <option value={0}>Nam</option>
                    <option value={1}>Nữ</option>
                    <option value={2}>Chưa rõ</option>
                </select>
                <input
                    type="date"
                    name="birth_day"
                    value={formData.birth_day ? formData.birth_day.slice(0, 10) : ''}
                    onChange={handleChange}
                />
                <input name="citizen_id_passport" value={formData.citizen_id_passport || ''} onChange={handleChange} placeholder="CCCD/Hộ chiếu" />
                <select name="member_status" value={formData.member_status || 0} onChange={handleSelectChange}>
                    <option value={0}>Tự do</option>
                    <option value={1}>Đăng ký</option>
                    <option value={2}>Hội viên</option>
                </select>
                <select name="member_fee_status" value={formData.member_fee_status || 0} onChange={handleSelectChange}>
                    <option value={0}>Chưa đóng hội phí</option>
                    <option value={1}>Đã đóng hội phí</option>
                </select>
                <input name="address" value={formData.address || ''} onChange={handleChange} placeholder="Địa chỉ thường trú" />
                <input name="competition_unit" value={formData.competition_unit || ''} onChange={handleChange} placeholder="Đơn vị thi đấu" />
                <select name="discipline" value={formData.discipline || 0} onChange={handleSelectChange}>
                    <option value={0}>Carom</option>
                    <option value={1}>Pool</option>
                </select>
                <input
                    name="ranking"
                    value={
                        formData.discipline === 0
                        ? formData.ranking ?? ''
                        : formData.pool_ranking ?? ''
                    }
                    onChange={handleChange}
                    placeholder="Thứ hạng"
                />
                <input
                    name="points"
                    value={
                        formData.discipline === 0
                        ? formData.points ?? ''
                        : formData.pool_points ?? ''
                    }
                    onChange={handleChange}
                    placeholder="Điểm số"
                />
                </div>
                <div className="modal-actions">
                <button onClick={handleConfirm} className="btn btn-confirm">Lưu</button>
                <button onClick={onClose} className="btn btn-cancel">Huỷ</button>
                </div>
            </div>
        </div>
    );
};

export default EditPlayerModal;
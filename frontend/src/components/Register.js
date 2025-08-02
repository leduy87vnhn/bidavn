import React, { useState } from 'react';
import axios from 'axios';
import '../register.scss';
import MainPageHeader from '../components/MainPageHeader';
import MainPageMenuBar from '../components/MainPageMenuBar';

const Register = () => {
  const [form, setForm] = useState({
    phone_number: '',
    password: '',
    name: '',
    gender: 0,
    birthday: '',
    citizen_id_passport: '',
    citizen_id_issued_date: '',
    citizen_id_issued_place: '',
    address: '',
    competition_unit: '',
    email: ''
  });

  const [cccdFront, setCccdFront] = useState(null);
  const [cccdBack, setCccdBack] = useState(null);
  const [facePhoto, setFacePhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const uploadImage = async (file, suffix) => {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const filename = `${form.phone_number}_${suffix}.${ext}`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);
    const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/players/upload-photo`, formData);
    return res.data.filePath;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (
        !form.phone_number || !form.password || !form.name ||
        !form.citizen_id_passport || !form.citizen_id_issued_date ||
        !form.citizen_id_issued_place || !form.address
      ) {
        setMessage('❌ Vui lòng nhập đầy đủ các trường bắt buộc.');
        return;
      }

      const citizen_id_front_photo = await uploadImage(cccdFront, 'cccd_front');
      const citizen_id_back_photo = await uploadImage(cccdBack, 'cccd_rear');
      const face_photo = await uploadImage(facePhoto, 'anh46');
      const now = new Date().toISOString();

      // Tạo user
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/users`, {
        user_name: form.phone_number,
        password: form.password,
        name: form.name,
        phone_number: form.phone_number,
        birthday: form.birthday,
        user_type: 0,
        email: form.email,
        enable: true,
        created_date: now,
        modified_date: now,
      });

      // Lấy mã player mới
      const idRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players`);
      const maxId = idRes.data.reduce((max, p) => {
        const num = parseInt((p.id || '').replace(/[^\d]/g, ''), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const playerId = 'H' + String(maxId + 1).padStart(5, '0');

      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/players`, {
        id: playerId,
        name: form.name.toUpperCase(),
        phone: form.phone_number,
        birth_day: form.birthday,
        citizen_id_passport: form.citizen_id_passport,
        citizen_id_issued_date: form.citizen_id_issued_date,
        citizen_id_issued_place: form.citizen_id_issued_place,
        address: form.address,
        competition_unit: form.competition_unit,
        citizen_id_front_photo,
        citizen_id_back_photo,
        face_photo,
        member_status: 1,
        member_fee_status: 0,
        created_date: now,
        modified_date: now
      });

      window.location.href = 'https://hbsf.com.vn/';
    } catch (err) {
      console.error(err);
      setMessage('❌ Đăng ký thất bại. Có thể SĐT hoặc email đã tồn tại.');
    }
  };

  return (
  <>
    <div style={{ position: 'relative', zIndex: 1000 }}>
      <MainPageHeader />
      <MainPageMenuBar />
    </div>
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>ĐĂNG KÝ THÀNH VIÊN LIÊN ĐOÀN<br />BILLIARDS & SNOOKER THÀNH PHỐ HỒ CHÍ MINH</h2>
        <div className="form-section">
          <h3>📝 THÔNG TIN ĐĂNG KÝ</h3>

          <label>SỐ ĐIỆN THOẠI:<span> Sử dụng làm ID đăng nhập sau này</span></label>
          <input name="phone_number" value={form.phone_number} onChange={handleChange} required />

            <label>
            MẬT KHẨU:
            <span>Một mật khẩu gồm ít nhất 6 ký tự hoặc số</span>
            {/* <div className="password-wrapper">
                <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                />
                <div className="eye-button" onClick={() => setShowPassword(!showPassword)}>
                👁️
                </div>
            </div> */}
            <div style={{ position: 'relative' }}>
            <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Nhập mật khẩu"
                style={{ backgroundColor: '#e9f1ff', paddingRight: '40px' }}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                position: 'absolute',
                top: '50%',
                right: '6px',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                }}
            >
                {showPassword ? '🙈' : '👁️'}
            </button>
            </div>
            </label>

          <label>HỌ VÀ TÊN:<span> Nhập họ tên có dấu bằng tiếng Việt</span></label>
          <input name="name" value={form.name} onChange={handleChange} required />

          <label>GIỚI TÍNH:</label>
          <select name="gender" value={form.gender} onChange={handleChange}>
            <option value={0}>Nam</option>
            <option value={1}>Nữ</option>
            <option value={2}>Khác</option>
          </select>

          <label>NGÀY SINH:</label>
          <input type="date" name="birthday" value={form.birthday} onChange={handleChange} required />

          <label>SỐ CCCD:</label>
          <input name="citizen_id_passport" value={form.citizen_id_passport} onChange={handleChange} required />

          <label>NGÀY CẤP CCCD:</label>
          <input type="date" name="citizen_id_issued_date" value={form.citizen_id_issued_date} onChange={handleChange} required />

          <label>NƠI CẤP CCCD:</label>
          <select
            name="citizen_id_issued_place"
            value={form.citizen_id_issued_place}
            onChange={handleChange}
            required
            >
            <option value="">-- Chọn nơi cấp --</option>
            <option value="Cục Cảnh sát quản lý hành chính về trật tự xã hội">
                1. Cục Cảnh sát quản lý hành chính về trật tự xã hội
            </option>
            <option value="Cục Cảnh sát đăng ký quản lý cư trú và dữ liệu Quốc gia về dân cư">
                2. Cục Cảnh sát đăng ký quản lý cư trú và dữ liệu Quốc gia về dân cư
            </option>
            <option value="Bộ Công an">
                3. Bộ Công an
            </option>
          </select>

          <label>ĐỊA CHỈ THƯỜNG TRÚ:</label>
          <input name="address" value={form.address} onChange={handleChange} required />

          <label>ĐANG THI ĐẤU CHO ĐƠN VỊ (TỈNH/THÀNH):</label>
          <input name="competition_unit" value={form.competition_unit} onChange={handleChange} required />

          <label>EMAIL:</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />

          <label>ẢNH (4X6):</label>
          <input type="file" accept="image/*" onChange={e => setFacePhoto(e.target.files[0])} required />

          <label>ẢNH (MẶT TRƯỚC) CCCD App VNeID:</label>
          <input type="file" accept="image/*" onChange={e => setCccdFront(e.target.files[0])} required />

          <label>ẢNH (MẶT SAU) CCCD App VNeID:</label>
          <input type="file" accept="image/*" onChange={e => setCccdBack(e.target.files[0])} required />

          <div className="note">
            Việc cung cấp ảnh CCCD trên App VNeID để phục vụ cho tính chính xác đối với các thông tin đăng ký.
          </div>

          <button type="submit">XÁC NHẬN ĐĂNG KÝ</button>
          {message && <div className="form-message">{message}</div>}
        </div>
      </form>
    </div>
  </>
  );
};

export default Register;
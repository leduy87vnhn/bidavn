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
  const [showOkButton, setShowOkButton] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'name') {
      newValue = value.toUpperCase();
    }
    setForm(prev => ({ ...prev, [name]: newValue }));
  };

  const resizeImage = (file, maxSizeMB = 1) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const MAX_WIDTH = 1000;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const quality = 0.85;
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Resize thất bại'));
          resolve(blob);
        }, 'image/jpeg', quality);
      };

      img.onerror = reject;
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async (file, type) => {
    if (!file) return null;

    console.log(`[Upload] File name:`, file.name);
    const ext = file.name && file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    let filename = '';

    if (type === 'face') {
      filename = `${form.phone_number}_face_photo.${ext}`;
    } else if (type === 'cccd_front') {
      filename = `${form.phone_number}_citizen_id_front_photo.${ext}`;
    } else if (type === 'cccd_back') {
      filename = `${form.phone_number}_citizen_id_back_photo.${ext}`;
    }

    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('filename', filename);
    let finalBlob = file;
    if (file.size > 1024 * 1024) {
      try {
        finalBlob = await resizeImage(file); // resize thành blob (JPEG)
        console.log('✅ Ảnh đã được resize:', finalBlob.size, 'bytes');
      } catch (err) {
        console.warn('⚠️ Lỗi resize ảnh, dùng ảnh gốc.', err);
        finalBlob = file;
      }
    }

    // Trick: tạo Blob mới để inject filename
    const renamedFile = new File([finalBlob], filename, { type: finalBlob.type });

    const formData = new FormData();
    formData.append('file', renamedFile);

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

      // Check trùng SĐT
      try {
        await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/by-phone?phone=${form.phone_number}`);
        setMessage('❌ Số điện thoại này đã được đăng ký.');
        return;
      } catch (err) {
        if (err.response?.status !== 404) {
          setMessage('❌ Lỗi kiểm tra số điện thoại.');
          return;
        }
      }

      try {
        const allUsers = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/users`);
        const emailExists = allUsers.data.find(u => u.email === form.email);
        if (emailExists) {
          setMessage(`❌ Email này đã được đăng ký cho tài khoản: ${emailExists.user_name || '(không rõ tên đăng nhập)'}.`);
          return;
        }
      } catch (err) {
        console.error('Lỗi kiểm tra email:', err);
        setMessage('❌ Lỗi kiểm tra email.');
        return;
      }

      try {
        const allPlayers = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players`);
        const duplicate = allPlayers.data.find(p => p.citizen_id_passport === form.citizen_id_passport);
        if (duplicate) {
          setMessage(`❌ Số CCCD này đã được đăng ký với số điện thoại ${duplicate.phone || '(không rõ)'}.`);
          return;
        }
      } catch (err) {
        console.error('Lỗi kiểm tra CCCD:', err);
        setMessage('❌ Lỗi kiểm tra CCCD.');
        return;
      }

      let citizen_id_front_photo = null;
      let citizen_id_back_photo = null;
      let face_photo = null;

      try {
        if (cccdFront) citizen_id_front_photo = await uploadImage(cccdFront, 'cccd_front');
        //if (cccdBack)  citizen_id_back_photo  = await uploadImage(cccdBack, 'cccd_back');
        citizen_id_back_photo = null;
        if (facePhoto) face_photo             = await uploadImage(facePhoto, 'face');
      } catch (uploadErr) {
        setMessage('❌ Upload ảnh không thành công. Vẫn tiếp tục đăng ký.');
        setShowOkButton(true);
        citizen_id_front_photo = null;
        citizen_id_back_photo = null;
        face_photo = null;
      }
      if (form.phone_number.startsWith('+84')) {
        form.phone_number = '0' + form.phone_number.slice(3);
      }
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
        gender: form.gender,
        birth_day: form.birthday,
        citizen_id_passport: form.citizen_id_passport,
        citizen_id_issued_date: form.citizen_id_issued_date,
        citizen_id_issued_place: form.citizen_id_issued_place,
        address: form.address,
        competition_unit: form.competition_unit,
        citizen_id_front_photo,
        citizen_id_back_photo,
        discipline: 0,
        ranking: 0,
        points: 0,
        pool_ranking: 0,
        pool_points: 0,
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
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="eye-button"
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
            {/* <option value={2}>Khác</option> */}
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
          <input name="competition_unit" value={form.competition_unit} onChange={handleChange}  />

          <label>EMAIL:</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />

          <label>ẢNH (4X6):</label>
          <input type="file" accept="image/*" onChange={e => setFacePhoto(e.target.files[0])}  />

          <label>ẢNH (MẶT TRƯỚC) CCCD App VNeID:</label>
          <input type="file" accept="image/*" onChange={e => setCccdFront(e.target.files[0])}  />

          {/* <label>ẢNH (MẶT SAU) CCCD App VNeID:</label>
          <input type="file" accept="image/*" onChange={e => setCccdBack(e.target.files[0])}  /> */}

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
import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import axios from 'axios';
import '../tournamentRegistration.scss';

const AccountCreationModal = ({
  isOpen,
  onClose,
  phoneNumber,
  initialName,     // ✅ thêm vào đây
  onSuccess
}) => {
  const [form, setForm] = useState({
    phone_number: '',
    name: '',
    password: '',
    email: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

    // 🔑 Đồng bộ số điện thoại (và tên nếu có) từ props
    useEffect(() => {
    if (phoneNumber || initialName) {
        setForm(prev => ({
        ...prev,
        phone_number: phoneNumber || prev.phone_number,
        // Nếu bạn muốn auto điền tên từ props => thêm dòng này
        name: initialName || prev.name || ''
        }));
    }
    }, [phoneNumber, isOpen]);

  const handleRegister = async () => {
    const { phone_number, name, password, email } = form;

    if (!phone_number || !name || !password) {
      setError('❌ Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (!/^\d{10}$/.test(phone_number)) {
      setError('❌ Số điện thoại phải gồm đúng 10 chữ số.');
      return;
    }
    if (email && !email.includes('@')) {
      setError('❌ Email không hợp lệ.');
      return;
    }

    try {
      // Tạo user
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/users`, {
        user_name: phone_number,
        password,
        name,
        phone_number,
        birthday: null,
        user_type: 1,
        email,
        enable: true,
        created_date: new Date(),
        modified_date: new Date(),
      });

      // Tạo player
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/players`, {
        name: name.toUpperCase(),
        phone: phone_number,
        share_info: false,
        gender: 0,
        created_date: new Date(),
        modified_date: new Date(),
      });

      alert('✅ Tài khoản đã tạo thành công.');
      onSuccess(form);  // gọi callback từ parent
      onClose();        // đóng modal
    } catch (err) {
      console.error('Lỗi tạo tài khoản:', err);
      setError('❌ Không thể tạo tài khoản. Có thể email hoặc số điện thoại đã tồn tại.');
    }
  };



  return (
    <ReactModal isOpen={isOpen} onRequestClose={onClose} ariaHideApp={false}>
      <div className="confirm-modal-content">
        <h3>Đăng Ký Tài Khoản</h3>
        {/* <p>Số điện thoại chưa tồn tại. Bạn có muốn đăng ký tài khoản không?</p> */}
        {/* 🔹 Thông báo hướng dẫn cho người chưa có tài khoản */}
        <div className="account-info-message">
          Hiện tại bạn chưa có tài khoản trên Website <strong>HBSF</strong>.<br />
          Có tài khoản sẽ thuận tiện cho việc đăng ký các giải đấu sau này.<br />
          Hệ thống sẽ tự động tạo tài khoản cho bạn với thông tin bạn vừa đăng ký.<br />
          <strong>Bạn hãy tạo bổ sung mật khẩu mới.</strong>
        </div>

        <label>Số điện thoại:</label>
        <input className="table-input" value={form.phone_number} disabled />

        <label>Họ tên:</label>
        <input className="table-input" name="name" value={form.name} onChange={handleChange} />

        <label>Tạo mật khẩu mới:</label>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            className="table-input"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ marginLeft: 8 }}>
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <label>Email:</label>
        <input
          className="table-input"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email (không bắt buộc)"
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="confirm-modal-buttons" style={{ marginTop: 16 }}>
          <button className="cancel" onClick={onClose}>Hủy</button>
          <button className="confirm" onClick={handleRegister}>Đăng Ký</button>
        </div>
      </div>
    </ReactModal>
  );
};

export default AccountCreationModal;
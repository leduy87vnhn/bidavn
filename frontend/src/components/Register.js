import React, { useState } from 'react';
import axios from 'axios';
import '../register.scss';
import { FaSignInAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Register = () => {
    const [user_name, setUserName] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [user_type, setUserType] = useState(0); // 0 for Vận Động Viên, 1 for Trọng Tài
    const [birthday, setBirthday] = useState('');
    const [email, setEmail] = useState('');
    const [phone_number, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/auth/register`, {
                user_name,
                name,
                password,
                user_type,
                birthday,
                phone_number,
                email
            }, {
                withCredentials: false // <== THÊM DÒNG NÀY
            });
            setMessage(response.data.message);
        } catch (error) {
            setMessage('Error registering user.');
        }
    };

    return (
        <div className="register-container">
            <form className="register-form" onSubmit={handleSubmit}>
                <h2>Đăng ký tài khoản</h2>

                <div className="form-group">
                    <label>Tên đăng nhập:</label>
                    <input
                        type="text"
                        value={user_name}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Họ và tên:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Mật khẩu:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Loại người dùng:</label>
                    <select
                        value={user_type}
                        onChange={(e) => setUserType(Number(e.target.value))}
                        required
                    >
                        <option value={0}>Vận Động Viên</option>
                        <option value={1}>Trọng Tài</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Ngày sinh:</label>
                    <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Số điện thoại:</label>
                    <input
                        type="text"
                        value={phone_number}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <button type="submit">Đăng ký</button>

                {message && <div className="form-message">{message}</div>}
                <p className="form-link">
                    <span title="Chuyển đến trang đăng nhập">
                        <FaSignInAlt style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    </span>
                    Đã có tài khoản? <Link to="/login">Đăng nhập tại đây</Link>
                </p>
            </form>
        </div>
    );
};

export default Register;
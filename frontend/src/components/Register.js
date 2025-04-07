import React, { useState } from 'react';
import axios from 'axios';
import '../register.scss';

const Register = () => {
    const [user_name, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [user_type, setUserType] = useState(0); // 0 for Vận Động Viên, 1 for Trọng Tài
    const [birthday, setBirthday] = useState('');
    const [phone_number, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://54.169.185.252:5000/api/auth/register', {
                user_name,
                password,
                user_type,
                birthday,
                phone_number
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

                <button type="submit">Đăng ký</button>

                {message && <div className="form-message">{message}</div>}
            </form>
        </div>
    );
};

export default Register;
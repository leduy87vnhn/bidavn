import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../login.scss';

const Login = () => {
    const [user_name, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [loginSuccess, setLoginSuccess] = useState(false); // 👈 NEW
    const navigate = useNavigate();

    // Khi mở trang: nếu có user_name được lưu từ trước
    useEffect(() => {
        const savedUser = localStorage.getItem('remembered_user');
        if (savedUser) {
            setUserName(savedUser);
            setRemember(true);
        }
    }, []);

    // ✅ Khi login thành công → chuyển sang tournaments
    useEffect(() => {
        if (loginSuccess) {
            //navigate('/tournaments');
            window.location.href = '/tournaments';
        }
    }, [loginSuccess, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/auth/login`, {
                user_name,
                password
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user_info', JSON.stringify(response.data.user));
            setMessage('Đăng nhập thành công.');
            setLoginSuccess(true); // ✅ dùng flag để điều hướng
            window.location.href = '/tournaments';
            navigate('/tournaments');

            // Ghi nhớ tên đăng nhập nếu được chọn
            if (remember) {
                localStorage.setItem('remembered_user', user_name);
            } else {
                localStorage.removeItem('remembered_user');
            }

        } catch (error) {
            if (error.response?.data?.message) {
                setMessage(error.response.data.message);
            } else {
                setMessage('Đăng nhập thất bại.');
            }
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin}>
                <h2>Đăng nhập</h2>

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
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <span
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '10px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? 'Ẩn' : 'Hiện'}
                        </span>
                    </div>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        style={{ marginRight: '8px' }}
                    />
                    <label>Ghi nhớ đăng nhập</label>
                </div>

                <button type="submit">Đăng nhập</button>

                {message && <div className="form-message">{message}</div>}

                <p className="form-link">
                    Chưa có tài khoản? <Link to="/register">Đăng ký tại đây</Link>
                </p>
            </form>
        </div>
    );
};

export default Login;
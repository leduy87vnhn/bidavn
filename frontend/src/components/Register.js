import React, { useState } from 'react';
import axios from 'axios';

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
            const response = await axios.post('http://localhost:5000/api/auth/register', {
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
        <div>
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>User Name:</label>
                    <input type="text" value={user_name} onChange={(e) => setUserName(e.target.value)} required />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div>
                    <label>User Type:</label>
                    <select value={user_type} onChange={(e) => setUserType(Number(e.target.value))} required>
                        <option value={0}>Vận Động Viên</option>
                        <option value={1}>Trọng Tài</option>
                    </select>
                </div>
                <div>
                    <label>Birthday:</label>
                    <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} required />
                </div>
                <div>
                    <label>Phone Number:</label>
                    <input type="text" value={phone_number} onChange={(e) => setPhoneNumber(e.target.value)} required />
                </div>
                <button type="submit">Register</button>
            </form>
            <div>{message}</div>
        </div>
    );
};

export default Register;

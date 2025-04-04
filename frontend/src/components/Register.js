import React, { useState } from 'react';
import axios from 'axios';

export default function Register() {
  const [form, setForm] = useState({
    user_name: '', password: '', name: '', birthday: '', phone_number: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('http://<your-ec2-ip>:3001/api/auth/register', form);
      setMessage(res.data.message);
    } catch (err) {
      setMessage('Registration failed');
    }
  };

  return (
    <div>
      <h2>Register as Athlete</h2>
      <form onSubmit={handleSubmit}>
        <input name="user_name" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <input name="name" placeholder="Full Name" onChange={handleChange} required />
        <input type="date" name="birthday" onChange={handleChange} required />
        <input name="phone_number" placeholder="Phone Number" onChange={handleChange} required />
        <button type="submit">Register</button>
      </form>
      <p>{message}</p>
    </div>
  );
}
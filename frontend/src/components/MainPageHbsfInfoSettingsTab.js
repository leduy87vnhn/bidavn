import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import axios from 'axios';

const MainPageHbsfInfoSettingsTab = () => {
  const [info, setInfo] = useState({
    hbsf_name: '',
    headquarters_address: '',
    office_address: '',
    website: '',
    email: ''
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/mainpage/hbsf-info');
        setInfo(res.data || {});
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        setMessage('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  const handleChange = (e) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.post('/api/mainpage/update-hbsf-info', info);
      setMessage('✅ Đã lưu thành công');
    } catch (err) {
      console.error('Lỗi khi lưu:', err);
      setMessage('❌ Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>Thông tin HBSF</Typography>

      <TextField fullWidth label="Tên hiệp hội" name="hbsf_name" value={info.hbsf_name} onChange={handleChange} sx={{ mb: 2 }} />
      <TextField fullWidth label="Địa chỉ trụ sở" name="headquarters_address" value={info.headquarters_address} onChange={handleChange} sx={{ mb: 2 }} />
      <TextField fullWidth label="Địa chỉ văn phòng" name="office_address" value={info.office_address} onChange={handleChange} sx={{ mb: 2 }} />
      <TextField fullWidth label="Website" name="website" value={info.website} onChange={handleChange} sx={{ mb: 2 }} />
      <TextField fullWidth label="Email" name="email" value={info.email} onChange={handleChange} sx={{ mb: 2 }} />

      <Button variant="contained" onClick={handleSave} disabled={saving}>
        {saving ? 'Đang lưu...' : 'Lưu thông tin'}
      </Button>

      {message && (
        <Typography sx={{ mt: 2 }} color={message.includes('✅') ? 'green' : 'red'}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default MainPageHbsfInfoSettingsTab;
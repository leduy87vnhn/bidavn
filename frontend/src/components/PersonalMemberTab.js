import React, { useEffect, useState } from 'react';
import {
  TextField, Button, Grid, Typography, Box
} from '@mui/material';
import axios from 'axios';
import '../css/memberRegistration.scss';

const PersonalMemberTab = () => {
  const [player, setPlayer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [backPhoto, setBackPhoto] = useState(null);
  const [facePhoto, setFacePhoto] = useState(null);

  const [userPhone, setUserPhone] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user_info'));
    if (user?.phone_number) {
      setUserPhone(user.phone_number);
      fetchPlayer(user.phone_number);
    }
  }, []);

  const fetchPlayer = async (phone) => {
    const res = await axios.get(`/api/members/me?phone=${phone}`);
    if (res.data) setPlayer(res.data);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === 'front') setFrontPhoto(file);
    else if (type === 'back') setBackPhoto(file);
    else if (type === 'face') setFacePhoto(file);
  };

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append('id', player.id);
    formData.append('name', player.name);
    formData.append('address', player.address || '');
    formData.append('citizen_id_passport', player.citizen_id_passport || '');

    if (frontPhoto) formData.append('citizen_id_front_photo', frontPhoto);
    if (backPhoto) formData.append('citizen_id_back_photo', backPhoto);
    if (facePhoto) formData.append('face_photo', facePhoto);

    await axios.put('/api/members/update-player', formData);
    setIsEditing(false);
    setFrontPhoto(null);
    setBackPhoto(null);
    setFacePhoto(null);
    fetchPlayer(userPhone);
  };

  const handleRegister = () => {
    if (!player?.phone || !player.name || !player.citizen_id_passport || !player.citizen_id_front_photo || !player.citizen_id_back_photo || !player.face_photo) {
      alert('Vui lòng nhập đầy đủ thông tin và ảnh trước khi đăng ký!');
      return;
    }
    // Gửi yêu cầu đăng ký (tùy yêu cầu, backend sẽ xử lý)
    alert('Đã gửi yêu cầu đăng ký!');
  };

    const handleRegisterConfirm = async () => {
        if (!player?.phone || !player.name || !player.citizen_id_passport || !player.citizen_id_front_photo || !player.citizen_id_back_photo || !player.face_photo) {
            alert('Vui lòng nhập đầy đủ thông tin và ảnh trước khi đăng ký!');
            setShowConfirm(false);
            return;
        }

        try {
            await axios.post('/api/members/register-member', { id: player.id });
            alert('✅ Đã đăng ký hội viên thành công!');
            setShowConfirm(false);
            fetchPlayer(userPhone); // reload lại thông tin mới
        } catch (err) {
            console.error('Đăng ký thất bại:', err);
            alert('❌ Có lỗi khi đăng ký hội viên.');
        }

        // TODO: gửi yêu cầu đăng ký hội viên thật sự (API hoặc cập nhật status)
        alert('✅ Đã gửi yêu cầu đăng ký!');
        setShowConfirm(false);
    };

  if (!player) {
    return <Typography>Không có thông tin hội viên cá nhân.</Typography>;
  }

  const renderImage = (label, field, fileSetter) => (
    <Grid item xs={12} sm={6} md={4}>
      <Typography fontWeight="bold" mb={1}>{label}</Typography>
      {isEditing ? (
        <Button variant="outlined" component="label">
          Duyệt Ảnh
          <input type="file" accept="image/*" hidden onChange={(e) => handleFileChange(e, field)} />
        </Button>
      ) : (
        player[field] && (
          <img
            src={`/uploads/players/${player[field]}`}
            alt={label}
            onClick={() => window.open(`/uploads/players/${player[field]}`, '_blank')}
            style={{ width: '100%', maxHeight: 180, objectFit: 'contain', cursor: 'zoom-in', borderRadius: 8 }}
          />
        )
      )}
    </Grid>
  );

  return (
    <Box mt={2}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Họ Tên"
            fullWidth
            value={player.name}
            onChange={(e) => setPlayer({ ...player, name: e.target.value })}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Số Điện Thoại"
            fullWidth
            value={player.phone}
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Số CCCD"
            fullWidth
            value={player.citizen_id_passport || ''}
            onChange={(e) => setPlayer({ ...player, citizen_id_passport: e.target.value })}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Địa Chỉ"
            fullWidth
            multiline
            minRows={2}
            value={player.address || ''}
            onChange={(e) => setPlayer({ ...player, address: e.target.value })}
            disabled={!isEditing}
          />
        </Grid>

        {renderImage("ẢNH MẶT TRƯỚC CCCD", "citizen_id_front_photo", "front")}
        {renderImage("ẢNH MẶT SAU CCCD", "citizen_id_back_photo", "back")}
        {renderImage("ẢNH 4x6", "face_photo", "face")}

        <Grid item xs={12} mt={2}>
          {!isEditing ? (
            <Button variant="outlined" onClick={() => setIsEditing(true)}>Điều Chỉnh</Button>
          ) : (
            <Button variant="contained" onClick={handleUpdate}>Cập Nhật</Button>
          )}
          {player.member_status === 0 && !isEditing && (
            <Button
                variant="contained"
                color="success"
                onClick={() => setShowConfirm(true)}
                sx={{ ml: 2 }}
            >
                Đăng Ký
            </Button>
          )}
        </Grid>
      </Grid>
        {showConfirm && (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-content">
            <h3>Xác Nhận Đăng Ký Hội Viên</h3>
            <div className="confirm-modal-buttons">
                <button className="confirm" onClick={handleRegisterConfirm}>Xác Nhận</button>
                <button className="cancel" onClick={() => setShowConfirm(false)}>Hủy</button>
            </div>
            </div>
        </div>
        )}
    </Box>
  );
};

export default PersonalMemberTab;
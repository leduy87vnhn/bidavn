import React, { useEffect, useState } from 'react';
import {
  TextField, Button, Grid, Typography, Box
} from '@mui/material';
import axios from 'axios';
//import '../css/memberRegistration.scss';
import '../css/personalMember.scss';

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
    <Box className="personal-member-container">
      <div className="section-title">HỘI VIÊN CÁ NHÂN</div>

      {/* Dòng thông tin */}
      <div className="info-row">
        <label>Số điện thoại:</label>
        <div className="value-box">{player.phone || '—'}</div>
        <label>Họ và tên:</label>
        <div className="value-box">{player.name || '—'}</div>
      </div>
      <div className="info-row">
        <label>Giới tính:</label>
        <div className="value-box">{player.gender === 1 ? 'Nữ' : player.gender === 2 ? 'Khác' : 'Nam'}</div>
        <label>Ngày sinh:</label>
        <div className="value-box">{player.birth_day ? new Date(player.birth_day).toLocaleDateString('vi-VN') : '—'}</div>
      </div>
      <div className="info-row">
        <label>Số CCCD / Hộ chiếu:</label>
        <div className="value-box">{player.citizen_id_passport || '—'}</div>
        <label>Địa chỉ thường trú:</label>
        <div className="value-box">{player.address || '—'}</div>
      </div>
      <div className="info-row">
        <label>Đơn vị thi đấu:</label>
        <div className="value-box">{player.competition_unit || '—'}</div>
        <label>Trạng thái:</label>
        <div className="value-box">
          <span className="status-box">
            {player.member_status === 1 ? 'Tự do/Hội viên' : 'Chưa đăng ký'}
          </span>
        </div>
      </div>

      {/* Ảnh 4x6 */}
      <div className="photo-side">
        <div className="label">Ảnh 4x6</div>
        {player.face_photo ? (
          <img
            src={`/uploads/players/${player.face_photo}`}
            alt="Ảnh 4x6"
            onClick={() => window.open(`/uploads/players/${player.face_photo}`, '_blank')}
          />
        ) : (
          <div style={{ fontStyle: 'italic' }}>Chưa có ảnh</div>
        )}
      </div>

      {/* Nút */}
      <div className="action-buttons">
        {!isEditing ? (
          <Button variant="outlined" onClick={() => setIsEditing(true)}>ĐIỀU CHỈNH</Button>
        ) : (
          <Button variant="contained" onClick={handleUpdate}>CẬP NHẬT</Button>
        )}
      </div>

      {/* Phần "Thông tin chuyên môn" nếu cần */}
      <div className="section-title" style={{ marginTop: 24 }}>THÔNG TIN CHUYÊN MÔN</div>
      <div className="info-row">
        <label>Nội dung thi đấu:</label>
        <div className="value-box">{player.discipline || '—'}</div>
        <label>Điểm số:</label>
        <div className="value-box">{player.points || '—'}</div>
      </div>
      <div className="info-row">
        <label>Thứ hạng:</label>
        <div className="value-box">{player.ranking || '—'}</div>
      </div>
    </Box>
  );
};

export default PersonalMemberTab;
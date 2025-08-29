import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TextField, Button, Grid, Typography, Box, Select, MenuItem } from '@mui/material';
import '../css/personalMember.scss';

const PersonalMemberTab = () => {
  const [player, setPlayer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [backPhoto, setBackPhoto] = useState(null);
  const [facePhoto, setFacePhoto] = useState(null);

  const [userPhone, setUserPhone] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [tempData, setTempData] = useState(null);
  const [originalPlayer, setOriginalPlayer] = useState(null);

  const [frontPhotoFile, setFrontPhotoFile] = useState(null);
  const [backPhotoFile, setBackPhotoFile] = useState(null);
  const [facePhotoFile, setFacePhotoFile] = useState(null);

  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [facePreview, setFacePreview] = useState(null);

  const disciplineText =
    player?.discipline === 1 ? 'Pool'
    : player?.discipline === 0 ? 'Carom'
    : '—';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user_info'));
    if (user?.phone_number) {
      setUserPhone(user.phone_number);
      fetchPlayer(user.phone_number);
    }
  }, []);

  const fetchPlayer = async (phone) => {
    try {
      const res = await axios.get(`/api/members/me?phone=${phone}`);
      console.log('📦 Dữ liệu player trả về:', res.data); // 👈 Thêm log này
      if (res.data) {
        setPlayer(res.data);
        setOriginalPlayer(res.data); // <-- thêm dòng này
      }
    } catch (err) {
      console.error('❌ Lỗi khi gọi API /api/members/me:', err);
    }
  };

  // Helper chuyển đường dẫn DB thành URL hợp lệ
  const effectivePhotoSrc = (dbValue) => {
    if (!dbValue) return null;
    return dbValue.includes('/') ? `/${dbValue.replace(/^\//, '')}` : `/uploads/players/${dbValue}`;
  };

  // Cell ảnh dùng trong Grid
  const ImageCell = ({ label, kind, dbField }) => {
    const preview = (kind === 'face') ? facePreview
                  : (kind === 'front') ? frontPreview
                  : (kind === 'back') ? backPreview : null;
    const dbPath = player[dbField] ? effectivePhotoSrc(player[dbField]) : null;

    return (
      <Grid item xs={12} sm={6} md={4}>
        <Typography fontWeight="bold" mb={1}>{label}</Typography>
        {isEditing ? (
          <>
            <Button variant="outlined" component="label">
              Duyệt Ảnh
              <input type="file" accept="image/*" hidden onChange={(e) => handleFileChange(e, kind)} />
            </Button>
            {(preview || dbPath) && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={preview || dbPath}
                  alt={label}
                  style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 8, cursor: 'zoom-in' }}
                  onClick={() => window.open(preview || dbPath, '_blank')}
                />
                {preview && <div style={{ fontStyle: 'italic', marginTop: 4 }}>(* Ảnh mới – chỉ hiển thị trước khi lưu)</div>}
              </div>
            )}
          </>
        ) : (
          dbPath ? (
            <img
              src={dbPath}
              alt={label}
              onClick={() => window.open(dbPath, '_blank')}
              style={{ width: '100%', maxHeight: 180, objectFit: 'contain', cursor: 'zoom-in', borderRadius: 8 }}
            />
          ) : <div style={{ fontStyle: 'italic' }}>Chưa có ảnh</div>
        )}
      </Grid>
    );
  };

  const handleFileChange = (e, kind) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (kind === 'front') { setFrontPhotoFile(file); setFrontPreview(url); }
    if (kind === 'back')  { setBackPhotoFile(file);  setBackPreview(url); }
    if (kind === 'face')  { setFacePhotoFile(file);  setFacePreview(url); }
  };

  const handleEditToggle = () => {
    setOriginalPlayer(player);  // lưu bản gốc để hủy
    setIsEditing(true);
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

  // [THÊM] – resize (giống Register.js)
const resizeImage = (file, maxWidth = 1000, quality = 0.85) =>
  new Promise((resolve, reject) => {
    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const scale = Math.min(1, maxWidth / img.width);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Canvas toBlob failed'));
              const out = new File([blob], file.name.replace(/\.\w+$/i, '.jpg'), {
                type: 'image/jpeg',
              });
              resolve(out);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err);
    }
  });
  // [THÊM] – upload ảnh tới /api/players/upload-photo
  const API = process.env.REACT_APP_API_BASE_URL || '';

  const uploadImage = async (file, phone, type) => {
    if (!file) return null;
    const ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop() : 'jpg';
    let filename = '';
    if (type === 'face') filename = `${phone}_face_photo.${ext}`;
    if (type === 'cccd_front') filename = `${phone}_citizen_id_front_photo.${ext}`;
    if (type === 'cccd_back')  filename = `${phone}_citizen_id_back_photo.${ext}`;

    let finalFile = file;
    if (file.size > 1024 * 1024) {
      try { finalFile = await resizeImage(file); } catch { finalFile = file; }
    }
    const renamed = new File([finalFile], filename, { type: finalFile.type || 'image/jpeg' });

    const formData = new FormData();
    formData.append('file', renamed);

    const res = await axios.post(`${API}/api/players/upload-photo`, formData);
    return res.data?.filePath || null; // "uploads/players/xxx.jpg"
  };

  const saveAll = async () => {
    if (!player?.id) { alert('Không xác định được ID hội viên.'); return; }
    try {
      // 1) Upload ảnh mới nếu có
      let citizen_id_front_photo = player.citizen_id_front_photo || null;
      let citizen_id_back_photo  = player.citizen_id_back_photo || null;
      let face_photo             = player.face_photo || null;

      if (frontPhotoFile) {
        const p = await uploadImage(frontPhotoFile, player.phone || userPhone, 'cccd_front');
        if (p) citizen_id_front_photo = p;
      }
      if (backPhotoFile) {
        const p = await uploadImage(backPhotoFile, player.phone || userPhone, 'cccd_back');
        if (p) citizen_id_back_photo = p;
      }
      if (facePhotoFile) {
        const p = await uploadImage(facePhotoFile, player.phone || userPhone, 'face');
        if (p) face_photo = p;
      }

      // 2) PUT cập nhật player vào DB
      const payload = {
        name: (player.name || '').toUpperCase(),
        phone: player.phone || 'unknown',
        ranking: player.ranking || 0,
        points: player.points || 0,
        pool_ranking: player.pool_ranking || 0,
        pool_points: player.pool_points || 0,
        modified_date: new Date().toISOString(),
        gender: player.gender ?? 0,
        birth_day: player.birth_day || null,
        citizen_id_passport: player.citizen_id_passport || '',
        member_status: player.member_status ?? 1,
        member_fee_status: player.member_fee_status ?? 0,
        address: player.address || '',
        competition_unit: player.competition_unit || '',
        discipline: player.discipline ?? 0,
        citizen_id_front_photo,
        citizen_id_back_photo,
        face_photo
      };

      await axios.put(`${API}/api/players/${player.id}`, payload);

      alert('✅ Đã lưu thông tin!');
      setIsEditing(false);
      // clear file & preview
      setFrontPhotoFile(null); setFrontPreview(null);
      setBackPhotoFile(null);  setBackPreview(null);
      setFacePhotoFile(null);  setFacePreview(null);

      fetchPlayer(userPhone);
    } catch (err) {
      console.error('❌ Lỗi lưu:', err);
      alert('❌ Lưu thất bại.');
    }
  };

  const handleRegister = () => {
    if (!player?.phone || !player.name || !player.citizen_id_passport || !player.citizen_id_front_photo || !player.citizen_id_back_photo || !player.face_photo) {
      alert('Vui lòng nhập đầy đủ thông tin và ảnh trước khi đăng ký!');
      return;
    }
    // Gửi yêu cầu đăng ký (tùy yêu cầu, backend sẽ xử lý)
    alert('Đã gửi yêu cầu đăng ký!');
  };

  const handleCancel = () => {
    //setTempData(player);  // Reset dữ liệu về lại như cũ
    setPlayer(tempData);
    setIsEditing(false);  // Thoát chế độ chỉnh sửa
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
            src={player[field].includes('/') ? `/${player[field]}` : `/uploads/players/${player[field]}`}
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
        <div className="value-box">
          {isEditing ? (
            <TextField
              size="small"
              value={player.phone || ''}
              onChange={(e) =>
                setPlayer({ ...player, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
              }
              inputProps={{ inputMode: 'numeric', maxLength: 10 }}
            />
          ) : (player.phone || '—')}
        </div>

        <label>Họ và tên:</label>
        <div className="value-box">
          {isEditing ? (
            <TextField
              size="small"
              value={player.name || ''}
              onChange={(e) =>
                setPlayer({ ...player, name: (e.target.value || '').toUpperCase() })
              }
            />
          ) : (player.name || '—')}
        </div>
      </div>

      <div className="info-row">
        <label>Giới tính:</label>
        <div className="value-box">
          {isEditing ? (
            <Select
              size="small"
              value={player.gender ?? 0}
              onChange={(e) =>
                setPlayer({ ...player, gender: Number(e.target.value) })
              }
            >
              <MenuItem value={0}>Nam</MenuItem>
              <MenuItem value={1}>Nữ</MenuItem>
              <MenuItem value={2}>Khác</MenuItem>
            </Select>
          ) : (player.gender === 1 ? 'Nữ' : player.gender === 2 ? 'Khác' : 'Nam')}
        </div>

        <label>Ngày sinh:</label>
        <div className="value-box">
          {isEditing ? (
            <TextField
              type="date"
              size="small"
              value={player.birth_day ? new Date(player.birth_day).toISOString().slice(0, 10) : ''}
              onChange={(e) =>
                setPlayer({ ...player, birth_day: e.target.value })
              }
            />
          ) : (player.birth_day ? new Date(player.birth_day).toLocaleDateString('vi-VN') : '—')}
        </div>
      </div>

      <div className="info-row">
        <label>Số CCCD / Hộ chiếu:</label>
        <div className="value-box">
          {isEditing ? (
            <TextField
              size="small"
              value={player.citizen_id_passport || ''}
              onChange={(e) =>
                setPlayer({ ...player, citizen_id_passport: e.target.value })
              }
            />
          ) : (player.citizen_id_passport || '—')}
        </div>

        <label>Địa chỉ thường trú:</label>
        <div className="value-box" style={{ flex: 2 }}>
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={player.address || ''}
              onChange={(e) =>
                setPlayer({ ...player, address: e.target.value })
              }
            />
          ) : (player.address || '—')}
        </div>
      </div>

      <div className="info-row">
        <label>Đơn vị thi đấu:</label>
        <div className="value-box">
          {isEditing ? (
            <TextField
              size="small"
              value={player.competition_unit || ''}
              onChange={(e) =>
                setPlayer({ ...player, competition_unit: e.target.value })
              }
            />
          ) : (player.competition_unit || '—')}
        </div>

        <label>Trạng thái:</label>
        <div className="value-box">
          {isEditing ? (
            <Select
              size="small"
              value={player.member_status ?? 1}
              onChange={(e) =>
                setPlayer({ ...player, member_status: Number(e.target.value) })
              }
            >
              <MenuItem value={1}>Tự do/Hội viên</MenuItem>
              <MenuItem value={0}>Chưa đăng ký</MenuItem>
            </Select>
          ) : (
            <span className="status-box">
              {player.member_status === 1 ? 'Tự do/Hội viên' : 'Chưa đăng ký'}
            </span>
          )}
        </div>
      </div>

      {/* Ảnh 4x6 */}
      {/* <div className="photo-side">
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
      </div> */}
      <Grid container spacing={2}>
        <ImageCell label="Ảnh 4x6" kind="face"  dbField="face_photo" />
        <ImageCell label="CCCD mặt trước" kind="front" dbField="citizen_id_front_photo" />
        <ImageCell label="CCCD mặt sau"   kind="back"  dbField="citizen_id_back_photo" />
      </Grid>

      {/* Nút */}
      <div className="action-buttons">
        {/* {!isEditing ? (
          <Button variant="outlined" onClick={() => setIsEditing(true)}>ĐIỀU CHỈNH</Button>
        ) : (
          <Button variant="contained" onClick={handleUpdate}>CẬP NHẬT</Button>
        )} */}
        {isEditing ? (
          <>
            <button onClick={handleUpdate}>💾 Lưu</button>
            <button onClick={handleCancel} style={{ marginLeft: '10px', backgroundColor: '#ccc' }}>❌ Hủy</button>
          </>
        ) : (
          <button onClick={() => {
            setTempData({ ...player }); // Lưu bản sao
            setIsEditing(true);
          }}>
            🛠️ Điều chỉnh
          </button>        
        )}
      </div>

      {/* Phần "Thông tin chuyên môn" nếu cần */}
      <div className="info-row">
        <label>Nội dung thi đấu:</label>
        <div className="value-box">
          {isEditing ? (
            <Select
              size="small"
              value={player.discipline ?? 0}
              onChange={(e) =>
                setPlayer({ ...player, discipline: Number(e.target.value) })
              }
            >
              <MenuItem value={0}>Carom</MenuItem>
              <MenuItem value={1}>Pool</MenuItem>
            </Select>
          ) : (player.discipline === 1 ? 'Pool' : player.discipline === 0 ? 'Carom' : '—')}
        </div>

        <label>Điểm số:</label>
        <div className="value-box">
          {isEditing ? (
            <TextField
              size="small"
              value={player.discipline === 1 ? (player.pool_points || '') : (player.points || '')}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, '');
                if (player.discipline === 1)
                  setPlayer({ ...player, pool_points: v });
                else
                  setPlayer({ ...player, points: v });
              }}
            />
          ) : (player.discipline === 1 ? player.pool_points || '—' : player.points || '—')}
        </div>

        <label>Thứ hạng:</label>
        <div className="value-box">
          {isEditing ? (
            <TextField
              size="small"
              value={player.discipline === 1 ? (player.pool_ranking || '') : (player.ranking || '')}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, '');
                if (player.discipline === 1)
                  setPlayer({ ...player, pool_ranking: v });
                else
                  setPlayer({ ...player, ranking: v });
              }}
            />
          ) : (player.discipline === 1 ? player.pool_ranking || '—' : player.ranking || '—')}
        </div>
      </div>
    </Box>
  );
};

export default PersonalMemberTab;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const TournamentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditForm, setShowEditForm] = useState(false);
    const [editData, setEditData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${id}/upload-background`)
            .then(res => {
                setTournament(res.data);
                setLoading(false);
            })
            .catch(err => {
                setError('Không tìm thấy giải đấu.');
                setLoading(false);
            });
    }, [id]);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
    };
    const handleBackgroundUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
    
        const formData = new FormData();
        formData.append('background', file);
        setUploading(true);
    
        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_BASE_URL}/api/tournament/${id}/upload-background`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );
            alert('✅ Cập nhật hình nền thành công');
            // Reload tournament để có ảnh mới
            const updated = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${id}`);
            setTournament(updated.data);
        } catch (err) {
            alert('❌ Lỗi khi cập nhật hình nền');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (error) return <p>{error}</p>;
    if (!tournament) return null;

    return (
        <div
            style={{
                maxWidth: 800,
                margin: '40px auto',
                padding: 20,
                backgroundImage: tournament.background_image
                    ? `url(${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/${tournament.background_image})`
                    : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 12,
                backgroundColor: '#fff',
                backdropFilter: 'brightness(0.95)', // để chữ dễ đọc
            }}
        >
            <h2>Chi tiết Giải đấu</h2>
            <p><strong>Tên giải:</strong> {isEditing ? (
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            ) : tournament.name}</p>

            <p><strong>Mã giải:</strong> {isEditing ? (
                <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
            ) : tournament.code}</p>

            <p><strong>Ngày bắt đầu:</strong> {isEditing ? (
                <input type="date" value={formData.start_date.slice(0,10)} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
            ) : formatDate(tournament.start_date)}</p>

            <p><strong>Ngày kết thúc:</strong> {isEditing ? (
                <input type="date" value={formData.end_date.slice(0,10)} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
            ) : formatDate(tournament.end_date)}</p>

            <p><strong>Địa điểm:</strong> {isEditing ? (
                <input value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            ) : tournament.location}</p>

            <p><strong>Lệ phí:</strong> {isEditing ? (
                <input type="number" value={formData.attendance_price} onChange={e => setFormData({ ...formData, attendance_price: e.target.value })} />
            ) : `${parseInt(tournament.attendance_price).toLocaleString('vi-VN')} VNĐ`}</p>

            <p><strong>Cơ cấu giải thưởng:</strong> {isEditing ? (
                <input value={formData.prize || ''} onChange={e => setFormData({ ...formData, prize: e.target.value })} />
            ) : tournament.prize}</p>

            <p><strong>Ngày chọn thi đấu từ:</strong> {isEditing ? (
                <input type="date" value={formData.registerable_date_start?.slice(0,10)} onChange={e => setFormData({ ...formData, registerable_date_start: e.target.value })} />
            ) : formatDate(tournament.registerable_date_start)}</p>

            <p><strong>Ngày chọn thi đấu đến:</strong> {isEditing ? (
                <input type="date" value={formData.registerable_date_end?.slice(0,10)} onChange={e => setFormData({ ...formData, registerable_date_end: e.target.value })} />
            ) : formatDate(tournament.registerable_date_end)}</p>

            <p><strong>Mô tả:</strong> {isEditing ? (
                <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            ) : tournament.description}</p>
            {JSON.parse(localStorage.getItem('user_info'))?.user_type === 2 && !isEditing && (
                <button
                    style={{ marginTop: '10px' }}
                    onClick={() => {
                        setFormData(tournament);
                        setIsEditing(true);
                    }}
                >
                    Sửa
                </button>
            )}
            <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                style={{ marginTop: 10 }}
            />
            {uploading && <p>Đang tải lên...</p>}
            {isEditing && (
                <div style={{ marginTop: '10px' }}>
                    <button
                        style={{ marginRight: '10px', backgroundColor: '#28a745', color: 'white' }}
                        onClick={async () => {
                            try {
                                await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${id}`, formData);
                                alert('✅ Cập nhật thành công!');
                                setIsEditing(false);
                                setTournament(formData); // Cập nhật lại bản hiển thị
                            } catch (err) {
                                alert('❌ Lỗi khi cập nhật.');
                            }
                        }}
                    >
                        Lưu
                    </button>
                    <button onClick={() => setIsEditing(false)}>Huỷ</button>
                </div>
            )}
            <div style={{ marginTop: 20 }}>
                <button
                    style={{ marginRight: 10 }}
                    onClick={() => alert("Chức năng đăng ký VĐV chưa triển khai")}
                >
                    Đăng ký VĐV
                </button>
                <button
                    style={{ marginRight: 10 }}
                    onClick={() => alert("Chức năng đăng ký trọng tài chưa triển khai")}
                >
                    Đăng ký Trọng tài
                </button>
                <button onClick={() => navigate('/tournaments')}>
                    Quay lại danh sách
                </button>
                {/* {showEditForm && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                        <h3>Cập nhật giải đấu</h3>
                        <input type="text" value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            placeholder="Tên giải" />
                        <input type="text" value={editData.code}
                            onChange={(e) => setEditData({ ...editData, code: e.target.value })}
                            placeholder="Mã giải" />
                        <input type="number" value={editData.attendance_price}
                            onChange={(e) => setEditData({ ...editData, attendance_price: e.target.value })}
                            placeholder="Lệ phí" />
                        <input type="date" value={editData.start_date?.slice(0,10)}
                            onChange={(e) => setEditData({ ...editData, start_date: e.target.value })} />
                        <input type="date" value={editData.end_date?.slice(0,10)}
                            onChange={(e) => setEditData({ ...editData, end_date: e.target.value })} />
                        <input type="text" value={editData.location || ''}
                            onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                            placeholder="Địa điểm" />
                        <input type="text" value={editData.prize || ''}
                            onChange={(e) => setEditData({ ...editData, prize: e.target.value })}
                            placeholder="Cơ cấu giải" />
                        <input type="date" value={editData.registerable_date_start?.slice(0,10)}
                            onChange={(e) => setEditData({ ...editData, registerable_date_start: e.target.value })}
                            placeholder="Ngày đăng ký từ" />
                        <input type="date" value={editData.registerable_date_end?.slice(0,10)}
                            onChange={(e) => setEditData({ ...editData, registerable_date_end: e.target.value })}
                            placeholder="Ngày đăng ký đến" />
                        <textarea value={editData.description || ''}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            placeholder="Mô tả" />
                        <br />
                        <button
                            style={{ marginTop: '10px', backgroundColor: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '5px' }}
                            onClick={async () => {
                                try {
                                    await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${id}`, editData);
                                    alert("✅ Cập nhật thành công!");
                                    window.location.reload();
                                } catch (err) {
                                    alert("❌ Lỗi khi cập nhật.");
                                }
                            }}
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                )} */}
            </div>
        </div>
    );
};

export default TournamentDetail;
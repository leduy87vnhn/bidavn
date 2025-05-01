import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaEdit, FaCamera, FaArrowLeft } from 'react-icons/fa';

const TournamentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [uploading, setUploading] = useState(false);

    const user = JSON.parse(localStorage.getItem('user_info'));

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
    };

    const loadTournament = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${id}`);
            setTournament(res.data);
            setLoading(false);
        } catch (err) {
            setError('Không tìm thấy giải đấu.');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTournament();
    }, [id]);

    const handleBackgroundUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !tournament) return;

        const form = new FormData();
        form.append('background', file);
        setUploading(true);

        try {
            await axios.post(
                `${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${tournament.id}/upload-background`,
                form,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            alert('✅ Cập nhật hình nền thành công');
            await loadTournament();
        } catch (err) {
            console.error('❌ Lỗi khi cập nhật hình nền:', err.message);
            alert('❌ Lỗi khi cập nhật hình nền');
        } finally {
            setUploading(false);
        }
    };

    const primaryButtonStyle = {
        backgroundColor: '#28a745',
        color: '#fff',
        padding: '10px 18px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '15px',
        marginRight: '12px',
        marginTop: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
    };

    const secondaryButtonStyle = {
        ...primaryButtonStyle,
        backgroundColor: '#6c757d'
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (error) return <p>{error}</p>;
    if (!tournament) return null;

    return (
        <div
            style={{
                backgroundImage: tournament.background_image
                    ? `url(${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/${tournament.background_image})`
                    : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '100vh',
                padding: '40px 0',
                backdropFilter: 'blur(3px)',
            }}
        >
            <div
                style={{
                    maxWidth: 800,
                    margin: '0 auto',
                    padding: '30px',
                    backgroundColor: 'rgba(144, 238, 144, 0.9)',
                    borderRadius: '16px',
                }}
            >
                <h2 style={{ marginBottom: 20 }}>📋 Chi tiết Giải đấu</h2>

                <p><strong>Tên giải:</strong> {isEditing ? (
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                ) : tournament.name}</p>

                <p><strong>Mã giải:</strong> {isEditing ? (
                    <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                ) : tournament.code}</p>

                <p><strong>Ngày bắt đầu:</strong> {isEditing ? (
                    <input type="date" value={formData.start_date?.slice(0, 10)} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                ) : formatDate(tournament.start_date)}</p>

                <p><strong>Ngày kết thúc:</strong> {isEditing ? (
                    <input type="date" value={formData.end_date?.slice(0, 10)} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
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
                    <input type="date" value={formData.registerable_date_start?.slice(0, 10)} onChange={e => setFormData({ ...formData, registerable_date_start: e.target.value })} />
                ) : formatDate(tournament.registerable_date_start)}</p>

                <p><strong>Ngày chọn thi đấu đến:</strong> {isEditing ? (
                    <input type="date" value={formData.registerable_date_end?.slice(0, 10)} onChange={e => setFormData({ ...formData, registerable_date_end: e.target.value })} />
                ) : formatDate(tournament.registerable_date_end)}</p>

                <p><strong>Mô tả:</strong> {isEditing ? (
                    <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                ) : tournament.description}</p>

                {user?.user_type === 2 && !isEditing && (
                    <>
                        <button
                            style={primaryButtonStyle}
                            onClick={() => {
                                setFormData(tournament);
                                setIsEditing(true);
                            }}
                        >
                            <FaEdit /> Sửa
                        </button>

                        <label style={{ ...primaryButtonStyle, display: 'inline-block', cursor: 'pointer' }}>
                            <FaCamera /> Hình nền
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBackgroundUpload}
                                style={{ display: 'none' }}
                            />
                        </label>

                        {uploading && <p>Đang tải lên...</p>}
                    </>
                )}

                {isEditing && (
                    <div style={{ marginTop: '10px' }}>
                        <button
                            style={primaryButtonStyle}
                            onClick={async () => {
                                try {
                                    await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${tournament.id}`, formData);
                                    alert('✅ Cập nhật thành công!');
                                    setIsEditing(false);
                                    setTournament(formData);
                                } catch (err) {
                                    alert('❌ Lỗi khi cập nhật.');
                                }
                            }}
                        >
                            Lưu
                        </button>
                        <button style={secondaryButtonStyle} onClick={() => setIsEditing(false)}>Huỷ</button>
                    </div>
                )}

                <div style={{ marginTop: 30 }}>
                    <button style={primaryButtonStyle} onClick={() => alert("Chức năng đăng ký VĐV chưa triển khai")}>Đăng ký VĐV</button>
                    <button style={primaryButtonStyle} onClick={() => alert("Chức năng đăng ký trọng tài chưa triển khai")}>Đăng ký Trọng tài</button>
                    <button style={secondaryButtonStyle} onClick={() => navigate('/tournaments')}><FaArrowLeft /> Quay lại danh sách</button>
                </div>
            </div>
        </div>
    );
};

export default TournamentDetail;
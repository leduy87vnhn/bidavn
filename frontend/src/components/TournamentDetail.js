import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaEdit, FaCamera, FaArrowLeft } from 'react-icons/fa';
import { useParams, useNavigate, Link } from 'react-router-dom';

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

    const formatCurrency = (value) => {
        return parseInt(value).toLocaleString('vi-VN') + ' VNĐ';
    };

    const contentOptions = [
        "Carom 1 băng nam",
        "Carom 1 băng nữ",
        "Carom 3 băng nam",
        "Carom 3 băng nữ",
        "Pool 9 bi nam",
        "Pool 9 bi nữ",
        "Pool 8 bi nam",
        "Pool 8 bi nữ",
        "Pool 10 bi nam",
        "Pool 10 bi nữ"
    ];

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

    const inputStyle = {
        width: '100%',
        padding: '8px',
        marginBottom: '10px',
        borderRadius: '4px',
        border: '1px solid #ccc'
    };

    const readOnlyStyle = {
        ...inputStyle,
        backgroundColor: '#f0f0f0'
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

    const getInput = (key, multiline = false, rows = 1) => (
        isEditing ? (
            key === 'content' ? (
                <select style={inputStyle} value={formData[key] || ''} onChange={e => setFormData({ ...formData, [key]: e.target.value })}>
                    <option value="">-- Chọn nội dung --</option>
                    {contentOptions.map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : multiline ? (
                <textarea rows={rows} style={inputStyle} value={formData[key] || ''} onChange={e => setFormData({ ...formData, [key]: e.target.value })} />
            ) : (
                <input style={inputStyle} value={formData[key] || ''} onChange={e => setFormData({ ...formData, [key]: e.target.value })} />
            )
        ) : (
            <input style={readOnlyStyle} value={key === 'attendance_price' ? formatCurrency(tournament[key]) : (tournament[key] || '')} readOnly />
        )
    );

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
                    backgroundColor: 'rgba(200, 255, 200, 0.85)',
                    borderRadius: '16px',
                }}
            >
                <h2 style={{ marginBottom: 10 }}>📋 Chi tiết Giải đấu</h2>

                {user?.user_type === 2 && !isEditing && (
                    <button
                        style={primaryButtonStyle}
                        onClick={() => {
                            setFormData(tournament);
                            setIsEditing(true);
                        }}
                    >
                        <FaEdit /> Sửa
                    </button>
                )}

                <p><strong>Tên giải:</strong><br />{getInput('name')}</p>
                <p><strong>Mã giải:</strong><br />{getInput('code')}</p>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <p><strong>Ngày bắt đầu:</strong><br />{isEditing ? (
                            <input style={inputStyle} type="date" value={formData.start_date?.slice(0, 10)} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                        ) : (
                            <input style={readOnlyStyle} value={formatDate(tournament.start_date)} readOnly />
                        )}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                        <p><strong>Ngày kết thúc:</strong><br />{isEditing ? (
                            <input style={inputStyle} type="date" value={formData.end_date?.slice(0, 10)} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                        ) : (
                            <input style={readOnlyStyle} value={formatDate(tournament.end_date)} readOnly />
                        )}</p>
                    </div>
                </div>

                <p><strong>Địa điểm:</strong><br />{getInput('location', true, 2)}</p>
                <p><strong>Nội dung:</strong><br />{getInput('content', true, 3)}</p>
                <p><strong>Lệ phí:</strong><br />{getInput('attendance_price', true, 3)}</p>
                <p><strong>Cơ cấu giải thưởng:</strong><br />{getInput('prize', true, 3)}</p>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <p><strong>Ngày chọn thi đấu từ:</strong><br />{isEditing ? (
                            <input style={inputStyle} type="date" value={formData.registerable_date_start?.slice(0, 10)} onChange={e => setFormData({ ...formData, registerable_date_start: e.target.value })} />
                        ) : (
                            <input style={readOnlyStyle} value={formatDate(tournament.registerable_date_start)} readOnly />
                        )}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                        <p><strong>Ngày chọn thi đấu đến:</strong><br />{isEditing ? (
                            <input style={inputStyle} type="date" value={formData.registerable_date_end?.slice(0, 10)} onChange={e => setFormData({ ...formData, registerable_date_end: e.target.value })} />
                        ) : (
                            <input style={readOnlyStyle} value={formatDate(tournament.registerable_date_end)} readOnly />
                        )}</p>
                    </div>
                    <p><strong>Số vận động viên thi mỗi ngày:</strong><br />
                        {isEditing ? (
                            <input
                                style={inputStyle}
                                type="number"
                                value={formData.competitor_per_day || ''}
                                onChange={e => setFormData({ ...formData, competitor_per_day: e.target.value })}
                            />
                        ) : (
                            <input
                                style={readOnlyStyle}
                                value={tournament.competitor_per_day || ''}
                                readOnly
                            />
                        )}
                    </p>
                </div>

                <p><strong>Mô tả:</strong><br />{getInput('description', true, 3)}</p>

                {user?.user_type === 2 && (
                    <>
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
                    <button style={primaryButtonStyle} onClick={() => alert("Chức năng đăng ký VĐV chưa triển khai")}>Đăng ký thi đấu</button>
                    <button style={secondaryButtonStyle} onClick={() => navigate('/tournaments')}><FaArrowLeft /> Quay lại danh sách</button>
                </div>
                <p style={{ marginTop: '10px' }}>
                <Link to="/players" style={{ color: '#007bff', textDecoration: 'underline' }}>
                    Xem danh sách VĐV hiện có
                </Link>
                </p>
            </div>
        </div>
    );
};

export default TournamentDetail;

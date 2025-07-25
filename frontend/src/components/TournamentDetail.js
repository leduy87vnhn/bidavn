import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FaEdit, FaCamera, FaArrowLeft } from 'react-icons/fa';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import MainLayout from '../components/MainLayout';

const TournamentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [logoFile, setLogoFile] = useState(null);

    const [qrCropSrc, setQrCropSrc] = useState(null);
    const [qrCrop, setQrCrop] = useState({ unit: '%', width: 50, x: 25, y: 25 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const [showQrCropModal, setShowQrCropModal] = useState(false);
    const qrImageRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('user_info'));

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
    };

    const loadTournament = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/${id}`);
            setTournament(res.data);
        } catch (err) {
            setError('Không tải được dữ liệu.');
        } finally {
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
                `${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/${tournament.id}/upload-background`,
                form,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            alert('✅ Cập nhật hình nền thành công');
            await loadTournament();
        } catch (err) {
            alert('❌ Lỗi khi cập nhật hình nền');
        } finally {
            setUploading(false);
        }
    };

    const handleBankQrSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            console.log('📌 selected image');
            console.log('📌 reader.result:', reader.result);

            setQrCropSrc(reader.result);
            
            // 👇 Set crop mặc định để tránh lỗi "undefined%"
            setQrCrop({
            unit: '%',
            x: 25,
            y: 25,
            width: 50,
            height: 50,
            aspect: 1,
            });

            setShowQrCropModal(true);
        };
        reader.readAsDataURL(file);
    };

    const getCroppedImage = async (image, crop) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob(blob => resolve(blob), 'image/jpeg');
        });
    };

    const getCroppedImageBlob = (image, crop) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
        );

        canvas.toBlob((blob) => {
        resolve(blob);
        }, 'image/jpeg');
    });
    };

    const handleBankQrCropUpload = async () => {
    if (!qrImageRef.current || !completedCrop?.width || !completedCrop?.height) {
        alert('Ảnh hoặc vùng crop không hợp lệ');
        return;
    }

    const croppedBlob = await getCroppedImageBlob(qrImageRef.current, completedCrop);
    const form = new FormData();
    form.append('bank_qr', croppedBlob, 'qr.jpg');
    setUploading(true);

    try {
        await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/${tournament.id}/upload-bankqr`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        alert('✅ Cập nhật QR ngân hàng thành công');
        setShowQrCropModal(false);
        setQrCropSrc(null);
        await loadTournament();
    } catch (err) {
        alert('❌ Lỗi khi cập nhật QR ngân hàng');
    } finally {
        setUploading(false);
    }
    };

    const fetchLogo = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/logo`);
            setLogoFile(res.data.filename);
        } catch (err) {
            console.error('Lỗi khi tải logo:', err);
        }
    };

    useEffect(() => {
        fetchLogo();
    }, []);

    const formatCurrency = (value) => {
        return parseInt(value).toLocaleString('vi-VN') + ' VNĐ';
    };

    const contentOptions = [
        "Carom 1 băng nam", "Carom 1 băng nữ", "Carom 3 băng nam", "Carom 3 băng nữ",
        "Pool 9 bi nam", "Pool 9 bi nữ", "Pool 8 bi nam", "Pool 8 bi nữ",
        "Pool 10 bi nam", "Pool 10 bi nữ"
    ];

    const inputStyle = {
        width: '100%', padding: '8px', marginBottom: '10px',
        borderRadius: '4px', border: '1px solid #ccc'
    };

    const readOnlyStyle = {
        ...inputStyle, backgroundColor: '#f0f0f0'
    };

    const scrollableStyle = {
        ...readOnlyStyle,
        maxHeight: '120px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap'
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

    const getInput = (key, multiline = false, rows = 1, scrollable = false) => (
        isEditing ? (
            key === 'content' ? (
                <select style={inputStyle} value={formData[key] || ''} onChange={e => setFormData({ ...formData, [key]: e.target.value })}>
                    <option value="">-- Chọn nội dung --</option>
                    {contentOptions.map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : multiline ? (
                <textarea
                    rows={rows}
                    style={{ ...inputStyle, maxHeight: '120px', overflowY: 'auto' }}
                    value={formData[key] || ''}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                />
            ) : (
                <input
                    type={(key.includes('date') || key === 'registration_deadline') ? 'date' : key.includes('price') || key.includes('per_day') ? 'number' : 'text'}
                    style={inputStyle}
                    value={(key.includes('date') || key.includes('deadline'))
                        ? (formData[key]?.slice?.(0, 10) || '')
                        : (formData[key] || '')}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                />
            )
        ) : (
            <div style={scrollable ? scrollableStyle : readOnlyStyle}>
                {key === 'attendance_fee_common'
                    ? formatCurrency(tournament[key])
                    : (key.includes('date') || key === 'registration_deadline')
                        ? formatDate(tournament[key])
                        : (tournament[key] || '')}
            </div>
        )
    );

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (error) return <p>{error}</p>;
    if (!tournament) return null;

    return (
        <MainLayout>
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
                    {logoFile && (
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <img
                                src={`${process.env.REACT_APP_API_BASE_URL}/uploads/logos/${logoFile}`}
                                alt="Logo"
                                style={{ height: 60, objectFit: 'contain' }}
                            />
                        </div>
                    )}

                    <h2 style={{ marginBottom: 10 }}>📋 Chi tiết Giải đấu</h2>

                    <div style={{ marginBottom: '10px' }}>
                        <button style={primaryButtonStyle} onClick={() => navigate(`/tournament_events/${tournament.id}/register`)}>
                            Đăng ký thi đấu
                        </button>
                    </div>

                    <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <Link to={`/tournament_events/${tournament.id}/competitors`} style={{ color: '#007bff', textDecoration: 'underline' }}>
                            Xem danh sách VĐV đã đăng ký
                        </Link>
                        <Link to="/players" style={{ color: '#007bff', textDecoration: 'underline' }}>
                            Tra cứu ID Vận Động Viên
                        </Link>
                    </div>

                    <p><strong>Tên giải:</strong><br />{getInput('name')}</p>
                    <p><strong>Mã giải:</strong><br />{getInput('code')}</p>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}><p><strong>Ngày bắt đầu:</strong><br />{getInput('start_date')}</p></div>
                        <div style={{ flex: 1 }}><p><strong>Ngày kết thúc:</strong><br />{getInput('end_date')}</p></div>
                    </div>

                    <p><strong>Địa điểm:</strong><br />{getInput('location', true, 5, true)}</p>
                    <p><strong>Nội dung:</strong><br />{getInput('content')}</p>
                    <p><strong>Lệ phí:</strong><br />{getInput('attendance_fee_common')}</p>
                    <p><strong>Ngân hàng:</strong><br />{getInput('bank_name')}</p>
                    <p><strong>Số tài khoản:</strong><br />{getInput('bank_number')}</p>
                    <p><strong>Tên tài khoản:</strong><br />{getInput('bank_acc_name')}</p>
                    <p><strong>Hướng dẫn đăng ký:</strong><br />{getInput('registration_method', true, 5, true)}</p>
                    <p><strong>Cơ cấu giải thưởng:</strong><br />{getInput('prize', true, 5, true)}</p>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}><p><strong>Ngày chọn thi đấu từ:</strong><br />{getInput('registerable_date_start')}</p></div>
                        <div style={{ flex: 1 }}><p><strong>Đến:</strong><br />{getInput('registerable_date_end')}</p></div>
                        {user?.user_type === 2 && (
                            <div style={{ flex: 1 }}><p><strong>Hạn đăng ký:</strong><br />{getInput('registration_deadline')}</p></div>
                        )}
                    </div>

                    <p><strong>VĐV mỗi ngày:</strong><br />{getInput('competitors_per_day')}</p>
                    <p><strong>Số lượng VĐV tối đa:</strong><br />{getInput('maximum_competitors')}</p>
                    <p><strong>Điều kiện:</strong><br />{getInput('conditions', true, 5, true)}</p>
                    <p><strong>Quy định:</strong><br />{getInput('rules', true, 5, true)}</p>
                    <p><strong>Trang phục & thiết bị:</strong><br />{getInput('uniform', true, 5, true)}</p>
                    <p><strong>Mô tả:</strong><br />{getInput('description', true, 10, true)}</p>

                    {user?.user_type === 2 && (
                        <>
                            <label style={{ ...primaryButtonStyle, display: 'inline-block', cursor: 'pointer' }}>
                                <FaCamera /> Hình nền
                                <input type="file" accept="image/*" onChange={handleBackgroundUpload} style={{ display: 'none' }} />
                            </label>

                            <label style={{ ...primaryButtonStyle, display: 'inline-block', cursor: 'pointer' }}>
                            <FaCamera /> QR ngân hàng
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBankQrSelect}
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
                                        await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/${tournament.id}`, formData);
                                        alert('✅ Cập nhật thành công!');
                                        setIsEditing(false);
                                        setTournament(formData);
                                    } catch (err) {
                                        alert('❌ Lỗi khi cập nhật.');
                                    }
                                }}
                            >Lưu</button>
                            <button style={secondaryButtonStyle} onClick={() => setIsEditing(false)}>Huỷ</button>
                        </div>
                    )}

                    <div style={{ marginTop: 30 }}>
                        {user?.user_type === 2 && !isEditing && (
                            <button
                                style={primaryButtonStyle}
                                onClick={() => {
                                    setFormData(tournament);
                                    setIsEditing(true);
                                }}
                            ><FaEdit /> Sửa</button>
                        )}

                        {user?.user_type === 2 && (
                            <button
                                style={{ ...primaryButtonStyle, marginLeft: 10 }}
                                onClick={() =>
                                    navigate(`/registrations?tournament=${encodeURIComponent(tournament?.name || '')}`)
                                }
                            >
                                Xem Đăng Ký
                            </button>
                        )}

                        <button style={secondaryButtonStyle} onClick={() => navigate('/tournament_events')}>
                            <FaArrowLeft /> Quay lại danh sách
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal crop QR ngân hàng */}
            {showQrCropModal && (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999
            }}>
                <div style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 10,
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto'
                }}>
                <h3>Cắt ảnh QR ngân hàng</h3>
                <ReactCrop
                    crop={qrCrop}
                    onChange={(newCrop) => setQrCrop(newCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                >
                    <img
                    ref={qrImageRef}
                    src={qrCropSrc}
                    alt="Crop me"
                    style={{ maxHeight: '400px' }}
                    onLoad={() => console.log('✅ Image loaded')}
                    />
                </ReactCrop>

                <div style={{ marginTop: 20, textAlign: 'right' }}>
                    <button style={primaryButtonStyle} onClick={handleBankQrCropUpload}>✅ Lưu QR đã cắt</button>
                    <button style={{ ...secondaryButtonStyle, marginLeft: 10 }} onClick={() => setShowQrCropModal(false)}>❌ Huỷ</button>
                </div>
                </div>
            </div>
            )}
        </MainLayout>
    );
};

export default TournamentDetail;


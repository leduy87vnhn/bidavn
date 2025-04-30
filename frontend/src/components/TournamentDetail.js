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

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${id}`)
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

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (error) return <p>{error}</p>;
    if (!tournament) return null;

    return (
        <div style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
            <h2>Chi tiết Giải đấu</h2>
            <p><strong>Tên giải:</strong> {tournament.name}</p>
            <p><strong>Mã giải:</strong> {tournament.code}</p>
            <p><strong>Ngày bắt đầu:</strong> {formatDate(tournament.start_date)}</p>
            <p><strong>Ngày kết thúc:</strong> {formatDate(tournament.end_date)}</p>
            <p><strong>Địa điểm:</strong> {tournament.location}</p>
            <p><strong>Lệ phí:</strong> {parseInt(tournament.attendance_price).toLocaleString('vi-VN')} VNĐ</p>
            <p><strong>Cơ cấu giải thưởng:</strong> {tournament.prize}</p>
            <p><strong>Ngày chọn thi đấu từ:</strong> {formatDate(tournament.registerable_date_start)}</p>
            <p><strong>Ngày chọn thi đấu đến:</strong> {formatDate(tournament.registerable_date_end)}</p>
            <p><strong>Mô tả:</strong> {tournament.description}</p>
            {JSON.parse(localStorage.getItem('user_info'))?.user_type === 2 && (
                <button
                    style={{
                        marginTop: '10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        setEditData(tournament);
                        setShowEditForm(true);
                    }}
                >
                    Sửa
                </button>
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
                {showEditForm && (
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
                )}
            </div>
        </div>
    );
};

export default TournamentDetail;
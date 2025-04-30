import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const TournamentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
            </div>
        </div>
    );
};

export default TournamentDetail;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const TournamentList = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [user, setUser] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [listBackground, setListBackground] = useState(null);
    const [statusFilter, setStatusFilter] = useState('upcoming'); // 'open', 'ongoing', 'ended', 'all'


    const [newTournament, setNewTournament] = useState({
        id: null,
        name: '',
        code: '',
        attendance_price: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, []);

    useEffect(() => {
        const userInfo = localStorage.getItem('user_info');
        if (userInfo) setUser(JSON.parse(userInfo));
    }, []);

    useEffect(() => {
        fetchTournaments();
        fetchListBackground();
    }, [page, statusFilter]);

    const fetchTournaments = () => {
        axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments`, {
            params: {
                page,
                limit,
                status: statusFilter // Gửi thêm status filter
            }
        })
        .then(res => {
            setTournaments(res.data?.data || []);
            setTotal(res.data?.total || 0);
        })
        .catch(err => {
            console.error(err);
            setTournaments([]);
            setTotal(0);
        });
    };

    const getTournamentStatus = (start, end) => {
        const now = new Date();
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (startDate > now) return 'upcoming';
        if (startDate <= now && endDate >= now) return 'ongoing';
        if (endDate < now) return 'ended';
        return 'unknown';
    };

    const fetchListBackground = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/list-background`);
            setListBackground(res.data.filename);
        } catch (error) {
            console.error('Error fetching list background:', error);
        }
    };

    const handleListBackgroundUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const form = new FormData();
        form.append('background', file);
        setUploading(true);

        try {
            await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/upload-list-background`, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('✅ Hình nền danh sách đã được cập nhật!');
            fetchListBackground();
        } catch (err) {
            console.error(err);
            alert('❌ Lỗi khi cập nhật hình nền danh sách.');
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()}`;
    };

    const today = new Date();
    const isPastTournament = (startDate) => {
        return new Date(startDate) < today;
    };

    const handleSave = async () => {
        const start = new Date(newTournament.start_date);
        const end = new Date(newTournament.end_date);

        if (end < start) {
            setMessage('❌ Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        try {
            if (newTournament.id) {
                await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${newTournament.id}`, newTournament);
                setMessage('✅ Cập nhật giải đấu thành công.');
            } else {
                await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments`, newTournament);
                const totalAfter = total + 1;
                const newTotalPages = Math.ceil(totalAfter / limit);
                setPage(newTotalPages);
                setMessage('✅ Thêm giải đấu thành công.');
            }

            setShowForm(false);
            setNewTournament({ id: null, name: '', code: '', start_date: '', end_date: '' });
            fetchTournaments();
        } catch (error) {
            setMessage('❌ Lỗi khi lưu giải: ' + (error.response?.data?.message || 'Server error'));
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc muốn xoá giải đấu này?')) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${id}`);
                fetchTournaments();
                setMessage('✅ Đã xoá giải đấu.');
            } catch (err) {
                setMessage('❌ Lỗi khi xoá giải đấu.');
            } finally {
                setTimeout(() => setMessage(''), 3000);
            }
        }
    };

    const isFormValid =
        newTournament.name &&
        newTournament.code &&
        newTournament.attendance_price &&
        newTournament.start_date &&
        newTournament.end_date &&
        new Date(newTournament.end_date) >= new Date(newTournament.start_date);

    const totalPages = Math.ceil(total / limit);

    return (
        <div
            style={{
                backgroundImage: listBackground
                    ? `url(${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/${listBackground})`
                    : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '100vh',
                padding: '40px 0',
                backdropFilter: 'blur(3px)'
            }}
        >
            <div className="tournament-list-container"
                style={{
                    maxWidth: 1000,
                    margin: '0 auto',
                    padding: 30,
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '16px'
                }}
            >
                <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2>Danh sách giải đấu</h2>
                        {user?.user_type === 2 && (
                            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        setNewTournament({ id: null, name: '', code: '', start_date: '', end_date: '' });
                                        setShowForm(true);
                                    }}
                                >
                                    Thêm Giải Đấu
                                </button>
                                <label
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Tải hình nền
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleListBackgroundUpload}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                {uploading && <span>Đang tải lên...</span>}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {user && <span>Xin chào, <strong>{user.name}</strong></span>}
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user_info');
                                navigate('/login');
                            }}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>

                {message && (
                    <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: message.startsWith('✅') ? '#d4edda' : '#f8d7da',
                        color: message.startsWith('✅') ? '#155724' : '#721c24',
                        border: '1px solid',
                        borderRadius: '5px'
                    }}>
                        {message}
                    </div>
                )}

                {user?.user_type === 2 && showForm && (
                    <div style={{ margin: '20px 0', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                        <h4>{newTournament.id ? 'Cập nhật giải đấu' : 'Thêm giải đấu mới'}</h4>
                        <input type="text" placeholder="Tên giải" value={newTournament.name}
                            onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })} />
                        <input type="text" placeholder="Mã giải" value={newTournament.code}
                            onChange={(e) => setNewTournament({ ...newTournament, code: e.target.value })} />
                        <input type="number" placeholder="Lệ phí (VNĐ)" value={newTournament.attendance_price}
                            onChange={(e) => setNewTournament({ ...newTournament, attendance_price: e.target.value })} />
                        <input type="date" value={newTournament.start_date}
                            onChange={(e) => setNewTournament({ ...newTournament, start_date: e.target.value })} />
                        <input type="date" value={newTournament.end_date}
                            onChange={(e) => setNewTournament({ ...newTournament, end_date: e.target.value })} />
                        <button
                            disabled={!isFormValid}
                            style={{
                                marginTop: '10px',
                                backgroundColor: isFormValid ? '#007bff' : '#ccc',
                                color: 'white',
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: isFormValid ? 'pointer' : 'not-allowed'
                            }}
                            onClick={handleSave}
                        >
                            Lưu
                        </button>
                    </div>
                )}

                {/* Bộ lọc trạng thái giải đấu */}
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label>Lọc theo trạng thái:</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="upcoming">Mở đăng ký</option>
                        <option value="ongoing">Đang diễn ra</option>
                        <option value="ended">Đã kết thúc</option>
                        <option value="all">Toàn bộ</option>
                    </select>
                </div>
                {/* Table danh sách giải */}
                {Array.isArray(tournaments) && tournaments.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Tên giải</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Mã giải</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Nội dung</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Lệ phí (VNĐ)</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Ngày bắt đầu</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Ngày kết thúc</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Địa điểm</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Cơ cấu giải</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Đăng ký</th>
                                    {user?.user_type === 2 && (
                                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Thao tác</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                        {tournaments
                            .map(tour => ({
                                ...tour,
                                status: getTournamentStatus(tour.start_date, tour.end_date)
                            }))
                            .filter(tour => statusFilter === 'all' || tour.status === statusFilter)
                            .sort((a, b) => {
                                const priority = { upcoming: 0, ongoing: 1, ended: 2 };
                                return priority[a.status] - priority[b.status];
                            })
                            .map(tour => {
                                    const isPast = isPastTournament(tour.start_date);

                                    let bgColor = 'white';
                                    if (tour.status === 'ongoing') bgColor = '#d0ebff';     // Xanh da trời nhạt
                                    else if (tour.status === 'ended') bgColor = '#f0f0f0';  // Xám nhạt

                                    return (
                                        <tr key={tour.id} style={{ backgroundColor: bgColor }}>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                                <Link to={`/tournaments/${tour.id}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                                                    {tour.name}
                                                </Link>
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tour.code}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tour.content}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                            {tour.attendance_price != null
                                                ? `${parseInt(tour.attendance_price).toLocaleString('vi-VN')} VNĐ`
                                                : ''}
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(tour.start_date)}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(tour.end_date)}</td>
                                            <td style={{
                                                border: '1px solid #ddd',
                                                padding: '8px',
                                                maxHeight: '100px',
                                                overflowY: 'auto',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word'
                                            }}>
                                                {tour.location}
                                            </td>

                                            <td style={{
                                                border: '1px solid #ddd',
                                                padding: '8px',
                                                maxHeight: '100px',
                                                overflowY: 'auto',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word'
                                            }}>
                                                {tour.prize}
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                                <button
                                                    style={{
                                                    padding: '5px 10px',
                                                    backgroundColor: '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer'
                                                    }}
                                                    onClick={() => navigate(`/tournament/${tour.id}/register`)}
                                                >
                                                    Đăng ký
                                                </button>
                                            </td>
                                            {user?.user_type === 2 && (
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                                    <button
                                                        style={{
                                                            padding: '5px 10px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '5px',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => handleDelete(tour.id)}
                                                    >
                                                        Xóa
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>Không có giải đấu nào.</p>
                )}

                {/* Phân trang */}
                <div style={{ marginTop: '20px' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            style={{
                                margin: '0 5px',
                                padding: '5px 10px',
                                fontWeight: p === page ? 'bold' : 'normal'
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TournamentList;
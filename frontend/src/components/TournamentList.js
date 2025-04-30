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
    }, [page]);

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()}`;
    };
    
    const today = new Date();
    const isPastTournament = (startDate) => {
        return new Date(startDate) < today;
    };

    const fetchTournaments = () => {
        axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments?page=${page}&limit=${limit}`)
            .then(res => {
                console.log('Tournament API response:', res.data);  // 👈 Add this to debug!!
                setTournaments(res.data?.data || []);  // 👈 always fallback to empty array
                setTotal(res.data?.total || 0);
            })
            .catch(err => {
                console.error(err);
                setTournaments([]);  // 👈 On error, fallback
                setTotal(0);
            });
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

    const handleEdit = (tour) => {
        setShowForm(true);
        setNewTournament({
            id: tour.id,
            name: tour.name,
            code: tour.code,
            attendance_price: tour.attendance_price,
            start_date: tour.start_date,
            end_date: tour.end_date
        });
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
        <div className="tournament-list-container" style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Danh sách giải đấu</h2>
                    {user?.user_type === 2 && (
                        <div style={{ marginTop: '10px' }}>
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

            {/* Thông báo */}
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

            {/* Form thêm / sửa giải */}
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

            {/* Danh sách giải */}
            {Array.isArray(tournaments) && tournaments.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Tên giải</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Mã giải</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Lệ phí (VNĐ)</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Ngày khai mạc</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Ngày kết thúc</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Địa điểm</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Cơ cấu giải</th>
                        {user?.user_type === 2 && (
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Thao tác</th>
                        )}
                    </tr>
                    </thead>
                    <tbody>
                        {tournaments.map(tour => {
                            const isPast = isPastTournament(tour.start_date);

                            return (
                            <tr key={tour.id} style={{ backgroundColor: isPast ? '#eee' : 'white' }}>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    <Link to={`/tournaments/${tour.id}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                                        {tour.name}
                                    </Link>
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tour.code}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tour.attendance_price?.toLocaleString('vi-VN')} VNĐ</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(tour.start_date)}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(tour.end_date)}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tour.location}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tour.prize}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', display: 'flex', flexWrap: 'nowrap', gap: '5px', overflowX: 'auto' }}>
                                {/* Đăng ký VĐV */}
                                <button
                                    style={{
                                    padding: '5px 10px',
                                    backgroundColor: isPast ? '#ccc' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: isPast ? 'not-allowed' : 'pointer'
                                    }}
                                    disabled={isPast}
                                    onClick={() => alert(`Đăng ký VĐV cho giải ${tour.name}`)}
                                >
                                    Đăng Ký VĐV
                                </button>

                                {/* Nếu admin */}
                                {user?.user_type === 2 && (
                                    <>
                                    <button
                                        style={{
                                        padding: '5px 10px',
                                        backgroundColor: isPast ? '#ccc' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: isPast ? 'not-allowed' : 'pointer'
                                        }}
                                        disabled={isPast}
                                        onClick={() => alert(`Đăng ký Trọng Tài cho giải ${tour.name}`)}
                                    >
                                        Đăng Ký Trọng Tài
                                    </button>

                                    {/* <button
                                        style={{
                                        padding: '5px 10px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                        }}
                                        onClick={() => handleEdit(tour)}
                                    >
                                        Sửa
                                    </button> */}

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
                                    </>
                                )}
                                </td>
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
    );
};

export default TournamentList;
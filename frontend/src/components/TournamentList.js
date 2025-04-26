import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TournamentList = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [user, setUser] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [total, setTotal] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState('');
    const [newTournament, setNewTournament] = useState({
        id: null,
        name: '',
        code: '',
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

    const fetchTournaments = () => {
        axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments?page=${page}&limit=${limit}`)
            .then(res => {
                setTournaments(res.data.data);
                setTotal(res.data.total);
            })
            .catch(err => console.error(err));
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
        newTournament.start_date &&
        newTournament.end_date &&
        new Date(newTournament.end_date) >= new Date(newTournament.start_date);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="tournament-list-container" style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Danh sách giải đấu</h2>
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
                    {user?.user_type === 2 && (
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
                    )}
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
            {tournaments.map(tour => (
                <div className="tournament-card" key={tour.id} style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, marginBottom: 10 }}>
                    <h3>{tour.name} ({tour.code})</h3>
                    <p>{tour.start_date} → {tour.end_date}</p>

                    {user?.user_type === 2 && (
                        <div>
                            <button onClick={() => alert(`Thêm VĐV cho giải ${tour.id}`)}>Thêm VĐV</button>
                            <button onClick={() => alert(`Thêm Trọng Tài cho giải ${tour.id}`)}>Thêm Trọng Tài</button>
                            <button onClick={() => handleEdit(tour)}>Sửa</button>
                            <button onClick={() => handleDelete(tour.id)}>Xoá</button>
                        </div>
                    )}
                </div>
            ))}

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
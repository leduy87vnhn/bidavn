import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import AddTournamentGroupModal from '../components/AddTournamentGroupModal';
import '../tournament.scss';

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
    const [statusFilter, setStatusFilter] = useState('not_ended'); // 'open', 'ongoing', 'ended', 'all'
    const [logoFile, setLogoFile] = useState(null);
    const [groupSuggestions, setGroupSuggestions] = useState([]);
    const [groupNameInput, setGroupNameInput] = useState('');
    const [showGroupPopup, setShowGroupPopup] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);


    const [newTournament, setNewTournament] = useState({
        id: null,
        name: '',
        code: '',
        attendance_fee_common: '',
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

    useEffect(() => {
        fetchLogo();
    }, []);

    const fetchLogo = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/logo`);
            setLogoFile(res.data.filename);
        } catch (error) {
            console.error('Error fetching logo:', error);
        }
    };

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

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const form = new FormData();
        form.append('logo', file);

        try {
            await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/upload-logo`, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('✅ Logo đã được cập nhật!');
            fetchLogo();
        } catch (err) {
            console.error(err);
            alert('❌ Lỗi khi tải lên logo.');
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
            const payload = {
                ...newTournament,
                group_id: newTournament.group_id || null  // đảm bảo luôn có field group_id
            };

            if (newTournament.id) {
                await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${newTournament.id}`, payload);
                setMessage('✅ Cập nhật giải đấu thành công.');
            } else {
                await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments`, payload);
                const totalAfter = total + 1;
                const newTotalPages = Math.ceil(totalAfter / limit);
                setPage(newTotalPages);
                setMessage('✅ Thêm giải đấu thành công.');
            }

            setShowForm(false);
            setNewTournament({ id: null, name: '', code: '', attendance_fee_common: '', start_date: '', end_date: '', group_id: null });
            setGroupNameInput('');
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

    const handleGroupCreated = (group) => {
        // Tự động gán tên vào input, gọi lại fetchGroupSuggestions nếu cần
        if (group && group.tournament_name) {
            setGroupNameInput(group.tournament_name);
            fetchGroupSuggestions(group.tournament_name);
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (window.confirm('Bạn có chắc muốn xóa nhóm giải này?')) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/tournament-group/${groupId}`);
                alert('✅ Đã xoá nhóm giải.');
                fetchTournaments();
            } catch (err) {
                console.error(err);
                alert('❌ Lỗi khi xóa nhóm giải.');
            }
        }
    };

    const fetchGroupSuggestions = async (text) => {
        if (text.length < 3) {
            setGroupSuggestions([]);
            return;
        }
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/groups?search=${text}`);
            setGroupSuggestions(res.data);
        } catch (error) {
            console.error('Error fetching group suggestions:', error);
        }
    };

    const groupedTournaments = tournaments.reduce((groups, tour) => {
        const gid = tour.group_id || 'ungrouped';
        if (!groups[gid]) {
            groups[gid] = {
                group_id: tour.group_id,
                group_name: tour.group_name || 'Không thuộc nhóm',
                group_start_date: tour.group_start_date,
                group_end_date: tour.group_end_date,
                tournaments: []
            };
        }
        groups[gid].tournaments.push(tour);
        return groups;
    }, {});

    const isFormValid =
        newTournament.name &&
        newTournament.code &&
        newTournament.attendance_fee_common &&
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
                        {logoFile && (
                            <img
                                src={`${process.env.REACT_APP_API_BASE_URL}/uploads/logos/${logoFile}`}
                                alt="Logo"
                                style={{ height: 60, objectFit: 'contain', marginRight: 20 }}
                            />
                        )}
                        <h2>Danh sách giải đấu</h2>
                        {user?.user_type === 2 && (
                            <div className="top-action-group">
                                <button className="top-action-button teal" onClick={() => setShowGroupPopup(true)}>
                                    Thêm Giải Đấu
                                </button>

                                <button className="top-action-button primary" onClick={() => {
                                    setNewTournament({ id: null, name: '', code: '', start_date: '', end_date: '' });
                                    setShowForm(true);
                                }}>
                                    Thêm Nội Dung
                                </button>

                                <label className="top-action-button success" style={{ position: 'relative' }}>
                                    <span>Tải hình nền</span>
                                    <input type="file" accept="image/*" onChange={handleListBackgroundUpload} />
                                </label>

                                <label className="top-action-button warning" style={{ position: 'relative' }}>
                                    <span>Tải Logo</span>
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} />
                                </label>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
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

                        <Link
                            to="/players"
                            style={{
                                color: '#007bff',
                                textDecoration: 'underline',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}
                        >
                            Bảng xếp hạng Carom - Pool HBSF
                        </Link>
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
                        <input
                            type="text"
                            placeholder="Tên giải (gõ ≥ 3 ký tự)"
                            value={groupNameInput}
                            onChange={(e) => {
                                const text = e.target.value;
                                setGroupNameInput(text);
                                fetchGroupSuggestions(text);
                            }}
                            style={{ marginBottom: '5px' }}
                        />
                        {groupSuggestions.length > 0 && (
                            <ul style={{
                                listStyle: 'none',
                                padding: '5px',
                                margin: '0 0 10px 0',
                                backgroundColor: '#fff',
                                border: '1px solid #ccc',
                                maxHeight: '150px',
                                overflowY: 'auto'
                            }}>
                                {groupSuggestions.map(group => (
                                    <li
                                        key={group.id}
                                        style={{ padding: '5px', cursor: 'pointer' }}
                                        onClick={() => {
                                            setNewTournament({ ...newTournament, group_id: group.id });
                                            setGroupNameInput(group.tournament_name);
                                            setGroupSuggestions([]);
                                        }}
                                    >
                                        {group.tournament_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <input type="text" placeholder="Tên nội dung" value={newTournament.name}
                            onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })} />
                        <input type="text" placeholder="Mã giải" value={newTournament.code}
                            onChange={(e) => setNewTournament({ ...newTournament, code: e.target.value })} />
                        <input type="number" placeholder="Lệ phí (VNĐ)" value={newTournament.attendance_fee_common}
                            onChange={(e) => setNewTournament({ ...newTournament, attendance_fee_common: e.target.value })} />
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

                <AddTournamentGroupModal
                    isOpen={showGroupPopup}
                    onClose={() => {
                        setShowGroupPopup(false);
                        setEditingGroup(null); // reset
                    }}
                    onGroupCreated={handleGroupCreated}
                    initialData={editingGroup}
                />

                {/* Bộ lọc trạng thái giải đấu */}
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label>Lọc theo trạng thái:</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="upcoming">Mở đăng ký</option>
                        <option value="ongoing">Đang diễn ra</option>
                        <option value="ended">Đã kết thúc</option>                    
                        <option value="not_ended">Chưa kết thúc</option> {/* 👈 thêm dòng này */}
                        <option value="all">Toàn bộ</option>
                    </select>
                </div>
                {/* Table danh sách giải */}
                {Array.isArray(tournaments) && tournaments.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                            <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Tên nội dung</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Lệ phí (VNĐ)</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Địa điểm</th>
                                {user?.user_type === 2 && (
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Thao tác</th>
                                )}
                            </tr>
                            </thead>
                            <tbody>
                            {Object.values(groupedTournaments).map(group => (
                                <React.Fragment key={group.group_id || 'ungrouped'}>
                                <tr>
                                    <td colSpan={user?.user_type === 2 ? 4 : 3} style={{
                                    backgroundColor: '#dbeafe',
                                    fontWeight: 'bold',
                                    padding: '10px',
                                    border: '1px solid #ccc',
                                    whiteSpace: 'pre-line'
                                    }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                        Giải đấu: {group.group_id ? (
                                            <Link
                                                to={`/tournament-group/${group.group_id}`}
                                                style={{
                                                    color: '#007bff',
                                                    textDecoration: 'underline',
                                                    fontWeight: 'bold',
                                                    fontSize: '20px',
                                                    cursor: 'pointer'
                                                }}
                                                >
                                                {group.group_name}
                                            </Link>
                                        ) : (
                                            group.group_name
                                        )}
                                        {"\n"}
                                        Thời gian: {formatDate(group.group_start_date)} đến {formatDate(group.group_end_date)}
                                        </div>

                                        {user?.user_type === 2 && group.group_id && (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                            className="edit"
                                            onClick={() => {
                                                setEditingGroup({
                                                id: group.group_id,
                                                tournament_name: group.group_name,
                                                start_date: group.group_start_date,
                                                end_date: group.group_end_date
                                                });
                                                setShowGroupPopup(true);
                                            }}
                                            >
                                            ✏️ Sửa
                                            </button>
                                            <button
                                            style={{
                                                backgroundColor: '#dc3545',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '5px 10px',
                                                borderRadius: '5px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleDeleteGroup(group.group_id)}
                                            >
                                            🗑 Xóa
                                            </button>
                                        </div>
                                        )}
                                    </div>
                                    </td>
                                </tr>

                                {group.tournaments.map(tour => {
                                    const status = getTournamentStatus(tour.start_date, tour.end_date);
                                    let bgColor = 'white';
                                    if (status === 'ongoing') bgColor = '#d0ebff';
                                    else if (status === 'ended') bgColor = '#f0f0f0';

                                    return (
                                    <tr key={tour.id} style={{ backgroundColor: bgColor }}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        <div>
                                            {/* <Link to={`/tournaments/${tour.id}`} style={{ color: '#007bff', textDecoration: 'none', fontWeight: 600 }}> */}
                                            {tour.name}
                                            {/* </Link> */}
                                        </div>
                                        {typeof tour.approved_competitors_count !== 'undefined' && (
                                            <div onClick={() => navigate(`/tournament/${tour.id}/competitors`)} style={{
                                            marginTop: '4px',
                                            display: 'inline-block',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '5px',
                                            fontSize: '13px',
                                            cursor: 'pointer'
                                            }}>
                                            🧑‍🎱 {tour.approved_competitors_count} VĐV
                                            </div>
                                        )}
                                        </td>
                                        {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tour.content}</td> */}
                                        <td style={{ border: '1px solid #ddd', padding: '8px', whiteSpace: 'pre-line' }}>
                                        {tour.attendance_fee_common ? `Lệ phí chung: ${parseInt(tour.attendance_fee_common).toLocaleString('vi-VN')} VNĐ\n` : ''}
                                        {tour.attendance_fee_rank1 && tour.rank1
                                            ? `Lệ phí rank ${tour.rank1} trở lên: ${parseInt(tour.attendance_fee_rank1).toLocaleString('vi-VN')} VNĐ\n`
                                            : ''}
                                        {tour.attendance_fee_rank2 && tour.rank2
                                            ? `Lệ phí rank ${tour.rank2} trở lên: ${parseInt(tour.attendance_fee_rank2).toLocaleString('vi-VN')} VNĐ\n`
                                            : ''}
                                        {tour.attendance_fee_rank3 && tour.rank3
                                            ? `Lệ phí rank ${tour.rank3} trở lên: ${parseInt(tour.attendance_fee_rank3).toLocaleString('vi-VN')} VNĐ`
                                            : ''}
                                        </td>
                                        {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(tour.start_date)}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(tour.end_date)}</td> */}
                                        <td style={{
                                            border: '1px solid #ddd',
                                            padding: '8px',
                                            maxHeight: '100px',
                                            overflowY: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}>{tour.location}</td>
                                        {/* <td style={{
                                            border: '1px solid #ddd',
                                            padding: '8px',
                                            maxHeight: '100px',
                                            overflowY: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}>{tour.prize}</td> */}

                                        <td style={{
                                            border: '1px solid #ddd',
                                            padding: '8px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '6px'
                                        }}>
                                        {/* Đăng ký lẻ: ai cũng thấy */}
                                        <button
                                            className="teal"
                                            onClick={() => navigate(`/tournament/${tour.id}/register-single`)}
                                        >
                                            Đăng ký thi đấu
                                        </button>

                                        {/* Danh sách VĐV: ai cũng thấy */}
                                        <button
                                            className="primary"
                                            onClick={() => navigate(`/tournament/${tour.id}/competitors`)}
                                        >
                                            Danh sách VĐV
                                        </button>

                                        {/* Phê duyệt: chỉ Admin */}
                                        {user?.user_type === 2 && (
                                            <button
                                            className="primary"
                                            onClick={() => navigate(`/registrations?tournament=${encodeURIComponent(tour.name)}`)}
                                            >
                                            Phê duyệt
                                            </button>
                                        )}

                                        {/* Xóa: chỉ Admin */}
                                        {user?.user_type === 2 && (
                                            <button
                                            className="danger"
                                            onClick={() => handleDelete(tour.id)}
                                            >
                                            Xóa
                                            </button>
                                        )}
                                        </td>
                                    </tr>
                                    );
                                })}
                                </React.Fragment>
                            ))}
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
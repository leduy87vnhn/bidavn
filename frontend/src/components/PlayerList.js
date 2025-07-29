import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import MainPageMenuBar from '../components/MainPageMenuBar';
import MainPageHeader from '../components/MainPageHeader';
import AddPlayerModal from '../components/AddPlayerModal';
import EditPlayerModal from '../components/EditPlayerModal';
import PlayerTableRow from '../components/PlayerTableRow';
import '../css/playerList.scss';

const PlayerList = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);
    const [filter, setFilter] = useState({
    id: '',
    name: '',
    ranking: '',
    pool_ranking: '',
    phone: ''
    });
    const [newPlayer, setNewPlayer] = useState({ id: '', name: '', phone: '', ranking: '', points: '' });
    const [message, setMessage] = useState('');
    const [user, setUser] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [sortConfig, setSortConfig] = useState({ key: 'ranking', direction: 'asc' });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const buttonStyle = {
        padding: '6px 14px',
        fontSize: '14px',
        border: 'none',
        borderRadius: 5,
        cursor: 'pointer'
    };

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user_info'));
        fetchPlayers();
        if (!userInfo) {
            //navigate('/login');
        } else {
            setUser(userInfo);
        }
    }, []);

    const isAdmin = user?.user_type === 2;

    const fetchPlayers = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players`);
            setPlayers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleInput = (e) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
    };

    const handleCancel = () => {
        setShowForm(false);
        setNewPlayer({ id: '', name: '', phone: '', ranking: '', points: '' });
    };

    const handleSave = async () => {
        try {
            const now = new Date().toISOString();
            const newEntry = { ...newPlayer, created_date: now, modified_date: now };
            await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/players`, newEntry);
            setMessage('✅ Đã thêm VĐV');
            setNewPlayer({ id: '', name: '', phone: '', ranking: '', points: '' });
            fetchPlayers();
        } catch (err) {
            console.error(err);
            setMessage('❌ Lỗi khi thêm VĐV');
        }
    };

    const handleUpdate = async (id) => {
        try {
            const now = new Date().toISOString();
            const player = players.find(p => p.id === id);
            await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/players/${id}`, {
                ...player,
                modified_date: now
            });
            setMessage('✅ Đã cập nhật VĐV');
            setEditingId(null);
            fetchPlayers();
        } catch (err) {
            console.error(err);
            setMessage('❌ Lỗi khi cập nhật');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xoá VĐV này?')) return;
        try {
            await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/players/${id}`);
            setMessage('✅ Đã xoá');
            fetchPlayers();
        } catch (err) {
            console.error(err);
            setMessage('❌ Lỗi khi xoá');
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const wb = XLSX.read(evt.target.result, { type: 'binary' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const now = new Date().toISOString();

            const parseNumber = (val) => {
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            };

            const newPlayers = rows.slice(1) // bỏ header
            .filter(row => row[0] || row[1]) // chỉ giữ dòng có ID hoặc Tên
            .map(row => {
                let id = String(row[0] || '').trim();
                if (/^H\d{4}$/.test(id)) {
                    id = 'H0' + id.slice(1);
                }

                return {
                    id,
                    name: row[1] || '',
                    phone: row[2] || 'unknown',
                    ranking: parseNumber(row[3]),
                    points: parseNumber(row[4]),
                    pool_ranking: parseNumber(row[5]),
                    pool_points: parseNumber(row[6]),
                    created_date: now,
                    modified_date: now
                };
            });

            try {
                await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/players/import`, newPlayers);
                setMessage('✅ Đã import danh sách');
                fetchPlayers();
            } catch (err) {
                console.error(err);
                setMessage('❌ Import thất bại');
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleNormalizeNames = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn CHUẨN HÓA toàn bộ tên VĐV thành chữ IN HOA?")) return;

        try {
            await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/players/normalize-names`);
            setMessage("✅ Đã chuẩn hoá tên VĐV");
            fetchPlayers();
        } catch (err) {
            console.error(err);
            setMessage("❌ Lỗi khi chuẩn hoá tên");
        }
    };

    const filteredPlayers = players.filter(p =>
        p.id.includes(filter.id) &&
        p.name.toLowerCase().includes(filter.name.toLowerCase()) &&
        p.phone.includes(filter.phone) &&
        (filter.ranking === '' || String(p.ranking) === filter.ranking) &&
        (filter.pool_ranking === '' || String(p.pool_ranking) === filter.pool_ranking)
    );
    const totalPages = Math.ceil(filteredPlayers.length / limit);
    //const currentPagePlayers = filteredPlayers.slice((page - 1) * limit, page * limit);

    const exportToExcel = () => {
        const genderText = (val) => ['Nam', 'Nữ', 'Chưa rõ'][val] || '';
        const memberStatusText = (val) => ['Tự do', 'Đăng ký', 'Hội viên'][val] || '';
        const feeText = (val) => ['Chưa đóng', 'Đã đóng'][val] || '';
        const disciplineText = (val) => ['Carom', 'Pool'][val] || '';

        const exportData = [...filteredPlayers]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(p => ({
            'ID': p.id,
            'Tên': p.name,
            'SĐT': p.phone,
            'Giới tính': genderText(p.gender),
            'Ngày sinh': p.birth_day ? new Date(p.birth_day).toLocaleDateString('vi-VN') : '',
            'CCCD/Hộ chiếu': p.citizen_id_passport || '',
            'Hội viên': memberStatusText(p.member_status),
            'Hội phí': feeText(p.member_fee_status),
            'Địa chỉ': p.address || '',
            'Đơn vị thi đấu': p.competition_unit || '',
            'Ngày tham gia': p.joined_date ? new Date(p.joined_date).toLocaleDateString('vi-VN') : '',
            'Nội dung thi đấu': disciplineText(p.discipline),
            'Hạng Carom': p.ranking,
            'Điểm Carom': p.points,
            'Hạng Pool': p.pool_ranking,
            'Điểm Pool': p.pool_points
            }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách VĐV");

        XLSX.writeFile(workbook, "Danh_sach_VDV.xlsx");
    };

    const maskPhone = (phone) => {
        if (!phone || phone.length < 3) return '***';
        return '*'.repeat(phone.length - 3) + phone.slice(-3);
    };

    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        const { key, direction } = sortConfig;
    
        const compareValues = (valA, valB) => {
            const isEmpty = (v) => v === null || v === '' || typeof v === 'undefined';
            if (isEmpty(valA) && !isEmpty(valB)) return 1;
            if (!isEmpty(valA) && isEmpty(valB)) return -1;
            if (valA < valB) return -1;
            if (valA > valB) return 1;
            return 0;
        };
    
        let valA = a[key];
        let valB = b[key];
    
        const numericFields = ['ranking', 'points', 'pool_ranking', 'pool_points'];
        if (numericFields.includes(key)) {
            valA = valA === null || valA === undefined ? null : Number(valA);
            valB = valB === null || valB === undefined ? null : Number(valB);
        } else {
            valA = (valA ?? '').toString().trim().toLowerCase();
            valB = (valB ?? '').toString().trim().toLowerCase();
        }
    
        let primary = compareValues(valA, valB);
        if (primary !== 0) return direction === 'asc' ? primary : -primary;
    
        // Nếu bằng nhau → fallback sort theo hạng Pool
        if (key === 'ranking') {
            let fallbackA = a.pool_ranking ?? null;
            let fallbackB = b.pool_ranking ?? null;
            fallbackA = fallbackA === null ? 9999 : Number(fallbackA);
            fallbackB = fallbackB === null ? 9999 : Number(fallbackB);
            return direction === 'asc' ? fallbackA - fallbackB : fallbackB - fallbackA;
        }
    
        return 0;
    });

    const currentPagePlayers = sortedPlayers.slice((page - 1) * limit, page * limit);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
        setPage(1); // 👈 reset về trang 1
    };

    return (
        <>
        <div style={{ position: 'relative', zIndex: 1000 }}>
            <MainPageHeader />
            <MainPageMenuBar />
        </div>
        <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
            <h2>Bảng xếp hạng Carom - Pool HBSF</h2>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input placeholder="ID" name="id" value={filter.id} onChange={handleInput} style={{ flex: 1, padding: 8, borderRadius: 5, border: '1px solid #ccc' }} />
                <input placeholder="Tên" name="name" value={filter.name} onChange={handleInput} style={{ flex: 1, padding: 8, borderRadius: 5, border: '1px solid #ccc' }} />
                <input placeholder="SĐT" name="phone" value={filter.phone} onChange={handleInput} style={{ flex: 1, padding: 8, borderRadius: 5, border: '1px solid #ccc' }} />
                <input
                placeholder="Hạng Carom"
                name="ranking"
                value={filter.ranking}
                onChange={handleInput}
                style={{ flex: 1, padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
                />
                <input
                placeholder="Hạng Pool"
                name="pool_ranking"
                value={filter.pool_ranking}
                onChange={handleInput}
                style={{ flex: 1, padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
                />
            </div>

            <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
                <button
                    onClick={fetchPlayers}
                    style={{ backgroundColor: '#007bff', color: '#fff', padding: '6px 14px', border: 'none', borderRadius: 5 }}
                >Tìm kiếm</button>

                <button
                    onClick={() => setFilter({ id: '', name: '', ranking: '', pool_ranking: '', phone: '' })}
                    style={{ backgroundColor: '#6c757d', color: '#fff', padding: '6px 14px', border: 'none', borderRadius: 5 }}
                >❌ Huỷ Tìm Kiếm</button>

                {user?.user_type === 2 && (
                    <>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            style={{ backgroundColor: '#007bff', color: '#fff', padding: '6px 14px', border: 'none', borderRadius: 5 }}
                        >{showForm ? 'Đóng Form' : 'Thêm VĐV'}</button>

                        <label style={{ cursor: 'pointer' }}>
                            <input type="file" accept=".xlsx" onChange={handleImport} style={{ display: 'none' }} />
                            <span style={{ backgroundColor: '#007bff', color: 'white', padding: '6px 14px', borderRadius: 5 }}>
                                Import Excel
                            </span>
                        </label>

                        <button
                            onClick={exportToExcel}
                            style={{ backgroundColor: '#28a745', color: '#fff', padding: '6px 14px', border: 'none', borderRadius: 5 }}
                        >
                            Export Excel
                        </button>
                    </>
                )}

                <button
                    onClick={() => navigate('/tournament_events')}
                    style={{
                        backgroundColor: '#6c757d',
                        color: '#fff',
                        padding: '6px 14px',
                        border: 'none',
                        borderRadius: 5
                    }}
                >
                    ⬅️ Quay về danh sách giải
                </button>
            </div>
            <div className="table-scroll-wrapper">
                <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', marginTop: 10 }}>
                    {/* <thead>
                        <tr>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                                ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Tên</th>
                            <th>SĐT</th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ranking')}>
                                Hạng Carom {sortConfig.key === 'ranking' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('points')}>
                                Điểm Carom {sortConfig.key === 'points' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('pool_ranking')}>
                                Hạng Pool {sortConfig.key === 'pool_ranking' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('pool_points')}>
                                Điểm Pool {sortConfig.key === 'pool_points' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Thao tác</th>
                        </tr>
                    </thead> */}
                    <thead>
                        <tr>
                            <th className="sticky-col col-id" onClick={() => handleSort('id')}>
                            ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="sticky-col col-name" style={{ zIndex: 10 }}>Tên</th>
                            <th className="sticky-col col-phone" style={{ zIndex: 10 }}>SĐT</th>

                            {isAdmin && (
                            <>
                                <th>Giới tính</th>
                                <th>Ngày sinh</th>
                                <th>CCCD/Hộ chiếu</th>
                                <th>Thành viên</th>
                                <th>Hội phí</th>
                                <th>Địa chỉ</th>
                                <th>Đơn vị</th>
                                <th>Ngày tham gia</th>
                                <th>Nội dung</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ranking')}>
                                Hạng Carom {sortConfig.key === 'ranking' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('points')}>
                                Điểm Carom {sortConfig.key === 'points' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('pool_ranking')}>
                                Hạng Pool {sortConfig.key === 'pool_ranking' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('pool_points')}>
                                Điểm Pool {sortConfig.key === 'pool_points' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Ảnh CCCD trước</th>
                                <th>Ảnh CCCD sau</th>
                                <th>Ảnh 4x6</th>
                            </>
                            )}

                            {isAdmin && <th>Thao tác</th>}
                        </tr>
                    </thead>
                    {/* <tbody>
                        {currentPagePlayers.map(p => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>
                                    {editingId === p.id ? (
                                        <input value={p.name} onChange={e => setPlayers(players.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))} />
                                    ) : p.name}
                                </td>
                                <td>
                                    {editingId === p.id ? (
                                        <input value={p.phone} onChange={e => setPlayers(players.map(x => x.id === p.id ? { ...x, phone: e.target.value } : x))} />
                                    ) : (
                                        user?.user_type === 2 ? p.phone : maskPhone(p.phone)  // 👈 Che số nếu không phải admin
                                    )}
                                </td>
                                <td>
                                    {editingId === p.id ? (
                                        <input value={p.ranking} onChange={e => setPlayers(players.map(x => x.id === p.id ? { ...x, ranking: e.target.value } : x))} />
                                    ) : p.ranking}
                                </td>
                                <td>
                                    {editingId === p.id ? (
                                        <input value={p.points} onChange={e => setPlayers(players.map(x => x.id === p.id ? { ...x, points: e.target.value } : x))} />
                                    ) : p.points}
                                </td>
                                <td>
                                {editingId === p.id ? (
                                    <input value={p.pool_ranking} onChange={e => setPlayers(players.map(x => x.id === p.id ? { ...x, pool_ranking: e.target.value } : x))} />
                                ) : p.pool_ranking}
                                </td>
                                <td>
                                {editingId === p.id ? (
                                    <input value={p.pool_points} onChange={e => setPlayers(players.map(x => x.id === p.id ? { ...x, pool_points: e.target.value } : x))} />
                                ) : p.pool_points}
                                </td>
                                <td>
                                    {editingId === p.id ? (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                onClick={() => handleUpdate(p.id)}
                                                style={{
                                                    backgroundColor: '#007bff',
                                                    color: 'white',
                                                    padding: '4px 10px',
                                                    border: 'none',
                                                    borderRadius: 5
                                                }}
                                            >
                                                Lưu
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                style={{
                                                    padding: '4px 10px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 5
                                                }}
                                            >
                                                Huỷ
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                onClick={() => setEditingId(p.id)}
                                                style={{
                                                    backgroundColor: '#007bff',
                                                    color: 'white',
                                                    padding: '4px 10px',
                                                    border: 'none',
                                                    borderRadius: 5
                                                }}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                style={{
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    padding: '4px 10px',
                                                    border: 'none',
                                                    borderRadius: 5
                                                }}
                                            >
                                                Xoá
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody> */}
                    <tbody>
                    {currentPagePlayers.map(player => (
                        <PlayerTableRow
                            key={player.id}
                            player={player}
                            isAdmin={user?.user_type === 2}
                            onUpdated={fetchPlayers}
                            onDeleted={handleDelete}
                            onApproved={fetchPlayers}
                            onEditClick={(player) => {
                                setSelectedPlayer(player);
                                setEditModalOpen(true);
                            }}
                        />
                    ))}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: 20, textAlign: 'center' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                        key={p}
                        onClick={() => setPage(p)}
                        style={{
                            margin: '0 4px',
                            padding: '6px 12px',
                            backgroundColor: p === page ? '#007bff' : '#f0f0f0',
                            color: p === page ? '#fff' : '#000',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                        }}
                    >
                        {p}
                    </button>
                ))}
            </div>
            {user?.user_type === 2 && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                onClick={handleNormalizeNames}
                style={{
                    backgroundColor: '#ffc107',
                    color: '#000',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
                >
                🔠 Chuẩn Hóa Tên VĐV
                </button>
            </div>
            )}

            {/* {showForm && (
                <div style={{ marginTop: 30 }}>
                    <h4>Thêm VĐV mới</h4>
                    <input placeholder="Tên" value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} style={{ marginRight: 10 }} />
                    <input placeholder="SĐT" value={newPlayer.phone} onChange={e => setNewPlayer({ ...newPlayer, phone: e.target.value })} style={{ marginRight: 10 }} />
                    <input placeholder="Ranking" value={newPlayer.ranking} onChange={e => setNewPlayer({ ...newPlayer, ranking: e.target.value })} style={{ marginRight: 10 }} />
                    <input placeholder="Points" value={newPlayer.points} onChange={e => setNewPlayer({ ...newPlayer, points: e.target.value })} style={{ marginRight: 10 }} />
                    <button
                        onClick={handleSave}
                        style={{ backgroundColor: '#007bff', color: 'white', padding: '6px 14px', border: 'none', borderRadius: 5, marginRight: 10 }}
                    >Lưu</button>
                    <button
                        onClick={handleCancel}
                        style={{ backgroundColor: '#6c757d', color: 'white', padding: '6px 14px', border: 'none', borderRadius: 5 }}
                    >Huỷ</button>
                </div>
            )} */}
            <AddPlayerModal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                onConfirm={async (newPlayer) => {
                    try {
                    const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players`);
                    const maxId = res.data.reduce((max, p) => {
                        const num = parseInt((p.id || '').replace(/[^\d]/g, ''), 10);
                        return isNaN(num) ? max : Math.max(max, num);
                    }, 0);
                    const nextId = 'V' + String(maxId + 1).padStart(4, '0');

                    const now = new Date().toISOString();
                    const playerWithId = {
                        ...newPlayer,
                        id: nextId,
                        created_date: now,
                        modified_date: now,
                    };

                    await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/players`, playerWithId);
                    setMessage('✅ Đã thêm VĐV');
                    fetchPlayers();
                    setShowForm(false);
                    } catch (err) {
                    console.error(err);
                    setMessage('❌ Lỗi khi thêm VĐV');
                    }
                }}
            />
            <EditPlayerModal
            isOpen={editModalOpen}
            player={selectedPlayer}
            onClose={() => setEditModalOpen(false)}
            onConfirm={async (updated) => {
                try {
                await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/players/${updated.id}`, updated);
                setMessage('✅ Đã cập nhật VĐV');
                fetchPlayers();
                setEditModalOpen(false);
                } catch (err) {
                console.error(err);
                setMessage('❌ Lỗi khi cập nhật');
                }
            }}
            />


            {message && <p style={{ marginTop: 10 }}>{message}</p>}
        </div>
        </>
    );
};

export default PlayerList;
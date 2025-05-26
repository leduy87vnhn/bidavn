import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

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
    const buttonStyle = {
        padding: '6px 14px',
        fontSize: '14px',
        border: 'none',
        borderRadius: 5,
        cursor: 'pointer'
    };

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user_info'));
        if (!userInfo || userInfo.user_type !== 2) {
            navigate('/login');
        } else {
            setUser(userInfo);
            fetchPlayers();
        }
    }, []);

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

    const filteredPlayers = players.filter(p =>
    p.id.includes(filter.id) &&
    p.name.toLowerCase().includes(filter.name.toLowerCase()) &&
    p.phone.includes(filter.phone) &&
    (filter.ranking === '' || String(p.ranking) === filter.ranking) &&
    (filter.pool_ranking === '' || String(p.pool_ranking) === filter.pool_ranking)
    );
    const totalPages = Math.ceil(filteredPlayers.length / limit);
    const currentPagePlayers = filteredPlayers.slice((page - 1) * limit, page * limit);

    const exportToExcel = () => {
        const exportData = filteredPlayers.map(p => ({
            ID: p.id,
            Tên: p.name,
            'SĐT': p.phone,
            'Hạng Carom': p.ranking,
            'Điểm Carom': p.points,
            'Hạng Pool': p.pool_ranking,
            'Điểm Pool': p.pool_points
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "VĐV");

        XLSX.writeFile(workbook, "Danh_sach_VDV.xlsx");
    };

    return (
        <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
            <h2>Danh sách VĐV</h2>

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
                <button
                onClick={() => navigate('/tournaments')}
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

            <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', marginTop: 10 }}>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>SĐT</th>
                    <th>Hạng Carom</th>
                    <th>Điểm Carom</th>
                    <th>Hạng Pool</th>
                    <th>Điểm Pool</th>
                    <th>Thao tác</th>
                </tr>
                </thead>
                <tbody>
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
                                ) : p.phone}
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
                                    <>
                                        <button onClick={() => handleUpdate(p.id)} style={{ backgroundColor: '#007bff', color: 'white', padding: '4px 10px', marginRight: 5, border: 'none', borderRadius: 5 }}>Lưu</button>
                                        <button onClick={() => setEditingId(null)} style={{ padding: '4px 10px' }}>Huỷ</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setEditingId(p.id)} style={{ backgroundColor: '#007bff', color: 'white', padding: '4px 10px', marginRight: 5, border: 'none', borderRadius: 5 }}>Sửa</button>
                                        <button onClick={() => handleDelete(p.id)} style={{ backgroundColor: '#dc3545', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 5 }}>Xoá</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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

            {showForm && (
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
            )}

            {message && <p style={{ marginTop: 10 }}>{message}</p>}
        </div>
    );
};

export default PlayerList;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const PlayerList = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);
    const [filter, setFilter] = useState({ id: '', name: '', ranking: '', phone: '' });
    const [newPlayer, setNewPlayer] = useState({ id: '', name: '', phone: '', ranking: '', points: '' });
    const [message, setMessage] = useState('');
    const [user, setUser] = useState(null);
    const [editingId, setEditingId] = useState(null);

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

    const filteredPlayers = players.filter(p =>
        p.id.includes(filter.id) &&
        p.name.toLowerCase().includes(filter.name.toLowerCase()) &&
        p.phone.includes(filter.phone) &&
        (filter.ranking === '' || String(p.ranking) === filter.ranking)
    );

    const generateNewId = () => {
        const ids = players.map(p => parseInt(p.id.replace('H', '')) || 0);
        const max = Math.max(...ids, 10000);
        return 'H' + (max + 1);
    };

    const handleSave = async () => {
        try {
            const now = new Date().toISOString();
            const newEntry = { ...newPlayer, created_date: now, modified_date: now };
            if (!newEntry.id) newEntry.id = generateNewId();
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
            const newPlayers = rows.slice(1).map(row => {
                let id = String(row[2] || '').trim();
                if (/^H\d{4}$/.test(id)) {
                    id = 'H0' + id.slice(1);
                }
                return {
                    ranking: row[0],
                    name: row[1],
                    id,
                    phone: row[3] || 'unknown',
                    points: row[4],
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

    const inputStyle = { padding: '8px', borderRadius: 5, border: '1px solid #ccc', flex: 1 };

    return (
        <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
            <h2>Danh sách VĐV</h2>

            {/* Điều kiện lọc */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input placeholder="ID" name="id" value={filter.id} onChange={handleInput} style={inputStyle} />
                <input placeholder="Tên" name="name" value={filter.name} onChange={handleInput} style={inputStyle} />
                <input placeholder="SĐT" name="phone" value={filter.phone} onChange={handleInput} style={inputStyle} />
                <input placeholder="Ranking" name="ranking" value={filter.ranking} onChange={handleInput} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 15 }}>
                <button
                    onClick={fetchPlayers}
                    style={{ backgroundColor: '#007bff', color: '#fff', padding: '6px 14px', border: 'none', borderRadius: 5 }}
                >Tìm kiếm</button>
            </div>

            {/* Danh sách player */}
            <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', marginTop: 10 }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên</th>
                        <th>SĐT</th>
                        <th>Ranking</th>
                        <th>Points</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPlayers.map(p => (
                        <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>
                                {editingId === p.id ? (
                                    <input value={p.name} onChange={e => {
                                        setPlayers(players.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))
                                    }} />
                                ) : p.name}
                            </td>
                            <td>
                                {editingId === p.id ? (
                                    <input value={p.phone} onChange={e => {
                                        setPlayers(players.map(x => x.id === p.id ? { ...x, phone: e.target.value } : x))
                                    }} />
                                ) : p.phone}
                            </td>
                            <td>
                                {editingId === p.id ? (
                                    <input value={p.ranking} onChange={e => {
                                        setPlayers(players.map(x => x.id === p.id ? { ...x, ranking: e.target.value } : x))
                                    }} />
                                ) : p.ranking}
                            </td>
                            <td>
                                {editingId === p.id ? (
                                    <input value={p.points} onChange={e => {
                                        setPlayers(players.map(x => x.id === p.id ? { ...x, points: e.target.value } : x))
                                    }} />
                                ) : p.points}
                            </td>
                            <td>
                                {editingId === p.id ? (
                                    <>
                                        <button onClick={() => handleUpdate(p.id)} style={{ backgroundColor: '#28a745', color: 'white', padding: '4px 10px', marginRight: 5, border: 'none', borderRadius: 5 }}>Lưu</button>
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

            {/* Form thêm mới + Import */}
            <div style={{ marginTop: 30 }}>
                <h4>Thêm VĐV mới</h4>
                <input placeholder="Tên" value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} style={{ marginRight: 10 }} />
                <input placeholder="SĐT" value={newPlayer.phone} onChange={e => setNewPlayer({ ...newPlayer, phone: e.target.value })} style={{ marginRight: 10 }} />
                <input placeholder="Ranking" value={newPlayer.ranking} onChange={e => setNewPlayer({ ...newPlayer, ranking: e.target.value })} style={{ marginRight: 10 }} />
                <input placeholder="Points" value={newPlayer.points} onChange={e => setNewPlayer({ ...newPlayer, points: e.target.value })} style={{ marginRight: 10 }} />
                <button
                    onClick={handleSave}
                    style={{ backgroundColor: '#28a745', color: 'white', padding: '6px 14px', border: 'none', borderRadius: 5 }}
                >Thêm VĐV</button>
                <label style={{ marginLeft: 20 }}>
                    <input type="file" accept=".xlsx" onChange={handleImport} style={{ display: 'none' }} />
                    <span style={{ background: '#28a745', color: 'white', padding: '6px 12px', borderRadius: 5, cursor: 'pointer' }}>
                        Import Excel
                    </span>
                </label>
            </div>

            {message && <p style={{ marginTop: 10 }}>{message}</p>}
        </div>
    );
};

export default PlayerList;
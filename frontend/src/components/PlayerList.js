import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const PlayerList = () => {
    const [players, setPlayers] = useState([]);
    const [filter, setFilter] = useState({ id: '', name: '', ranking: '', phone: '' });
    const [newPlayer, setNewPlayer] = useState({ id: '', name: '', phone: '', ranking: '', points: '' });
    const [message, setMessage] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user_info'));
        if (!userInfo || userInfo.user_type !== 2) {
            window.location.href = '/login';
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

    return (
        <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
            <h2>Danh sách VĐV</h2>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input placeholder="Tìm ID" name="id" value={filter.id} onChange={handleInput} />
                <input placeholder="Tìm tên" name="name" value={filter.name} onChange={handleInput} />
                <input placeholder="Tìm SĐT" name="phone" value={filter.phone} onChange={handleInput} />
                <input placeholder="Tìm hạng" name="ranking" value={filter.ranking} onChange={handleInput} />
            </div>

            <div style={{ marginBottom: 10 }}>
                <input placeholder="Tên" value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} />
                <input placeholder="SĐT" value={newPlayer.phone} onChange={e => setNewPlayer({ ...newPlayer, phone: e.target.value })} />
                <input placeholder="Ranking" value={newPlayer.ranking} onChange={e => setNewPlayer({ ...newPlayer, ranking: e.target.value })} />
                <input placeholder="Points" value={newPlayer.points} onChange={e => setNewPlayer({ ...newPlayer, points: e.target.value })} />
                <button onClick={handleSave}>Thêm VĐV</button>
                <label style={{ marginLeft: 20 }}>
                    <input type="file" accept=".xlsx" onChange={handleImport} style={{ display: 'none' }} />
                    <span style={{ background: '#28a745', color: 'white', padding: '6px 12px', borderRadius: 5, cursor: 'pointer' }}>
                        Import Excel
                    </span>
                </label>
            </div>

            {message && <p>{message}</p>}

            <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', marginTop: 10 }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên</th>
                        <th>SĐT</th>
                        <th>Ranking</th>
                        <th>Points</th>
                        <th>Xoá</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPlayers.map(p => (
                        <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.name}</td>
                            <td>{p.phone}</td>
                            <td>{p.ranking}</td>
                            <td>{p.points}</td>
                            <td>
                                <button onClick={() => handleDelete(p.id)} style={{ color: 'red' }}>Xoá</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PlayerList;

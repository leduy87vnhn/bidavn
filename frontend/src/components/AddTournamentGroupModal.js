import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import '../tournament.scss';

Modal.setAppElement('#root');

const AddTournamentGroupModal = ({
    isOpen,
    onClose,
    onGroupCreated,
    initialData // 👈 thêm props này (null hoặc group object)
}) => {
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (initialData) {
            setGroupName(initialData.tournament_name || '');
            setDescription(initialData.description || '');
            setStartDate(initialData.start_date?.substring(0, 10) || '');
            setEndDate(initialData.end_date?.substring(0, 10) || '');
        } else {
            setGroupName('');
            setDescription('');
            setStartDate('');
            setEndDate('');
        }
        setMsg('');
    }, [initialData, isOpen]);

    const handleSaveGroup = async () => {
        if (!groupName.trim()) {
            setMsg('Tên nhóm không được để trống!');
            return;
        }
        setLoading(true);
        try {
            let res;
            if (initialData) {
                // UPDATE
                res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/tournament-group/${initialData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tournament_name: groupName,
                        description,
                        start_date: startDate,
                        end_date: endDate
                    })
                });
            } else {
                // CREATE
                res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/tournament_events/tournament-group`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tournament_name: groupName,
                        description,
                        start_date: startDate,
                        end_date: endDate
                    })
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi khi lưu giải đấu');

            setMsg('✅ Đã lưu giải đấu thành công!');
            onGroupCreated && onGroupCreated(data);

            setTimeout(() => {
                setMsg('');
                onClose();
            }, 800);
        } catch (err) {
            setMsg('❌ ' + (err.message || 'Lỗi khi lưu giải đấu'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="ReactModal__Content"
            overlayClassName="ReactModal__Overlay"
            shouldCloseOnOverlayClick
        >
            <h3 className="modal-title">Thêm Giải Đấu</h3>
            <label htmlFor="groupName" style={{ fontWeight: 600 }}>Tên giải *</label>
            <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Tên giải đấu (bắt buộc)"
                style={{ padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
            />

            {/* -------- Thêm 2 trường ngày -------- */}
            <label htmlFor="startDate" style={{ fontWeight: 600 }}>Ngày bắt đầu *</label>
            <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
                required
            />
            <label htmlFor="endDate" style={{ fontWeight: 600 }}>Ngày kết thúc *</label>
            <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
                required
            />
            {/* -------- Kết thúc -------- */}

            <label htmlFor="desc">Mô tả (tuỳ chọn)</label>
            <textarea
                id="desc"
                value={description}
                className="modal-textarea"
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả nhóm (nếu có)"
            />
            {msg && (
                <div style={{
                    color: msg.startsWith('✅') ? '#198754' : '#d8000c',
                    fontWeight: 500
                }}>{msg}</div>
            )}
            <div className="modal-action-buttons">
                <button
                    className="grey"
                    onClick={onClose}
                    disabled={loading}
                >Huỷ</button>
                <button
                    className="teal"
                    onClick={handleSaveGroup}
                    disabled={loading}
                >
                    {loading ? "Đang lưu..." : (initialData ? "Cập nhật" : "Lưu Giải Đấu")}
                </button>
            </div>
        </Modal>
    );
};

export default AddTournamentGroupModal;
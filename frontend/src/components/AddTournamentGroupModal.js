import React, { useState } from 'react';
import Modal from 'react-modal';
import '../tournament.scss';

Modal.setAppElement('#root');

const AddTournamentGroupModal = ({
    isOpen,
    onClose,
    onGroupCreated
}) => {
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            setMsg('Tên nhóm không được để trống!');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/tournament-group`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournament_name: groupName,
                    description
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi khi tạo nhóm');
            setMsg('✅ Đã thêm nhóm mới!');
            onGroupCreated && onGroupCreated(data); // callback cho parent reload gợi ý group
            setTimeout(() => {
                setMsg('');
                setGroupName('');
                setDescription('');
                onClose();
            }, 900);
        } catch (err) {
            setMsg('❌ ' + (err.message || 'Lỗi khi tạo nhóm'));
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
            <h3 className="modal-title">Thêm Nhóm Giải</h3>
            <label htmlFor="groupName" style={{ fontWeight: 600 }}>Tên nhóm *</label>
            <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Tên nhóm giải (bắt buộc)"
                style={{ padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
            />
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
                    onClick={handleCreateGroup}
                    disabled={loading}
                >
                    {loading ? "Đang lưu..." : "Lưu Nhóm"}
                </button>
            </div>
        </Modal>
    );
};

export default AddTournamentGroupModal;
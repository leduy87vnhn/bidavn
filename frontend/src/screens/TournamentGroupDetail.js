import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab } from '@mui/material';
import MainLayout from '../components/MainLayout';
import TournamentTabDetail from '../components/TournamentTabDetail';
import { FaArrowLeft, FaCamera } from 'react-icons/fa';

const TournamentGroupDetail = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef();

  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) setUser(JSON.parse(userInfo));
  }, []);

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/group/${groupId}`);
        setGroup(res.data.group);
        setTournaments(res.data.tournaments);
      } catch {
        setGroup(null);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId]);

  // Upload background group
  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('background', file);
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/group/${groupId}/upload-background`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('✅ Cập nhật hình nền group thành công!');
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/group/${groupId}`);
      setGroup(res.data.group);
    } catch (err) {
      alert('❌ Lỗi khi cập nhật hình nền group.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <MainLayout><p>Đang tải...</p></MainLayout>;
  if (!group) return <MainLayout><p>Không tìm thấy nhóm giải đấu.</p></MainLayout>;
  if (!tournaments.length) return <MainLayout><p>Nhóm này chưa có giải đấu nào.</p></MainLayout>;

  const groupBackgroundUrl = group.background_image
    ? `${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/groups/${group.background_image}`
    : '';

    return (
    <MainLayout>
        <div
        style={{
            backgroundImage: groupBackgroundUrl ? `url(${groupBackgroundUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '100vh',
            position: 'relative',
        }}
        >
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 36px 0 36px',
        }}>
            <button
            onClick={() => navigate('/tournaments')}
            style={{
                background: '#2a334a',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '10px 18px',
                fontSize: 17,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
                cursor: 'pointer'
            }}
            >
            <FaArrowLeft /> Quay lại danh sách
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {user?.user_type === 2 && (
                <label
                style={{
                    background: '#12ad7b',
                    color: 'white',
                    padding: '9px 15px',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                }}
                >
                <FaCamera /> Tải hình nền group
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                />
                </label>
            )}
            {uploading && <span style={{ color: '#246' }}>Đang tải lên...</span>}
            </div>
        </div>
        {/* Tên nhóm và thời gian */}
        <div style={{ padding: '24px 36px 0 36px' }}>
            <h2 style={{ color: '#1d5ae4', margin: 0 }}>{group.tournament_name}</h2>
            {(group.start_date || group.end_date) && (
            <div style={{ color: '#444', marginBottom: 12 }}>
                {group.start_date && `Từ ${group.start_date}`}{" "}
                {group.end_date && `đến ${group.end_date}`}
            </div>
            )}
        </div>
        {/* Tabs và nội dung từng giải */}
        <div style={{
            background: 'rgba(255,255,255,0.82)',
            margin: 36,
            padding: 28,
            borderRadius: 20,
            boxShadow: '0 2px 18px 2px #0001',
            minHeight: 320
        }}>
            <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
                marginBottom: 2,
                '.MuiTab-root': {
                fontWeight: 600,
                color: '#1976d2'
                },
                '.Mui-selected': {
                color: '#fff',
                backgroundColor: '#1976d2',
                borderRadius: '8px 8px 0 0'
                }
            }}
            >
            {Array.isArray(tournaments) && tournaments.length > 0
                ? tournaments.map((t, idx) => (
                    <Tab
                    key={t.id}
                    label={t.name}
                    sx={{
                        background: '#e3edfa',
                        marginRight: 2,
                        minWidth: 140,
                    }}
                    />
                ))
                : <Tab label="Không có giải đấu" disabled />}
            </Tabs>
            <div style={{ marginTop: 20 }}>
            {Array.isArray(tournaments) && tournaments.length > 0 && tournaments[activeTab] ? (
                <TournamentTabDetail tournament={tournament} transparentBackground={true} />
            ) : (
                <p>Nhóm này chưa có giải đấu nào.</p>
            )}
            </div>
        </div>
        </div>
    </MainLayout>
    );
};
export default TournamentGroupDetail;
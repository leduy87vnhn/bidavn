import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab } from '@mui/material';
//import MainLayout from '../components/MainLayout';
import MainPageHeader from '../components/MainPageHeader';
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


    useEffect(() => {
    const fetchLogo = async () => {
        try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/logo`);
        setLogoFile(res.data.filename);
        } catch (err) {
        setLogoFile(null);
        }
    };
    fetchLogo();
    }, []);

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

  if (loading) return <MainPageHeader ><p>Đang tải...</p></MainPageHeader >;
  if (!group) return <MainPageHeader ><p>Không tìm thấy nhóm giải đấu.</p></MainPageHeader >;
  if (!tournaments.length) return <MainPageHeader ><p>Nhóm này chưa có giải đấu nào.</p></MainPageHeader >;

  const groupBackgroundUrl = group.background_image
    ? `${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/groups/${group.background_image}`
    : '';

    const formatDate = (isoStr) => {
      if (!isoStr) return '';
        const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      return `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()}`;
    };

  return (
    <>
      <MainPageHeader />

      <div
        style={{
          backgroundImage: groupBackgroundUrl ? `url(${groupBackgroundUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {/* Logo HBSF góc trên phải */}
        {/* {logoFile && (
          <div
            style={{
              position: 'absolute',
              top: 24,
              right: 36,
              zIndex: 10,
              background: '#fff9',
              borderRadius: 12,
              padding: 5,
              boxShadow: '0 2px 12px #0002'
            }}
          >
            <img
              src={`${process.env.REACT_APP_API_BASE_URL}/uploads/logos/${logoFile}`}
              alt="Logo HBSF"
              style={{ height: 58, objectFit: 'contain', display: 'block' }}
            />
          </div>
        )} */}

        {/* <div style={{
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
        </div> */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '24px 36px 0 36px',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => navigate('/tournaments')}
            className="top-action-button primary"
            style={{ height: 42, fontSize: 15 }}
          >
            <FaArrowLeft /> Quay lại danh sách
          </button>

          {user?.user_type === 2 && (
            <label className="top-action-button teal" style={{ height: 42, fontSize: 15 }}>
              <FaCamera /> Tải hình nền group
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                ref={fileInputRef}
              />
            </label>
          )}

          {uploading && (
            <span style={{ color: '#246', fontWeight: 500 }}>
              Đang tải lên...
            </span>
          )}
        </div>

        {/* Container chung để xử lý zIndex */}
        <div style={{ position: 'relative', zIndex: 5, margin: '36px' }}>
          <div className="tournament-group-header" style={{ marginBottom: 16 }}>
            <h1 style={{ color: '#1558d6', margin: 0, fontWeight: 800, fontSize: '2.3rem', position: 'relative', zIndex: 10 }}>
              {group.tournament_name}
            </h1>
            {(group.start_date || group.end_date) && (
              <div style={{ color: '#232323', marginTop: 8, fontSize: '1.15rem', fontWeight: 500 }}>
                {group.start_date && `Từ ${formatDate(group.start_date)}`}
                {group.end_date && ` đến ${formatDate(group.end_date)}`}
              </div>
            )}
          </div>

          {/* Tabs và nội dung từng giải */}
          <div style={{
            background: 'transparent',
            padding: 28,
            borderRadius: 20,
            boxShadow: 'none',
            minHeight: 320
          }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                position: 'relative',
                zIndex: 1,
                marginBottom: 2,
                '.MuiTab-root': {
                  fontWeight: 600,
                  color: '#003366',
                  backgroundColor: 'transparent'
                },
                '.Mui-selected': {
                  color: '#fff',
                  backgroundColor: 'rgba(25, 118, 210, 0.5)',
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
                <TournamentTabDetail tournament={tournaments[activeTab]} transparentBackground={true} />
              ) : (
                <p>Giải này chưa đăng ký nội dung.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default TournamentGroupDetail;
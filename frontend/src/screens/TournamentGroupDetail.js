import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Tabs, Tab } from '@mui/material';
import MainLayout from '../components/MainLayout';
import TournamentTabDetail from '../components/TournamentTabDetail';

const TournamentGroupDetail = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <MainLayout><p>Đang tải...</p></MainLayout>;
  if (!group) return <MainLayout><p>Không tìm thấy nhóm giải đấu.</p></MainLayout>;
  if (!tournaments.length) return <MainLayout><p>Nhóm này chưa có giải đấu nào.</p></MainLayout>;

  return (
    <MainLayout>
      <div style={{
        maxWidth: 1000, margin: '0 auto', padding: 32,
        background: '#f7fafb', borderRadius: 18, boxShadow: '0 2px 10px #bde9cf60'
      }}>
        <h1 style={{ marginBottom: 8 }}>{group.tournament_name}</h1>
        <div style={{ marginBottom: 18, fontSize: 15, color: '#678' }}>
          <strong>Thời gian:</strong>
          {group.start_date ? ` ${new Date(group.start_date).toLocaleDateString('vi-VN')}` : ''}
          {group.end_date ? ` - ${new Date(group.end_date).toLocaleDateString('vi-VN')}` : ''}
        </div>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: '2px solid #a5a5a5' }}
        >
          {tournaments.map((t, idx) => (
            <Tab key={t.id} label={t.name} />
          ))}
        </Tabs>
        <div style={{ marginTop: 16 }}>
          <TournamentTabDetail tournament={tournaments[activeTab]} />
        </div>
      </div>
    </MainLayout>
  );
};
export default TournamentGroupDetail;
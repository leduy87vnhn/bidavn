import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import MainPageHeader from '../components/MainPageHeader';
import MainPageMenuBar from '../components/MainPageMenuBar';
import ClubMembersTab from '../components/ClubMembersTab';
import PersonalMemberTab from '../components/PersonalMemberTab';

const MembersScreen = () => {
  const [tab, setTab] = useState(0);

  return (
    <div>
      <MainPageHeader />
      <MainPageMenuBar />
      <Box sx={{ padding: 2 }}>
        <Tabs value={tab} onChange={(e, val) => setTab(val)} centered>
          <Tab label="Hội Viên Tổ Chức" />
          <Tab label="Hội Viên Cá Nhân" />
        </Tabs>
        <Box sx={{ marginTop: 3 }}>
          {tab === 0 && <ClubMembersTab />}
          {tab === 1 && <PersonalMemberTab />}
        </Box>
      </Box>
    </div>
  );
};

export default MembersScreen;
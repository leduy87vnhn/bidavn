import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MainPageLogoTab from '../components/MainPageLogoTab';
import MainPageEventTab from '../components/MainPageEventTab';

function TabPanel(props) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box sx={{ p: 2 }}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const MainPageSettings = () => {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user_info'));
    if (!user || user.user_type !== 1) {
      window.location.href = 'https://hbsf.com.vn/login';
    }
  }, []);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <Paper elevation={3} sx={{ maxWidth: '1000px', margin: '30px auto', padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Cấu hình Main Page
      </Typography>

      <Tabs value={tab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
        <Tab label="Logo" />
        <Tab label="Event" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <MainPageLogoTab />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <MainPageEventTab />
      </TabPanel>
    </Paper>
  );
};

export default MainPageSettings;
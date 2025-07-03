import React, { useState } from 'react';
import { Tabs, Tab, Box, Typography, Paper } from '@mui/material';
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
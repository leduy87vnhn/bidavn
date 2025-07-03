import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MainPageHeader = () => {
  const [logos, setLogos] = useState([]);

  useEffect(() => {
    axios.get('/api/mainpage/logos').then((res) => {
      setLogos(res.data);
    });
  }, []);

  return (
    <div className="mainpageheader">
      {logos.map((logo) => (
        <img
          key={logo.settings_item}
          src={logo.settings_value.replace('~', '')}
          alt={logo.settings_item}
          className={logo.settings_item === 'hbsf_logo' ? 'logo hbsf' : 'logo sponsor'}
        />
      ))}
    </div>
  );
};

export default MainPageHeader;
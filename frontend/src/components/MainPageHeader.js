import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MainPageHeader = () => {
  const [logos, setLogos] = useState([]);

  useEffect(() => {
    axios.get('http://18.143.246.46:5000/api/mainpage/logos').then((res) => {
      const valid = res.data?.filter(logo => logo.settings_value);
      setLogos(valid);
    });
  }, []);

  if (!logos || logos.length === 0) return null;

  return (
    <div className="mainpage-header">
      {logos.map((logo) => (
        <img
          key={logo.settings_item}
          src={`http://18.143.246.46:5000${logo.settings_value.replace('~', '')}`}
          alt={logo.settings_item}
          className={logo.settings_item === 'hbsf_logo' ? 'logo hbsf' : 'logo sponsor'}
        />
      ))}
    </div>
  );
};

export default MainPageHeader;
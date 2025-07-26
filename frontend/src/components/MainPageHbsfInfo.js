import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/mainpage.css';

const MainPageHbsfInfo = () => {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await axios.get('/api/mainpage/hbsf-info');
        setInfo(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu HBSF:', err);
      }
    };
    fetchInfo();
  }, []);

  if (!info) return null;

  return (
    <div className="hbsf-info-container">
      <strong>{info.hbsf_name}</strong>
      <div>Trụ sở: {info.headquarters_address}</div>
      <div>Văn phòng: {info.office_address}</div>
      <div>Website: <a href={`http://${info.website}`} target="_blank" rel="noreferrer">{info.website}</a></div>
      <div>Email: <a href={`mailto:${info.email}`}>{info.email}</a></div>
    </div>
  );
};

export default MainPageHbsfInfo;
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MainPageLogoTab = () => {
  const [logos, setLogos] = useState([]);
  const [newItem, setNewItem] = useState({ settings_item: '', settings_value: '' });

  const fetchLogos = async () => {
    const res = await axios.get('/api/mainpage/logos');
    setLogos(res.data);
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  const handleUpload = async (e, idx) => {
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    const res = await axios.post('/api/mainpage/upload-logo', formData);
    const updated = [...logos];
    updated[idx].settings_value = res.data.filePath;
    setLogos(updated);
  };

  const handleSave = async () => {
    for (const logo of logos) {
      await axios.post('/api/mainpage/update-logo', logo);
    }
    fetchLogos();
  };

  const handleAdd = async () => {
    await axios.post('/api/mainpage/create-logo', newItem);
    setNewItem({ settings_item: '', settings_value: '' });
    fetchLogos();
  };

  const handleDelete = async (settings_item) => {
    await axios.delete('/api/mainpage/delete-logo/' + settings_item);
    fetchLogos();
  };

  return (
    <div>
      <h3>Danh sách Logo</h3>
      <table>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Đường dẫn</th>
            <th>Upload</th>
            <th>Xoá</th>
          </tr>
        </thead>
        <tbody>
          {logos.map((item, idx) => (
            <tr key={item.settings_item}>
              <td>{item.settings_item}</td>
              <td>{item.settings_value}</td>
              <td><input type="file" onChange={(e) => handleUpload(e, idx)} /></td>
              <td><button onClick={() => handleDelete(item.settings_item)}>Xoá</button></td>
            </tr>
          ))}
          <tr>
            <td><input value={newItem.settings_item} onChange={e => setNewItem({ ...newItem, settings_item: e.target.value })} /></td>
            <td></td>
            <td><input type="file" onChange={async (e) => {
              const formData = new FormData();
              formData.append('image', e.target.files[0]);
              const res = await axios.post('/api/mainpage/upload-logo', formData);
              setNewItem({ ...newItem, settings_value: res.data.filePath });
            }} /></td>
            <td><button onClick={handleAdd}>Thêm</button></td>
          </tr>
        </tbody>
      </table>
      <button onClick={handleSave}>Lưu tất cả</button>
    </div>
  );
};

export default MainPageLogoTab;
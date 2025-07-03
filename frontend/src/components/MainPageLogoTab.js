import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MainPageLogoTab = () => {
  const [logos, setLogos] = useState([]);
  const [newItem, setNewItem] = useState({ settings_item: '', settings_value: '' });

  const fetchLogos = async () => {
    try {
      const res = await axios.get('http://18.143.246.46:5000/api/mainpage/logos');
      const data = res.data;
      if (Array.isArray(data)) {
        setLogos(data);
      } else {
        console.error('API không trả về mảng:', data);
        setLogos([]);
      }
    } catch (err) {
      console.error('Lỗi fetch logos:', err);
      setLogos([]);
    }
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  const handleUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post('http://18.143.246.46:5000/api/mainpage/upload-logo', formData);
      const updated = [...logos];
      updated[idx].settings_value = res.data.filePath;
      setLogos(updated);
    } catch (err) {
      console.error('Upload thất bại:', err);
    }
  };

  const handleSave = async () => {
    try {
      for (const logo of logos) {
        await axios.post('http://18.143.246.46:5000/api/mainpage/update-logo', logo);
      }
      fetchLogos();
    } catch (err) {
      console.error('Lỗi khi lưu logo:', err);
    }
  };

  const handleAdd = async () => {
    try {
      await axios.post('http://18.143.246.46:5000/api/mainpage/create-logo', newItem);
      setNewItem({ settings_item: '', settings_value: '' });
      fetchLogos();
    } catch (err) {
      console.error('Lỗi khi thêm logo mới:', err);
    }
  };

  const handleDelete = async (settings_item) => {
    try {
      await axios.delete('http://18.143.246.46:5000/api/mainpage/delete-logo/' + settings_item);
      fetchLogos();
    } catch (err) {
      console.error('Lỗi khi xoá logo:', err);
    }
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
          {Array.isArray(logos) ? logos.map((item, idx) => (
            <tr key={item.settings_item}>
              <td>{item.settings_item}</td>
              <td>{item.settings_value}</td>
              <td>
                <input type="file" onChange={(e) => handleUpload(e, idx)} />
              </td>
              <td>
                <button onClick={() => handleDelete(item.settings_item)}>Xoá</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4">Không có dữ liệu logo hoặc lỗi tải</td>
            </tr>
          )}
          <tr>
            <td>
              <input
                value={newItem.settings_item}
                onChange={(e) => setNewItem({ ...newItem, settings_item: e.target.value })}
                placeholder="Mã logo"
              />
            </td>
            <td>{newItem.settings_value}</td>
            <td>
              <input type="file" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('image', file);
                try {
                  const res = await axios.post('http://18.143.246.46:5000/api/mainpage/upload-logo', formData);
                  setNewItem({ ...newItem, settings_value: res.data.filePath });
                } catch (err) {
                  console.error('Upload thất bại:', err);
                }
              }} />
            </td>
            <td>
              <button onClick={handleAdd}>Thêm</button>
            </td>
          </tr>
        </tbody>
      </table>
      <button onClick={handleSave}>Lưu tất cả</button>
    </div>
  );
};

export default MainPageLogoTab;
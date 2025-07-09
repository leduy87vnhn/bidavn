import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const MainPageLogoTab = () => {
  const [logos, setLogos] = useState([]);
  const [newItem, setNewItem] = useState({ settings_item: '', settings_value: '' });
  const fileInputRefs = useRef({});
  const newFileInputRef = useRef(null);

  const fetchLogos = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/mainpage/logos`);
      const data = res.data;
      if (Array.isArray(data)) {
        setLogos(data);
      } else {
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

  const handleDrop = async (e, idx, isNew = false) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(`${API_BASE}/api/mainpage/upload-logo`, formData);
      if (isNew) {
        setNewItem({ ...newItem, settings_value: res.data.filePath });
      } else {
        const updated = [...logos];
        updated[idx].settings_value = res.data.filePath;
        setLogos(updated);
      }
    } catch (err) {
      console.error('Upload lỗi:', err);
    }
  };

  const handleFileSelect = async (e, idx, isNew = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(`${API_BASE}/api/mainpage/upload-logo`, formData);
      if (isNew) {
        setNewItem({ ...newItem, settings_value: res.data.filePath });
      } else {
        const updated = [...logos];
        updated[idx].settings_value = res.data.filePath;
        setLogos(updated);
      }
    } catch (err) {
      console.error('Upload lỗi:', err);
    }
  };

  const handleSave = async () => {
    try {
      for (const logo of logos) {
        await axios.post(`${API_BASE}/api/mainpage/update-logo`, logo);
      }
      fetchLogos();
    } catch (err) {
      console.error('Lỗi khi lưu logo:', err);
    }
  };

  const handleAdd = async () => {
    try {
      await axios.post(`${API_BASE}/api/mainpage/create-logo`, newItem);
      setNewItem({ settings_item: '', settings_value: '' });
      fetchLogos();
    } catch (err) {
      console.error('Lỗi khi thêm logo mới:', err);
    }
  };

  const handleDelete = async (settings_item) => {
    try {
      await axios.delete(`${API_BASE}/api/mainpage/delete-logo/${settings_item}`);
      fetchLogos();
    } catch (err) {
      console.error('Lỗi khi xoá logo:', err);
    }
  };

  const getImageUrl = (val) => {
    if (!val) return '';
    return `${API_BASE}${val.replace(/^~\/billard\/bidavn\/backend/, '')}`;
  };

  return (
    <div style={{ padding: '20px', background: '#f2f8f9', minHeight: '100vh' }}>
      <h2 style={{
        color: '#2a5d9f',
        textAlign: 'center',
        marginBottom: '24px',
        borderBottom: '2px solid #ccc',
        paddingBottom: '10px'
      }}>
        Cấu hình Logo
      </h2>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          borderCollapse: 'collapse',
          width: '100%',
          background: '#fff',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead style={{ background: '#2a5d9f', color: 'white' }}>
            <tr>
              <th style={th}>Mã</th>
              <th style={th}>Đường dẫn</th>
              <th style={th}>Ảnh</th>
              <th style={th}>Upload</th>
              <th style={th}>Xoá</th>
            </tr>
          </thead>
          <tbody>
            {logos.map((item, idx) => (
              <tr key={item.settings_item} style={idx % 2 === 0 ? trEven : trOdd}>
                <td style={td}>{item.settings_item}</td>
                <td style={td}><div style={truncate} title={item.settings_value}>{item.settings_value}</div></td>
                <td style={td}>
                  {item.settings_value && (
                    <div className="thumbnail-container">
                      <img
                        src={getImageUrl(item.settings_value)}
                        alt="logo"
                        style={thumbnailStyle}
                        className="thumbnail-image"
                      />
                      <div className="preview-popup">
                        <img src={getImageUrl(item.settings_value)} alt="preview" />
                      </div>
                    </div>
                  )}
                </td>
                <td style={td}>
                  <div
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRefs.current[idx]?.click()}
                    style={dropZone}
                  >
                    Kéo & thả ảnh vào đây<br />hoặc click để chọn
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      ref={(el) => (fileInputRefs.current[idx] = el)}
                      onChange={(e) => handleFileSelect(e, idx)}
                    />
                  </div>
                </td>
                <td style={td}>
                  <button style={btnDanger} onClick={() => handleDelete(item.settings_item)}>Xoá</button>
                </td>
              </tr>
            ))}
            <tr style={{ background: '#e0efff' }}>
              <td style={td}>
                <input
                  value={newItem.settings_item}
                  onChange={(e) => setNewItem({ ...newItem, settings_item: e.target.value })}
                  placeholder="Mã logo"
                  style={input}
                />
              </td>
              <td style={td}>
                <div style={truncate} title={newItem.settings_value}>{newItem.settings_value}</div>
              </td>
              <td style={td}>
                {newItem.settings_value && (
                  <div className="thumbnail-container">
                    <img
                      src={getImageUrl(newItem.settings_value)}
                      alt="new"
                      style={thumbnailStyle}
                      className="thumbnail-image"
                    />
                    <div className="preview-popup">
                      <img src={getImageUrl(newItem.settings_value)} alt="preview" />
                    </div>
                  </div>
                )}
              </td>
              <td style={td}>
                <div
                  onDrop={(e) => handleDrop(e, null, true)}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => newFileInputRef.current?.click()}
                  style={dropZone}
                >
                  Kéo & thả ảnh mới<br />hoặc click để chọn
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    ref={newFileInputRef}
                    onChange={(e) => handleFileSelect(e, null, true)}
                  />
                </div>
              </td>
              <td style={td}>
                <button style={btnPrimary} onClick={handleAdd}>Thêm</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button style={btnPrimary} onClick={handleSave}>💾 Lưu tất cả</button>
      </div>

      {/* Style cho thumbnail preview */}
      <style>{`
        .thumbnail-container {
          position: relative;
          display: inline-block;
        }
        .thumbnail-image {
          width: 60px;
          height: auto;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
        }
        .preview-popup {
          display: none;
          position: absolute;
          top: 0;
          left: 70px;
          z-index: 10;
          background: white;
          border: 1px solid #ccc;
          padding: 4px;
          border-radius: 6px;
          box-shadow: 0 0 6px rgba(0,0,0,0.2);
        }
        .thumbnail-container:hover .preview-popup {
          display: block;
        }
        .preview-popup img {
          max-width: 200px;
          height: auto;
        }
      `}</style>
    </div>
  );
};

// Styles
const th = { padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' };
const td = { padding: '8px', borderBottom: '1px solid #eee' };
const input = { padding: '5px', borderRadius: '4px', border: '1px solid #ccc' };
const btnPrimary = {
  padding: '6px 12px',
  background: '#2a5d9f',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};
const btnDanger = {
  ...btnPrimary,
  background: '#d9534f'
};
const trEven = { background: '#ffffff' };
const trOdd = { background: '#f9f9f9' };
const truncate = {
  maxWidth: '200px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};
const thumbnailStyle = {
  maxWidth: '60px',
  maxHeight: '40px',
  objectFit: 'contain',
  margin: '2px'
};
const dropZone = {
  padding: '12px',
  border: '2px dashed #bbb',
  borderRadius: '6px',
  textAlign: 'center',
  color: '#666',
  cursor: 'pointer',
  backgroundColor: '#fdfdfd'
};

export default MainPageLogoTab;
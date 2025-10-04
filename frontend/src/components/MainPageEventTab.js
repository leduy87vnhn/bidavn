import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import MdEditor from 'react-markdown-editor-lite';
import MarkdownIt from 'markdown-it';
import 'react-markdown-editor-lite/lib/index.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL;
const mdParser = new MarkdownIt();

const MainPageEventTab = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    id: '', event_name: '', event_photo: '', event_photo_second: '', event_video: '', event_content: '', event_date: ''
  });
  const fileInputRefsSecond = useRef({});

  const fileInputRefs = useRef({});
  const newFileInputRef = useRef(null);

  const fetchEvents = async () => {
    const res = await axios.get(`${API_BASE}/api/mainpage/events-full`);
    setEvents(res.data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleFileSelect = async (e, idx, isNew = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    const res = await axios.post(`${API_BASE}/api/mainpage/upload-event`, formData);
    if (isNew) {
      setNewEvent({ ...newEvent, event_photo: res.data.filePath });
    } else {
      const updated = [...events];
      updated[idx].event_photo = res.data.filePath;
      setEvents(updated);
    }
  };

  const handleDrop = async (e, idx, isNew = false) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    const res = await axios.post(`${API_BASE}/api/mainpage/upload-event`, formData);
    if (isNew) {
      setNewEvent({ ...newEvent, event_photo: res.data.filePath });
    } else {
      const updated = [...events];
      updated[idx].event_photo = res.data.filePath;
      setEvents(updated);
    }
  };

  const handleSave = async () => {
    for (const ev of events) {
      await axios.post(`${API_BASE}/api/mainpage/update-event`, ev);
    }
    fetchEvents();
  };

  const handleAdd = async () => {
    await axios.post(`${API_BASE}/api/mainpage/create-event`, newEvent);
    setNewEvent({ id: '', event_name: '', event_photo: '', event_video: '', event_content: '', event_date: '' });
    fetchEvents();
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API_BASE}/api/mainpage/delete-event/${id}`);
    fetchEvents();
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
        Cấu hình Sự kiện
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
              <th style={{ ...th, width: '80px' }}>ID</th>
              <th style={{ ...th, width: '500px' }}>Tên sự kiện</th>
              <th style={{ ...th, width: '120px' }}>Ảnh</th>
              <th style={{ ...th, width: '120px' }}>Upload</th>
              <th style={{ ...th, width: '240px' }}>Video</th>
              <th style={{ ...th, width: '140px' }}>Ngày</th>
              <th style={{ ...th, width: '80px' }}>Xoá</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, idx) => (
              <React.Fragment key={e.id}>
                <tr style={{
                  ...((idx % 2 === 0) ? trEven : trOdd),
                  borderBottom: '2px solid #ccc'
                }}>
                  <td style={{ ...td }}>{e.id}</td>

                  <td style={{ ...td }}>
                    <input
                      style={{ ...input, width: '100%', fontWeight: 'bold' }}
                      value={e.event_name}
                      onChange={ev => updateField(ev, idx, 'event_name')}
                    />
                  </td>

                  <td style={td}>
                    {/* Ảnh 1 */}
                    {e.event_photo && (
                      <div className="thumbnail-container" style={{ marginBottom: '6px' }}>
                        <img
                          src={getImageUrl(e.event_photo)}
                          alt="event 1"
                          style={thumbnailStyle}
                          className="thumbnail-image"
                        />
                        <div className="preview-popup">
                          <img src={getImageUrl(e.event_photo)} alt="preview 1" />
                        </div>
                      </div>
                    )}

                    {/* Ảnh 2 */}
                    {e.event_photo_second && (
                      <div className="thumbnail-container">
                        <img
                          src={getImageUrl(e.event_photo_second)}
                          alt="event 2"
                          style={thumbnailStyle}
                          className="thumbnail-image"
                        />
                        <div className="preview-popup">
                          <img src={getImageUrl(e.event_photo_second)} alt="preview 2" />
                        </div>
                      </div>
                    )}
                  </td>

                  {/* <td style={td}>
                    <div
                      onDrop={(ev) => handleDrop(ev, idx)}
                      onDragOver={(ev) => ev.preventDefault()}
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      style={dropZone}
                    >
                      Kéo & thả ảnh slideshow event<br />hoặc click để chọn
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={(el) => (fileInputRefs.current[idx] = el)}
                        onChange={(e) => handleFileSelect(e, idx)}
                      />
                    </div>
                    <div
                      onDrop={(ev) => handleDrop(ev, idx, 'event_photo_second')}
                      onDragOver={(ev) => ev.preventDefault()}
                      onClick={() => fileInputRefsSecond.current[idx]?.click()}
                      style={dropZone}
                    >
                      Kéo & thả ảnh tiêu đề event<br />hoặc click để chọn
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={(el) => (fileInputRefsSecond.current[idx] = el)}
                        onChange={(e) => handleFileSelect(e, idx, 'event_photo_second')}
                      />
                    </div>
                  </td> */}
                  <td style={td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Ảnh slideshow event */}
                      <div
                        onDrop={(ev) => handleDrop(ev, idx)}
                        onDragOver={(ev) => ev.preventDefault()}
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        style={dropZone}
                      >
                        Kéo & thả ảnh slideshow event<br />hoặc click để chọn
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          ref={(el) => (fileInputRefs.current[idx] = el)}
                          onChange={(e) => handleFileSelect(e, idx)}
                        />
                      </div>

                      {/* Ảnh tiêu đề event */}
                      <div
                        onDrop={(ev) => handleDrop(ev, idx, 'event_photo_second')}
                        onDragOver={(ev) => ev.preventDefault()}
                        onClick={() => fileInputRefsSecond.current[idx]?.click()}
                        style={dropZone}
                      >
                        Kéo & thả ảnh tiêu đề event<br />hoặc click để chọn
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          ref={(el) => (fileInputRefsSecond.current[idx] = el)}
                          onChange={(e) => handleFileSelect(e, idx, 'event_photo_second')}
                        />
                      </div>
                    </div>
                  </td>

                  <td style={td}>
                    <input
                      style={{ ...input, width: '100%' }}
                      value={e.event_video}
                      onChange={ev => updateField(ev, idx, 'event_video')}
                    />
                  </td>

                  <td style={td}>
                    <input
                      type="date"
                      value={e.event_date?.substring(0, 10)}
                      onChange={ev => updateField(ev, idx, 'event_date', ev.target.value)}
                    />
                  </td>

                  <td style={td}>
                    <button style={btnDanger} onClick={() => handleDelete(e.id)}>Xoá</button>
                  </td>
                </tr>

                <tr>
                  <td colSpan="7" style={{
                    background: '#f7faff',
                    padding: '15px 20px',
                    borderBottom: '2px solid #ccc'
                  }}>
                    <b>Nội dung:</b>
                    <MdEditor
                      value={e.event_content}
                      style={{ height: '200px', marginTop: '10px' }}
                      renderHTML={(text) => mdParser.render(text)}
                      onChange={({ text }) => updateField({ target: { value: text } }, idx, 'event_content')}
                    />
                  </td>
                </tr>
              </React.Fragment>
            ))}

            {/* Dòng thêm mới */}
            <tr style={{ background: '#e0efff' }}>
              <td style={td}>
                <input
                  style={input}
                  value={newEvent.id}
                  onChange={e => setNewEvent({ ...newEvent, id: e.target.value })}
                />
              </td>

              <td style={td}>
                <input
                  style={{ ...input, width: '100%', fontWeight: 'bold' }}
                  value={newEvent.event_name}
                  onChange={e => setNewEvent({ ...newEvent, event_name: e.target.value })}
                />
              </td>

              <td style={td}>
                {newEvent.event_photo && (
                  <div className="thumbnail-container">
                    <img
                      src={getImageUrl(newEvent.event_photo)}
                      alt="new"
                      style={thumbnailStyle}
                      className="thumbnail-image"
                    />
                    <div className="preview-popup">
                      <img src={getImageUrl(newEvent.event_photo)} alt="preview" />
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
                <input
                  style={{ ...input, width: '100%' }}
                  value={newEvent.event_video}
                  onChange={e => setNewEvent({ ...newEvent, event_video: e.target.value })}
                />
              </td>

              <td style={td}>
                <input
                  type="date"
                  value={newEvent.event_date}
                  onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
                />
              </td>

              <td style={td}>
                <button style={btnPrimary} onClick={handleAdd}>Thêm</button>
              </td>
            </tr>

            <tr>
              <td colSpan="7" style={{
                background: '#eef7ff',
                padding: '15px 20px',
                borderBottom: '2px solid #ccc'
              }}>
                <b>Nội dung:</b>
                <MdEditor
                  value={newEvent.event_content}
                  style={{ height: '200px', marginTop: '10px' }}
                  renderHTML={(text) => mdParser.render(text)}
                  onChange={({ text }) => setNewEvent({ ...newEvent, event_content: text })}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button style={btnPrimary} onClick={handleSave}>💾 Lưu tất cả</button>
      </div>

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

  function updateField(ev, idx, field, customVal) {
    const updated = [...events];
    updated[idx][field] = customVal ?? ev.target.value;
    setEvents(updated);
  }
};

// Styles
const th = { padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' };
const td = { padding: '8px', borderBottom: '1px solid #eee', verticalAlign: 'top' };
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

export default MainPageEventTab;
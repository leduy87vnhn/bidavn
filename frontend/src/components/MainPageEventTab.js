import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MainPageEventTab = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    id: '', event_name: '', event_photo: '', event_video: '', event_content: '', event_date: ''
  });

  const fetchEvents = async () => {
    const res = await axios.get('http://18.143.246.46:5000/api/mainpage/events-full');
    setEvents(res.data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleUpload = async (e, idx) => {
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    const res = await axios.post('http://18.143.246.46:5000/api/mainpage/upload-event', formData);
    const updated = [...events];
    updated[idx].event_photo = res.data.filePath;
    setEvents(updated);
  };

  const handleSave = async () => {
    for (const ev of events) {
      await axios.post('http://18.143.246.46:5000/api/mainpage/update-event', ev);
    }
    fetchEvents();
  };

  const handleAdd = async () => {
    await axios.post('http://18.143.246.46:5000/api/mainpage/create-event', newEvent);
    setNewEvent({ id: '', event_name: '', event_photo: '', event_video: '', event_content: '', event_date: '' });
    fetchEvents();
  };

  const handleDelete = async (id) => {
    await axios.delete('http://18.143.246.46:5000/api/mainpage/delete-event/' + id);
    fetchEvents();
  };

  return (
    <div>
      <h3>Danh sách Sự kiện</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Tên</th><th>Ảnh</th><th>Upload</th><th>Video</th><th>Nội dung</th><th>Ngày</th><th>Xoá</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, idx) => (
            <tr key={e.id}>
              <td>{e.id}</td>
              <td>{e.event_name}</td>
              <td>{e.event_photo}</td>
              <td><input type="file" onChange={(ev) => handleUpload(ev, idx)} /></td>
              <td>{e.event_video}</td>
              <td>{e.event_content}</td>
              <td>{e.event_date}</td>
              <td><button onClick={() => handleDelete(e.id)}>Xoá</button></td>
            </tr>
          ))}
          <tr>
            <td><input value={newEvent.id} onChange={e => setNewEvent({ ...newEvent, id: e.target.value })} /></td>
            <td><input value={newEvent.event_name} onChange={e => setNewEvent({ ...newEvent, event_name: e.target.value })} /></td>
            <td></td>
            <td><input type="file" onChange={async (e) => {
              const formData = new FormData();
              formData.append('image', e.target.files[0]);
              const res = await axios.post('http://18.143.246.46:5000/api/mainpage/upload-event', formData);
              setNewEvent({ ...newEvent, event_photo: res.data.filePath });
            }} /></td>
            <td><input value={newEvent.event_video} onChange={e => setNewEvent({ ...newEvent, event_video: e.target.value })} /></td>
            <td><input value={newEvent.event_content} onChange={e => setNewEvent({ ...newEvent, event_content: e.target.value })} /></td>
            <td><input value={newEvent.event_date} onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })} /></td>
            <td><button onClick={handleAdd}>Thêm</button></td>
          </tr>
        </tbody>
      </table>
      <button onClick={handleSave}>Lưu tất cả</button>
    </div>
  );
};

export default MainPageEventTab;
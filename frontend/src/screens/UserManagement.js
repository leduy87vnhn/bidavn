import React, { useEffect, useState } from 'react';
import MainLayout from '../components/MainLayout';
import { DataGrid } from '@mui/x-data-grid';
import { Button, TextField } from '@mui/material';
import axios from 'axios';
import MainPageHeader from '../components/MainPageHeader';
import MainPageMenuBar from '../components/MainPageMenuBar';

const UserManagement = () => {
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [editedRows, setEditedRows] = useState({});
  const [rowIdCounter, setRowIdCounter] = useState(-1);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/users`);
      setRows(res.data.map(row => ({ ...row, id: row.id.toString() }))); // ensure id is string
    } catch (err) {
      console.error('Lỗi khi tải users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

    const handleEditCellChange = (params) => {
    const { id, field, value } = params;
    let formattedValue = value;

    // Nếu field là birthday và nhập dạng dd/mm/yyyy, chuyển về yyyy-mm-dd
    if (field === 'birthday' && value?.includes('/')) {
        const [dd, mm, yyyy] = value.split('/');
        if (dd && mm && yyyy) {
        formattedValue = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
    }

    setEditedRows(prev => ({
        ...prev,
        [id]: {
        ...prev[id],
        [field]: formattedValue
        }
    }));
    };

  const handleAddUser = () => {
    const newId = rowIdCounter.toString();
    const newRow = {
      id: newId,
      user_name: '',
      password: '',
      user_type: 1,
      name: '',
      birthday: '',
      phone_number: '',
      email: '',
      enable: true,
    };
    setRows(prev => [newRow, ...prev]);
    setRowIdCounter(prev => prev - 1);
    setEditedRows(prev => ({
      ...prev,
      [newId]: newRow
    }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/users/${id}`);
        setRows(prev => prev.filter(row => row.id !== id));
        setEditedRows(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      } catch (err) {
        console.error('Lỗi khi xóa:', err);
      }
    }
  };

  const handleSave = async () => {
    const updates = Object.entries(editedRows);

    for (const [id, row] of updates) {
      try {
        if (parseInt(id) < 0) {
          // New user
          await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/users`, row);
        } else {
          // Existing user
          await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/users/${id}`, row);
        }
      } catch (err) {
        console.error(`Lỗi khi lưu user ${id}:`, err);
      }
    }

    setEditedRows({});
    fetchUsers();
  };

  const columns = [
    { field: 'user_name', headerName: 'Tên đăng nhập', flex: 1, editable: false },
    { field: 'password', headerName: 'Mật khẩu', flex: 1, editable: true },
    { field: 'name', headerName: 'Họ tên', flex: 1, editable: true },
    { field: 'email', headerName: 'Email', flex: 1, editable: true },
    { field: 'phone_number', headerName: 'SĐT', flex: 1, editable: true },
    {
        field: 'birthday',
        headerName: 'Ngày sinh',
        width: 130,
        valueFormatter: (params) => {
            if (!params.value) return '';
            const date = new Date(params.value);
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        },
        editable: true
    },
    {
      field: 'user_type',
      headerName: 'Loại user',
      flex: 1,
      type: 'singleSelect',
      editable: true,
      valueOptions: [
        { value: 0, label: 'Vận động viên' },
        { value: 1, label: 'Trọng tài' },
        { value: 2, label: 'Admin' },
      ]
    },
    {
      field: 'enable',
      headerName: 'Kích hoạt',
      flex: 1,
      type: 'boolean',
      editable: true
    },
    {
        field: 'actions',
        headerName: 'Thao tác',
        width: 150,
        renderCell: (params) => (
            <>
            <Button variant="contained" color="error" size="small" onClick={() => handleDelete(params.id)}>
                Xóa
            </Button>
            </>
        ),
    }
  ];

  const filteredRows = rows.filter(r =>
    r.user_name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <>
      <div style={{ position: 'relative', zIndex: 1000 }}>
          <MainPageHeader />
          <MainPageMenuBar />
      </div>
      <div style={{ padding: '20px' }}>
        <h2>Quản lý người dùng</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <TextField
            label="Tìm kiếm theo user name"
            variant="outlined"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            size="small"
          />
          <div>
            <Button variant="contained" onClick={handleAddUser} style={{ marginRight: 10 }}>Thêm người dùng</Button>
            <Button variant="contained" color="success" onClick={handleSave}>Lưu Thông Tin</Button>
          </div>
        </div>
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            pagination
            pageSize={10}
            onCellEditCommit={handleEditCellChange}
          />
        </div>
      </div>
    </>
  );
};

export default UserManagement;
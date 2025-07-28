import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Button, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import '../css/memberRegistration.scss';

const ClubMembersTab = () => {
  const [clubMembers, setClubMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newMember, setNewMember] = useState({ club: '', address: '', info: '' });
  const [logoFiles, setLogoFiles] = useState({});
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchData();
    const user = JSON.parse(localStorage.getItem('user_info'));
    if (user?.user_type === 2) setIsAdmin(true);
  }, []);

  const fetchData = async () => {
    const res = await axios.get('/api/members/clubs');
    setClubMembers(res.data);
  };

  const handleSaveEdit = async (member) => {
    const formData = new FormData();
    formData.append('club', member.club);
    formData.append('address', member.address);
    formData.append('info', member.info);
    if (logoFiles[member.id]) {
      formData.append('logo', logoFiles[member.id]);
    }
    await axios.put(`/api/members/clubs/${member.id}`, formData);
    setEditingId(null);
    setLogoFiles({});
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xác nhận xóa hội viên này?')) {
      await axios.delete(`/api/members/clubs/${id}`);
      fetchData();
    }
  };

  const handleAddMember = async () => {
    if (!newMember.club || !newMember.address || !newMember.info) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    await axios.post('/api/members/clubs', newMember);
    setOpenDialog(false);
    setNewMember({ club: '', address: '', info: '' });
    fetchData();
  };

  const handleLogoClick = (logo) => {
    window.open(`/uploads/clubs/${logo}`, '_blank');
  };

  return (
    <div>
      {isAdmin && (
        <Button variant="contained" onClick={() => setOpenDialog(true)} sx={{ mb: 2 }}>
          Thêm Hội Viên
        </Button>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Logo</TableCell>
              <TableCell>Tên CLB</TableCell>
              <TableCell>Địa chỉ</TableCell>
              <TableCell>Giới thiệu</TableCell>
              {isAdmin && <TableCell>Thao Tác</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {clubMembers.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {editingId === row.id ? (
                    <Button variant="outlined" component="label">
                      Duyệt File
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) =>
                          setLogoFiles({ ...logoFiles, [row.id]: e.target.files[0] })
                        }
                      />
                    </Button>
                  ) : (
                    row.logo && (
                      <img
                        src={`/uploads/clubs/${row.logo}`}
                        alt="logo"
                        onClick={() => handleLogoClick(row.logo)}
                        style={{ width: 60, height: 60, cursor: 'pointer', objectFit: 'cover' }}
                      />
                    )
                  )}
                </TableCell>

                <TableCell>
                  {editingId === row.id ? (
                    <TextField
                      value={row.club}
                      onChange={(e) => {
                        const updated = clubMembers.map((m) =>
                          m.id === row.id ? { ...m, club: e.target.value } : m
                        );
                        setClubMembers(updated);
                      }}
                    />
                  ) : (
                    row.club
                  )}
                </TableCell>

                <TableCell>
                  {editingId === row.id ? (
                    <TextField
                      value={row.address}
                      onChange={(e) => {
                        const updated = clubMembers.map((m) =>
                          m.id === row.id ? { ...m, address: e.target.value } : m
                        );
                        setClubMembers(updated);
                      }}
                    />
                  ) : (
                    row.address
                  )}
                </TableCell>

                <TableCell>
                  {editingId === row.id ? (
                    <TextField
                      value={row.info}
                      onChange={(e) => {
                        const updated = clubMembers.map((m) =>
                          m.id === row.id ? { ...m, info: e.target.value } : m
                        );
                        setClubMembers(updated);
                      }}
                      multiline
                      minRows={2}
                    />
                  ) : (
                    row.info
                  )}
                </TableCell>

                {isAdmin && (
                  <TableCell>
                    {editingId === row.id ? (
                      <>
                        <Button onClick={() => handleSaveEdit(row)} color="primary">Lưu</Button>
                        <Button onClick={() => setEditingId(null)} color="secondary">Hủy</Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => setEditingId(row.id)} color="primary">Sửa</Button>
                        <Button onClick={() => handleDelete(row.id)} color="error">Xóa</Button>
                      </>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog thêm hội viên */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Thêm Hội Viên</DialogTitle>
        <DialogContent>
          <TextField
            label="Tên CLB"
            fullWidth
            margin="normal"
            value={newMember.club}
            onChange={(e) => setNewMember({ ...newMember, club: e.target.value })}
          />
          <TextField
            label="Địa chỉ"
            fullWidth
            margin="normal"
            value={newMember.address}
            onChange={(e) => setNewMember({ ...newMember, address: e.target.value })}
          />
          <TextField
            label="Giới thiệu"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={newMember.info}
            onChange={(e) => setNewMember({ ...newMember, info: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddMember} variant="contained">Tạo</Button>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ClubMembersTab;
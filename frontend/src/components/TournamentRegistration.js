import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import '../tournamentRegistration.scss';
import ReactModal from 'react-modal';

const TournamentRegistration = () => {
  const { id: tournamentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const registrationId = queryParams.get('id');

  const [tournament, setTournament] = useState(null);
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    phone: '',
    nickname: '',
    club: '',
    selected_date: '',
    uniform_size: 'L' // mặc định
  });
  const [playerSuggestions, setPlayerSuggestions] = useState([]);
  const [playerSearchText, setPlayerSearchText] = useState('');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [status, setStatus] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user_info'));
  const [availableDates, setAvailableDates] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalInfo, setModalInfo] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resolvedPlayerId, setResolvedPlayerId] = useState('');
  const [clubSuggestions, setClubSuggestions] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState({ id: '', name: '', phone: '' });

  const getStatusStyle = () => {
    switch (status) {
      case 1: return { backgroundColor: '#d0ecff', color: '#0056b3', padding: '6px 12px', borderRadius: '6px' };
      case 2: return { backgroundColor: '#ccc', color: '#000', padding: '6px 12px', borderRadius: '6px' };
      default: return { backgroundColor: '#ffe0b3', color: '#cc7000', padding: '6px 12px', borderRadius: '6px' };
    }
  };

  const loadAvailableSlots = async (tournamentId) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/slots?tournament_id=${tournamentId}`);
      setAvailableDates(res.data.available_dates || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách ngày và slot:', err);
      setAvailableDates([]);
    }
  };

  const loadTournament = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tournaments/${tournamentId}`);
      setTournament(res.data);
      setBackgroundImage(res.data.background_image);

      const start = res.data.registerable_date_start ? new Date(res.data.registerable_date_start) : null;
      const end = res.data.registerable_date_end ? new Date(res.data.registerable_date_end) : null;

      if (start && end && start <= end) {
        // ✅ Gọi API đã tính sẵn remaining
        const slotRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/slots?tournament_id=${res.data.id}`);
        setAvailableDates(slotRes.data.available_dates || []);
      } else {
        setAvailableDates([]);
        setNewCompetitor(prev => ({ ...prev, selected_date: '' }));
      }
    } catch {
      setError('Không tìm thấy giải đấu.');
    }
  };

  const loadRegistrationInfo = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/${registrationId}`);
      setRegisteredPhone(res.data.registered_phone);
      setStatus(res.data.status);
    } catch (err) {
      console.error('Lỗi khi tải bản đăng ký:', err);
    }
  };

  const loadCompetitorList = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/${registrationId}/competitors`);
      const formatted = res.data.map(c => ({
        name: c.name,
        phone: c.phone_number,
        nickname: c.nick_name,
        club: c.club,
        uniform_size: c.uniform_size || 'L',
        selected_date: c.selected_date?.slice(0, 10) || ''
      }));
      setCompetitors(formatted);
    } catch (err) {
      console.error('Lỗi khi tải danh sách VĐV:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      alert('Bạn cần đăng nhập để tiếp tục.');
      navigate('/login'); // hoặc navigate đến URL màn hình login của bạn
    }
  }, [user, navigate]);

  useEffect(() => {
    loadTournament();
    if (registrationId) {
      loadRegistrationInfo();
      loadCompetitorList();
    }
  }, [tournamentId, registrationId]);

  useEffect(() => {
    if (!registrationId && user?.phone_number) {
      setRegisteredPhone(user.phone_number);
    }
  }, [registrationId, user]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (playerSearchText.length < 2) {
        setPlayerSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/search?query=${playerSearchText}`);
        setPlayerSuggestions(res.data);
      } catch (err) {
        console.error('Lỗi tìm kiếm VĐV:', err);
      }
    }, 300); // debounce 300ms
  
    return () => clearTimeout(delayDebounce);
  }, [playerSearchText]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (
        newCompetitor.name === '' &&
        playerSearchText === '' &&
        newCompetitor.phone?.length >= 4
      ) {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/search?query=${newCompetitor.phone}`);
          setPlayerSuggestions(res.data.slice(0, 5));
        } catch (err) {
          console.error('Lỗi tìm VĐV theo phone:', err);
        }
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [newCompetitor.phone]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (
        playerSearchText === '' &&
        newCompetitor.phone === '' &&
        newCompetitor.name?.length >= 2
      ) {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/players/search?query=${newCompetitor.name}`);
          setPlayerSuggestions(res.data.slice(0, 5));
        } catch (err) {
          console.error('Lỗi tìm VĐV theo tên:', err);
        }
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [newCompetitor.name]);

  // const handlePlayerSearch = async (e) => {
  //   const text = e.target.value;
  //   setPlayerSearchText(text);
  //   if (text.length < 2) {
  //     setPlayerSuggestions([]);
  //     return;
  //   }
  //   try {
  //     const res = await axios.get(`/api/players/search?query=${text}`);
  //     setPlayerSuggestions(res.data);
  //   } catch (err) {
  //     console.error('Lỗi tìm kiếm VĐV:', err);
  //   }
  // };

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/clubs`);
        setClubSuggestions(res.data);
      } catch (err) {
        console.warn('⚠️ Không thể tải danh sách gợi ý CLB — người dùng vẫn có thể nhập thủ công.');
        // Không cần setClubSuggestions, vì autocomplete sẽ hoạt động rỗng
      }
    };
    loadClubs();
  }, []);

  const handleSelectSuggestion = (player) => {
    setNewCompetitor({
      name: player.name,
      phone: player.phone,
      nickname: player.nickname || '',
      club: player.club || '',
      uniform_size: 'L',
      selected_date: ''
    });
    setPlayerSearchText(player.id);
    setPlayerSuggestions([]);
  };

  const handleAddCompetitor = async (e) => {
    e.preventDefault();

    if (!newCompetitor.name || !newCompetitor.phone) {
      alert('Vui lòng nhập đầy đủ tên và số điện thoại VĐV.');
      return;
    }

    // Kiểm tra selected_date hợp lệ (nếu có)
    if (newCompetitor.selected_date) {
      const sameDateCount = competitors.filter(c => c.selected_date === newCompetitor.selected_date).length;
      if (tournament.competitors_per_day > 0 && sameDateCount >= tournament.competitors_per_day) {
        alert(`Đã vượt quá số lượng VĐV tối đa cho ngày ${newCompetitor.selected_date}`);
        return;
      }
    }

    if (
      tournament.maximum_competitors &&
      tournament.maximum_competitors > 0
    ) {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/count?tournament_id=${tournamentId}`);
        const currentRegistered = res.data.total;

        if ((currentRegistered + competitors.length) >= tournament.maximum_competitors) {
          alert('🚫 Đã vượt quá số lượng VĐV tối đa toàn giải.');
          return;
        }
      } catch (err) {
        console.error('Lỗi kiểm tra giới hạn VĐV:', err);
        alert('Không thể kiểm tra giới hạn VĐV. Vui lòng thử lại.');
        return;
      }
    }

    // Gọi resolve-player trước khi hiển thị modal
    try {
      const resolveRes = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/resolve-player`, {
        name: newCompetitor.name,
        phone: newCompetitor.phone
      });

      if (resolveRes.data.status === 'ok') {
        setResolvedPlayerId(resolveRes.data.player_id);
        setShowConfirmModal(true);
      } else {
        setMessage('❌ Không xác định được VĐV.');
      }
    } catch (err) {
      console.error('Lỗi khi gọi resolve-player:', err);

      if (
        err.response?.status === 400 &&
        err.response.data?.message?.includes('SĐT đã tồn tại với VĐV khác.')
      ) {
        // gọi lại API để lấy thông tin chi tiết vận động viên xung đột
        try {
          const conflictRes = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/players/by-phone?phone=${newCompetitor.phone}`
          );
          const conflict = conflictRes.data;
          setConflictInfo({
            id: conflict.id,
            name: conflict.name,
            phone: conflict.phone
          });
          setShowConflictModal(true);
        } catch (fetchErr) {
          console.error('Lỗi khi lấy thông tin VĐV bị trùng:', fetchErr);
          setMessage('❌ SĐT đã được dùng bởi VĐV khác, và không thể lấy thông tin chi tiết.');
        }
      } else {
        const errorMsg = err.response?.data?.message || '❌ Lỗi khi xác định VĐV.';
        setMessage(errorMsg);
      }
    }
  };

  const confirmAddCompetitor = async () => {
    const { name, phone, nickname, club, selected_date, uniform_size } = newCompetitor;

    const duplicate = competitors.find(c => c.name === name && c.phone === phone);
    if (duplicate) {
      setMessage('Vận động viên này đã tồn tại trong danh sách.');
      setShowConfirmModal(false);
      return;
    }

    if (registrationId) {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/competitors`, {
        registration_form_id: registrationId,
        player_id: resolvedPlayerId,
        nick_name: nickname,
        club,
        uniform_size,
        selected_date: selected_date || null
      });
    }

    setCompetitors(prev => [...prev, {
      id: resolvedPlayerId,
      name,
      phone,
      nickname,
      club,
      uniform_size,
      selected_date
    }]);

    setNewCompetitor({ name: '', phone: '', nickname: '', club: '', selected_date: '', uniform_size: 'L' });
    setPlayerSearchText('');
    setShowConfirmModal(false);
    setMessage('✅ Đã thêm vận động viên.');
  };

  const getFilteredClubs = () => {
    if (!newCompetitor.club.trim()) return [];
    return clubSuggestions.filter(c =>
      c.toLowerCase().includes(newCompetitor.club.toLowerCase())
    ).slice(0, 5); // giới hạn 5 gợi ý
  };

  // const handleAddCompetitor = async (e) => {
  //   e.preventDefault();

  //   // Lấy giá trị từ newCompetitor (ban đầu)
  //   let { name, phone, nickname, club, selected_date, uniform_size } = newCompetitor;

  //   // Nếu thiếu name/phone, fallback từ playerSuggestions theo ID
  //   if ((!name || !phone) && playerSearchText && playerSearchText.length > 2) {
  //     const fallback = playerSuggestions.find(p => p.id === playerSearchText);
  //     if (fallback) {
  //       name = fallback.name;
  //       phone = fallback.phone;

  //       // Cập nhật lại state
  //       setNewCompetitor(prev => ({
  //         ...prev,
  //         name,
  //         phone
  //       }));
  //     }
  //   }

  //   // Kiểm tra bắt buộc
  //   if (!registeredPhone) {
  //     setMessage('❌ Thiếu số điện thoại người đăng ký.');
  //     return;
  //   }
  //   if (!name) {
  //     setMessage('❌ Thiếu tên VĐV.');
  //     return;
  //   }
  //   if (!phone) {
  //     setMessage('❌ Thiếu SĐT VĐV.');
  //     return;
  //   }

  //   console.log('💬 Debug:', {
  //     playerSearchText,
  //     name,
  //     phone,
  //     newCompetitor
  //   });

  //   // Kiểm tra trùng
  //   const duplicate = competitors.find(c => c.name === name && c.phone === phone);
  //   if (duplicate) {
  //     setMessage('Vận động viên này đã tồn tại trong danh sách.');
  //     return;
  //   }

  //   try {
  //     // Gọi API resolve-player
  //     const resolveRes = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/resolve-player`, {
  //       name,
  //       phone
  //     });

  //     if (resolveRes.data.status !== 'ok') {
  //       setMessage('❌ Lỗi khi xác định VĐV.');
  //       return;
  //     }

  //     const player_id = resolveRes.data.player_id;

  //     // Gửi competitor lên backend
  //     if (registrationId) {
  //       // Nếu đang chỉnh sửa đăng ký cũ → gửi lên backend
  //       await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/competitors`, {
  //         registration_form_id: registrationId,
  //         player_id,
  //         nick_name: nickname,
  //         club,
  //         uniform_size,
  //         selected_date: selected_date || null
  //       });
  //     }

  //     // Thêm vào danh sách hiển thị
  //     setCompetitors(prev => [
  //       ...prev,
  //       {
  //         id: player_id,
  //         name,
  //         phone,
  //         nickname,
  //         club,
  //         uniform_size,
  //         selected_date
  //       }
  //     ]);

  //     // Reset form
  //     setNewCompetitor({ name: '', phone: '', nickname: '', club: '', selected_date: '', uniform_size: 'L' });
  //     setPlayerSearchText('');
  //     setMessage('✅ Đã thêm vận động viên.');
  //   } catch (err) {
  //     console.error('Lỗi khi thêm VĐV:', {
  //       message: err.message,
  //       response: err.response?.data,
  //       status: err.response?.status
  //     });
  //     const errorMsg = err.response?.data?.message || '❌ Lỗi khi thêm vận động viên.';
  //     setMessage(errorMsg);
  //   }
  // };

  const handleRemove = (index) => {
    const updated = [...competitors];
    updated.splice(index, 1);
    setCompetitors(updated);
  };

  const handleRegisterSubmit = async () => {
    console.log('📤 Đăng ký với:', { tournamentId: tournament.id, registeredPhone, userId: user?.id });
    console.log('👤 Danh sách VĐV:', competitors);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form`, {
        tournament_id: tournament.id,
        registered_phone: registeredPhone,
        user_id: user?.id,
      });
      const registration_form_id = res.data.id;
      // for (const competitor of competitors) {
      //   if (!competitor.selected_date || !competitor.name || !competitor.phone) {
      //     console.error('🚫 Dữ liệu thiếu:', competitor);
      //   }
      //   await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/competitors`, {
      //     registration_form_id,
      //     name: competitor.name,
      //     phone: competitor.phone,
      //     nick_name: competitor.nickname?.trim() || competitor.name, // nếu nickname rỗng => lấy name
      //     club: competitor.club,
      //     selected_date: competitor.selected_date,
      //   });
      // }
      // ✅ Đếm số lượng đăng ký theo từng ngày
      const competitorCountByDate = {};
      for (const comp of competitors) {
        if (!comp.selected_date) continue;
        competitorCountByDate[comp.selected_date] = (competitorCountByDate[comp.selected_date] || 0) + 1;
      }

      // ✅ Kiểm tra với availableDates
      let exceeded = false;
      let overbookedDate = '';
      for (const date of Object.keys(competitorCountByDate)) {
        const remainingSlot = availableDates.find(d => d.value === date)?.remaining ?? 0;
        const toRegister = competitorCountByDate[date];
        if (toRegister > remainingSlot) {
          exceeded = true;
          overbookedDate = date;
          break;
        }
      }

      if (exceeded) {
        setMessage(`❌ Vượt quá số lượng VĐV cho ngày ${overbookedDate}. Vui lòng kiểm tra lại.`);
        return;
      }
      for (const competitor of competitors) {
        if (!competitor.name || !competitor.phone) {
          console.error('🚫 Thiếu name hoặc phone:', competitor);
          continue;
        }

        // resolve player
        const resolveRes = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/resolve-player`, {
          name: competitor.name,
          phone: competitor.phone
        });

        if (resolveRes.data.status !== 'ok') {
          console.error('❌ Lỗi khi resolve-player:', competitor);
          continue;
        }

        const player_id = resolveRes.data.player_id;

        await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/competitors`, {
          registration_form_id,
          player_id,
          nick_name: competitor.nickname?.trim() || competitor.name,
          club: competitor.club,
          uniform_size: competitor.uniform_size || 'L',
          selected_date: competitor.selected_date || null
        });
      }
      //setMessage('✅ Đăng ký thành công!');
      setCompetitors([]);
      const totalAthletes = competitors.length;
      const totalFee = totalAthletes * parseInt(tournament.attendance_price || 0);
      const { bank_name, bank_number, bank_acc_name, bank_qr } = tournament;

      if (
        totalFee &&
        bank_number?.trim() &&
        bank_acc_name?.trim() &&
        bank_name?.trim()
      ) {
        setModalInfo({
          totalAthletes,
          tournamentName: tournament.name,
          totalFee,
          bankNumber: bank_number,
          bankAccName: bank_acc_name,
          bankName: bank_name,
          bankQr: bank_qr
        });
        setShowSuccessModal(true);
      } else {
        setMessage('✅ Đăng ký thành công!');
      }

    } catch (err) {
      console.error('Đăng ký thất bại:', {
        message: err.message,
        status: err.response?.status,
        responseData: err.response?.data
      });
      setMessage(`❌ Lỗi khi gửi đăng ký: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleApproval = async (newStatus) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/registration_form/${registrationId}/approve`, { status: newStatus });
      setStatus(newStatus);
      alert('✅ Đã cập nhật trạng thái.');
    } catch (err) {
      alert('❌ Lỗi khi cập nhật trạng thái.');
    }
  };

  return (
    <div
      className="tournament-registration"
      style={{
        backgroundImage: backgroundImage ? `url(${process.env.REACT_APP_API_BASE_URL}/uploads/backgrounds/${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '40px 0',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div style={{ backgroundColor: 'white', maxWidth: 900, margin: '0 auto', padding: 20, borderRadius: 12 }}>
        <div style={{ textAlign: 'right', marginBottom: '10px' }}>
          <button
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '8px 14px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ⬅️ Quay Lại Chi Tiết Giải Đấu
          </button>
        </div>
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Đăng ký thi đấu
          <span style={getStatusStyle()}>
            {status === 1 ? 'Đã Phê Duyệt' : status === 2 ? 'Đã Hủy' : 'Chưa Phê Duyệt'}
          </span>
        </h2>

        {user?.user_type === 2 && registrationId && (
          <div style={{ marginBottom: 10 }}>
            <button onClick={() => handleApproval(1)} style={{ marginRight: 10 }}>✔️ Phê Duyệt</button>
            <button onClick={() => handleApproval(2)}>❌ Từ Chối</button>
          </div>
        )}

        {tournament && (
          <div className="tournament-info">
            <p><strong>Tên giải:</strong> {tournament.name}</p>
            <p>
              <strong>Thời gian:</strong>{' '}
              {tournament.start_date?.slice(0, 10)} → {tournament.end_date?.slice(0, 10)}
            </p>
            <p><strong>Địa điểm:</strong> {tournament.location}</p>
            <p><strong>Nội dung:</strong> {tournament.content}</p>
          </div>
        )}

        <div style={{ margin: '40px 0 20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '22px', color: '#333' }}>📝 Điền Thông Tin Vận Động Viên</h3>
        </div>

        <form onSubmit={handleAddCompetitor}>
          {/* ✅ SĐT Người đăng ký */}
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '160px', fontWeight: 'bold' }}>SĐT Người đăng ký:</label>
            <input
              type="text"
              placeholder="Số điện thoại người đăng ký (*)"
              value={registeredPhone}
              onChange={(e) => setRegisteredPhone(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          {/* ✅ ID VĐV */}
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '160px', fontWeight: 'bold' }}>ID VĐV:</label>
            <input
              type="text"
              placeholder="Gõ vài ký tự đầu để được gợi ý. ID có dạng H01234"
              value={playerSearchText}
              onChange={(e) => setPlayerSearchText(e.target.value.toUpperCase())}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          {/* Gợi ý theo ID nhập ở playerSearchText */}
          {playerSearchText &&
          playerSuggestions.length > 0 &&
          newCompetitor.name === '' &&
          newCompetitor.phone === '' && (
            <ul className="autocomplete-list">
              {playerSuggestions.map((p) => (
                <li key={p.id} onClick={() => handleSelectSuggestion(p)}>
                  #{p.id} - {p.name} ({p.phone})
                </li>
              ))}
            </ul>
          )}
{/*
          {playerSuggestions.length > 0 && (
            <ul className="autocomplete-list">
              {playerSuggestions.map((p) => (
                <li key={p.id} onClick={() => handleSelectSuggestion(p)}>
                  #{p.id} - {p.name} ({p.phone})
                </li>
              ))}
            </ul>
          )}
        */}
          {/* ✅ Tên VĐV */}
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '160px', fontWeight: 'bold' }}>Tên VĐV:</label>
            <input
              type="text"
              placeholder="Tên VĐV có dấu (*)"
              value={newCompetitor.name}
              onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value.toUpperCase() })}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          {/* Gợi ý khi nhập tên mà chưa nhập ID hoặc SĐT */}
          {newCompetitor.name &&
          !newCompetitor.phone &&
          !playerSearchText &&
          playerSuggestions.length > 0 && (
            <ul className="autocomplete-list">
              {playerSuggestions.map((p) => (
                <li key={p.id} onClick={() => handleSelectSuggestion(p)}>
                  #{p.id} - {p.name} ({p.phone})
                </li>
              ))}
            </ul>
          )}

          {/* ✅ SĐT VĐV */}
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '160px', fontWeight: 'bold' }}>SĐT VĐV:</label>
            <input
              type="text"
              placeholder="SĐT VĐV (*)"
              value={newCompetitor.phone}
              onChange={(e) =>
                setNewCompetitor({ ...newCompetitor, phone: e.target.value })
              }
              onClick={() => {
                if (newCompetitor.phone.trim().toLowerCase() === 'unknown') {
                  // Clear value AND reset màu đen
                  setNewCompetitor({ ...newCompetitor, phone: '' });
                }
              }}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                color:
                  newCompetitor.phone.trim().toLowerCase() === 'unknown'
                    ? 'red'
                    : 'black',
                fontWeight:
                  newCompetitor.phone.trim().toLowerCase() === 'unknown'
                    ? 'bold'
                    : 'normal'
              }}
            />
          </div>
          {/* Gợi ý khi nhập SĐT mà chưa có name/ID */}
          {newCompetitor.phone &&
          !newCompetitor.name &&
          !playerSearchText &&
          playerSuggestions.length > 0 && (
            <ul className="autocomplete-list">
              {playerSuggestions.map((p) => (
                <li key={p.id} onClick={() => handleSelectSuggestion(p)}>
                  #{p.id} - {p.name} ({p.phone})
                </li>
              ))}
            </ul>
          )}

          {/* ✅ Nickname */}
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '160px', fontWeight: 'bold' }}>Nickname:</label>
            <input
              type="text"
              placeholder="Tên thường gọi (cho phép bỏ trống)"
              value={newCompetitor.nickname}
              onChange={(e) => setNewCompetitor({ ...newCompetitor, nickname: e.target.value })}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          {/* ✅ Đơn vị */}
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '160px', fontWeight: 'bold' }}>Đơn vị:</label>
            <input
              type="text"
              placeholder="Tên CLB hoặc nơi sinh hoạt (*)"
              value={newCompetitor.club}
              onChange={(e) => setNewCompetitor({ ...newCompetitor, club: e.target.value })}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          {getFilteredClubs().length > 0 && (
            <ul className="autocomplete-list">
              {getFilteredClubs().map((club, idx) => (
                <li key={idx} onClick={() => setNewCompetitor({ ...newCompetitor, club })}>
                  {club}
                </li>
              ))}
            </ul>
          )}

          {/*<select
            value={newCompetitor.uniform_size}
            onChange={(e) => setNewCompetitor({ ...newCompetitor, uniform_size: e.target.value })}
            required
          >
            <option value="">-- Chọn size đồng phục --</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>*/}

          {/* ✅ Chọn ngày thi đấu */}
          {availableDates.length > 0 ? (
            <div style={{ marginBottom: '10px' }}>
              <label><strong>Chọn 1 ngày thi đấu (nếu đã hết suất, chọn "Không chọn ngày"):</strong></label>
              <div className="date-radio-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="selected_date"
                    value=""
                    checked={newCompetitor.selected_date === ''}
                    onChange={() => setNewCompetitor({ ...newCompetitor, selected_date: '' })}
                  />
                  <span>Không chọn ngày</span>
                </label>

                {availableDates.map(({ value, display, remaining }) => (
                  <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      name="selected_date"
                      value={value}
                      checked={newCompetitor.selected_date === value}
                      onChange={(e) => setNewCompetitor({ ...newCompetitor, selected_date: e.target.value })}
                    />
                    <span>{display} (còn lại: {remaining})</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '10px' }}>
              <strong>Không có ngày thi đấu cụ thể — sẽ để trống ngày thi đấu.</strong>
            </div>
          )}

          <button type="submit">➕ Thêm vận động viên</button>

          {message && (
            <div className={message.includes('Lỗi') ? 'error-message' : 'success-message'}>
              {message}
            </div>
          )}
        </form>

        <ReactModal
          isOpen={showConfirmModal}
          onRequestClose={() => setShowConfirmModal(false)}
          ariaHideApp={false}
          style={{
            overlay: { backgroundColor: 'rgba(0,0,0,0.4)' },
            content: { maxWidth: '500px', margin: 'auto', padding: '20px', borderRadius: '12px' }
          }}
        >
          <h2>Xác Nhận Thông Tin Vận Động Viên</h2>
          <p>Hãy Xác Nhận Lại Thông Tin Đăng Ký Của Vận Động Viên</p>
          <p><strong>ID Vận Động Viên:</strong> {resolvedPlayerId}</p>
          <p><strong>Tên Vận Động Viên:</strong> {newCompetitor.name}</p>
          <p><strong>Số Điện Thoại:</strong> {newCompetitor.phone}</p>
          <p>Chú ý: Sau khi thêm đầy đủ danh sách vận động viên, phải bấm nút Gửi Đăng Ký</p>
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button onClick={() => setShowConfirmModal(false)} style={{ marginRight: '10px' }}>Hủy</button>
            <button onClick={confirmAddCompetitor} style={{ backgroundColor: '#28a745', color: 'white', padding: '6px 14px' }}>Xác Nhận</button>
          </div>
        </ReactModal>

        {competitors.length > 0 && (
          <>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: 20,
              fontSize: '15px',
              backgroundColor: '#fefefe',
              boxShadow: '0 0 5px rgba(0,0,0,0.1)'
            }}>
              <thead style={{ backgroundColor: '#e9f5e9' }}>
                <tr>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>#</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Tên</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>SĐT</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Nickname</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Đơn vị</th>
                  {/*<th style={{ padding: '10px', border: '1px solid #ccc' }}>Size</th>*/}
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Ngày thi đấu</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Xoá</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{i + 1}</td>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{c.name}</td>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{c.phone}</td>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{c.nickname}</td>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{c.club}</td>
                    {/*<td style={{ padding: '8px', border: '1px solid #ccc' }}>{c.uniform_size}</td>*/}
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{c.selected_date}</td>
                    <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                      <button onClick={() => handleRemove(i)} style={{
                        background: 'none',
                        border: 'none',
                        color: 'red',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}>✖</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={handleRegisterSubmit}
              style={{
                marginTop: '30px',
                padding: '14px 24px',
                backgroundColor: '#007bff',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}
            >
              📤 Gửi Đăng Ký
            </button>
          </>
        )}
      </div>
        <ReactModal
          isOpen={showSuccessModal}
          onRequestClose={() => setShowSuccessModal(false)}
          ariaHideApp={false}
          style={{
            overlay: { backgroundColor: 'rgba(0,0,0,0.4)' },
            content: {
              maxWidth: '500px',
              margin: 'auto',
              padding: '20px',
              borderRadius: '12px'
            }
          }}
        >
          <h2>📢 Thông tin nộp lệ phí</h2>
          <p>
            Hãy chuyển số tiền&nbsp;
            <strong>{(modalInfo.totalFee || 0).toLocaleString('vi-VN')} VND</strong>
            &nbsp;đến tài khoản sau:
          </p>
          <p>
            📄 <strong>Số tài khoản:</strong> {modalInfo.bankNumber}
          </p>
          <p>
            👤 <strong>Chủ tài khoản:</strong> {modalInfo.bankAccName}
          </p>
          <p>
            🏦 <strong>Ngân hàng:</strong> {modalInfo.bankName}
          </p>

          {modalInfo.bankQr && (
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <p><strong>Hoặc quét mã QR để thanh toán:</strong></p>
              <img
                src={`${process.env.REACT_APP_API_BASE_URL}/uploads/qr/${modalInfo.bankQr}`}
                alt="QR chuyển khoản"
                style={{ width: '220px', borderRadius: '12px', boxShadow: '0 0 6px rgba(0,0,0,0.3)' }}
                onError={(e) => (e.target.style.display = 'none')}
              />
            </div>
          )}

          {tournament?.registration_method && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f1f1f1', borderRadius: '8px' }}>
              <strong>📌 Cú pháp nội dung chuyển khoản:</strong>
              <p style={{ marginTop: '6px', whiteSpace: 'pre-wrap' }}>{tournament.registration_method}</p>
            </div>
          )}
          
          <p style={{ marginTop: '10px', color: '#cc7000' }}>
            Sau khi chuyển khoản hoàn tất lệ phí, BTC sẽ phê duyệt và bạn sẽ có tên trên danh sách thi đấu.
          </p>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#28a745',
                color: '#fff',
                border: 'none',
                fontWeight: 'bold'
              }}
            >
              Đóng
            </button>
          </div>
        </ReactModal>
        <ReactModal
          isOpen={showConflictModal}
          onRequestClose={() => setShowConflictModal(false)}
          ariaHideApp={false}
          style={{
            overlay: { backgroundColor: 'rgba(0,0,0,0.4)' },
            content: { maxWidth: '500px', margin: 'auto', padding: '20px', borderRadius: '12px' }
          }}
        >
          <h2>⚠️ Số điện thoại đã tồn tại</h2>
          <p>Số điện thoại này đã được đăng ký cho vận động viên:</p>
          <p><strong>ID:</strong> {conflictInfo.id}</p>
          <p><strong>Tên:</strong> {conflictInfo.name}</p>
          <p><strong>Số điện thoại:</strong> {conflictInfo.phone}</p>
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button
              onClick={() => setShowConflictModal(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#007bff',
                color: '#fff',
                border: 'none',
                fontWeight: 'bold'
              }}
            >
              Xác Nhận
            </button>
          </div>
        </ReactModal>
    </div>
  );
};

export default TournamentRegistration;
const EditPlayerModal = ({ isOpen, player, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({ ...player });

  useEffect(() => {
    setFormData({ ...player });
  }, [player]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  const handleConfirm = () => {
    const now = new Date().toISOString();
    const updatedPlayer = {
      ...formData,
      modified_date: now
    };
    onConfirm(updatedPlayer);
  };

  if (!isOpen || !formData) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Cập nhật vận động viên</h3>
        <div className="modal-grid">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Họ tên" />
          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Số điện thoại" />
          <select name="gender" value={formData.gender} onChange={handleSelectChange}>
            <option value={0}>Nam</option>
            <option value={1}>Nữ</option>
            <option value={2}>Chưa rõ</option>
          </select>
          {/* Các trường khác tương tự */}
        </div>
        <div className="modal-actions">
          <button onClick={handleConfirm} className="btn btn-confirm">Lưu</button>
          <button onClick={onClose} className="btn btn-cancel">Huỷ</button>
        </div>
      </div>
    </div>
  );
};

export default EditPlayerModal;
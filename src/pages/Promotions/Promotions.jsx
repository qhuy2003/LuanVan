// src/pages/Admin/Promotions/Promotions.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../Products/Product.module.scss'; 
import UserMenu from '../../components/UserMenu/UserMenu';
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  toggleActive
} from '../../api/PromotionApi';
import { toast } from 'react-toastify';

function Promotions() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = user?.role === 'admin';
  const isBrand = user?.role === 'brand';
  const [form, setForm] = useState({
    code: '', name: '', description: '', type: 'percentage', value: 0, max_discount: null,
    min_order_amount: 0, usage_limit: null, scope: 'all', product_ids: [], category_ids: [],
    start_date: '', end_date: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPromotions();
      setPromotions(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load() }, []);
useEffect(() => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    navigate('/login');
    return;
  }

  if (!['admin', 'brand'].includes(user.role)) {
    toast.error('Bạn không có quyền truy cập trang này!');
    navigate('/login');
    return;
  }

  load();
}, [navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      code: form.code.toUpperCase(),
      name: form.name,
      description: form.description || null,
      type: form.type,
      value: Number(form.value),
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      min_order_amount: Number(form.min_order_amount),
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      scope: form.scope,
      start_date: form.start_date,
      end_date: form.end_date,
      is_active: true,
      product_ids: form.scope === 'products' ? form.product_ids : [],
      category_ids: form.scope === 'categories' ? form.category_ids : [],
    };

    try {
      if (editing?.promotion_id) {
      await updatePromotion(editing.promotion_id, payload);
      }
      else await createPromotion(payload);
      setEditing(null);
      setForm({ code: '', name: '', description: '', type: 'percentage', value: 0, max_discount: null, min_order_amount: 0, usage_limit: null, scope: 'all', product_ids: [], category_ids: [], start_date: '', end_date: '' });
      load();
    } catch (err) {}
  };

  const onEdit = (p) => {
    setEditing(p);
    setForm({
      code: p.code || '',
      name: p.name || '',
      description: p.description || '',
      type: p.type || 'percentage',
      value: p.value || 0,
      max_discount: p.max_discount || '',
      min_order_amount: p.min_order_amount || 0,
      usage_limit: p.usage_limit || '',
      scope: p.scope || 'all',
      product_ids: p.targets?.filter(t => t.product_id).map(t => t.product_id) || [],
      category_ids: p.targets?.filter(t => t.category_id).map(t => t.category_id) || [],
      start_date: p.start_date ? p.start_date.split(' ')[0] : '',
      end_date: p.end_date ? p.end_date.split(' ')[0] : '',
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm('Xóa khuyến mãi này?')) return;
    try {
      await deletePromotion(id);
      load();
    } catch (err) {}
  };

  const onToggle = async (id) => {
    try {
      await toggleActive(id);
      load();
    } catch (err) {}
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar giống hệt trang Sản phẩm */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
            <h2>{isAdmin ? 'Admin' : 'Nhãn hàng'}</h2>
        </div>
        <nav>
          <ul>
                      {isAdmin && (
                        <>
                          <li onClick={() => navigate('/admin/users')}>👤Quản lý người dùng</li>
                          <li className={styles.active}>🛍️Quản lý sản phẩm</li>
                          <li onClick={() => navigate('/admin/categories')}>📁Quản lý loại hàng hóa</li>
                          <li onClick={() => navigate("/admin/promotions")}>🎫 Quản lý khuyến mãi</li>       
                          <li onClick={() => navigate("/admin/orders")}>📦Quản lý đơn hàng</li>
                          <li onClick={() => navigate("/admin/statistics")}>📊 Thống kê </li>
                        </>
                      )}
                      {isBrand && (
                        <>
                          <li className={styles.active}>🛍️Quản lý sản phẩm</li>
                          <li onClick={() => navigate('/brand/categories')}>📁Quản lý loại hàng hóa</li>
                          <li onClick={() => navigate("/brand/promotions")}>🎫 Quản lý khuyến mãi</li>       
                          <li onClick={() => navigate("/brand/orders")}> 📦 Quản lý đơn hàng </li>
                          <li onClick={() => navigate("/brand/statistics")}>📊 Thống kê </li  >
                        </>
                      )}
           </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.content}>
        <header className={styles.headerBar}>
          <h1>Quản lý Khuyến mãi</h1>
          <UserMenu />
        </header>

        <div className={styles.productPage}>
          <div className={styles.header}>
            <h1>Danh sách khuyến mãi</h1>
            <button className={styles.addButton} onClick={() => setEditing({})}>
              + Thêm khuyến mãi
            </button>
          </div>

          <div className={styles.productList}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</p>
            ) : promotions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>Chưa có khuyến mãi nào</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên chương trình</th>
                    <th>Loại</th>
                    <th>Giá trị</th>
                    <th>Đơn tối thiểu</th>
                    <th>Hiệu lực</th>
                    <th>Số lần dùng</th>
                    <th>Trạng thái</th>
                    <th>Người tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map(p => (
                    <tr key={p.promotion_id}>
                      <td><strong>{p.code}</strong></td>
                      <td>{p.name}</td>
                      <td>
                        {p.type === 'percentage' ? 'Giảm %' : p.type === 'fixed_amount' ? 'Giảm tiền' : 'Miễn ship'}
                      </td>
                      <td>
                        {p.type === 'percentage' && `${p.value}%`}
                        {p.type === 'fixed_amount' && `${Number(p.value).toLocaleString('vi-VN')}đ`}
                        {p.type === 'free_shipping' && 'Miễn phí ship'}
                        {p.max_discount && ` (tối đa ${Number(p.max_discount).toLocaleString()}đ)`}
                      </td>
                      <td>{Number(p.min_order_amount).toLocaleString('vi-VN')}đ</td>
                      <td>
                        {new Date(p.start_date).toLocaleDateString()} →<br />
                        {new Date(p.end_date).toLocaleDateString()}
                      </td>
                      <td>{p.usage_limit ? `${p.used_count || 0}/${p.usage_limit}` : 'Vô hạn'}</td>
                      <td>
                        <span className={p.is_active ? styles.statusActive : styles.statusInactive}>
                          {p.is_active ? 'Hoạt động' : 'Đã tắt'}
                        </span>
                      </td>
                      <td>
                        {p.brand ?'Nhãn hàng: '+p.brand.brand_name : 'Admin'}
                      </td>
                      <td className={styles.tdActions}>
                        <button className={styles.editButton} onClick={() => onEdit(p)}>Sửa</button>
                        <button className={styles.deleteButton} onClick={() => onDelete(p.promotion_id)}>Xóa</button>
                        <button 
                          className={p.is_active ? styles.deactivateButton : styles.activateButton}
                          onClick={() => onToggle(p.promotion_id)}
                        >
                          {p.is_active ? 'Tắt' : 'Bật' }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Modal tạo/sửa – đẹp như trang Sản phẩm */}
      {editing !== null && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editing.promotion_id ? 'Chỉnh sửa' : 'Tạo mới'} khuyến mãi</h2>
            <form onSubmit={submit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Mã khuyến mãi *</label>
                  <input name="code" value={form.code} onChange={onChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Tên chương trình *</label>
                  <input name="name" value={form.name} onChange={onChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Loại</label>
                  <select name="type" value={form.type} onChange={onChange}>
                    <option value="percentage">Giảm theo %</option>
                    <option value="fixed_amount">Giảm cố định</option>
                    <option value="free_shipping">Miễn phí vận chuyển</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Giá trị *</label>
                  <input type="number" name="value" value={form.value} onChange={onChange} required />
                </div>
                {form.type === 'percentage' && (
                  <div className={styles.formGroup}>
                    <label>Giảm tối đa (đ)</label>
                    <input type="number" name="max_discount" value={form.max_discount || ''} onChange={onChange} />
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label>Đơn tối thiểu (đ)</label>
                  <input type="number" name="min_order_amount" value={form.min_order_amount} onChange={onChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Số lần dùng tối đa</label>
                  <input type="number" name="usage_limit" value={form.usage_limit || ''} onChange={onChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Ngày bắt đầu *</label>
                  <input type="date" name="start_date" value={form.start_date} onChange={onChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Ngày kết thúc *</label>
                  <input type="date" name="end_date" value={form.end_date} onChange={onChange} required />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Mô tả</label>
                  <textarea name="description" value={form.description} onChange={onChange} rows={3} />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton}>
                  {editing.promotion_id ? 'Cập nhật' : 'Tạo mới'}
                </button>
                <button type="button" className={styles.cancelButton} onClick={() => setEditing(null)}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Promotions;
// src/pages/Product/Product.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import styles from './Product.module.scss';
import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from 'axios';
import {
  getProducts,
  createProduct,
  updateProduct,
  toggleVisibility,
  getShippingTypes,
} from '../../api/ProductApi';
import { getCategories } from '../../api/CategoriesApi';
import UserMenu from '../../components/UserMenu/UserMenu';

function Product() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'admin';
  const isBrand = user?.role === 'brand';

  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [shippingTypes, setShippingTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    price: '',
    weight_kg: '',
    volume_m3: '',
    stock: '',
    category_id: '',
    shipping_type_id: '',
    suggested_vehicle: '',
    brand_id: ''
  });

  const userData = localStorage.getItem('user');
  if (!userData) {
    toast.error('Vui lòng đăng nhập!');
    navigate('/login');
    return null;
  }

  useEffect(() => {
    const user = JSON.parse(userData);
    if (user.role !== 'admin' && user.role !== 'brand') {
      toast.error('Chỉ nhãn hàng và admin mới truy cập được!');
      navigate('/login');
      return;
    }
    // Chỉ kiểm tra địa chỉ kho cho Brand
  if (user.role === 'brand') {
    const checkWarehouseAddress = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://127.0.0.1:8000/api/brand/check-warehouse', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.data.has_address) {
          toast.warn('Vui lòng cập nhật địa chỉ kho hàng !', {
            position: "top-center",
            autoClose: 5000,
            toastId: 'warehouse-warning-brand',
          });
          navigate('/profile'); // Chuyển về trang cập nhật profile
        }
      } catch (err) {
        console.error('Check warehouse error:', err);
        toast.error('Lỗi kiểm tra địa chỉ kho hàng');
        navigate('/profile');
      }
    };

    checkWarehouseAddress();
  }
    fetchProducts();
    fetchCategories();
    loadShippingTypes();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Không tải được danh mục');
    }
  };

  const loadShippingTypes = async () => {
    try {
      const data = await getShippingTypes();
      setShippingTypes(data || []);
    } catch (error) {
      toast.error('Không tải được loại vận chuyển');
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      let filtered = data;

      if (isBrand) {
        const userBrandId = user?.profile?.brand_id;
        if (userBrandId) {
          filtered = data.filter(p => p.brand_id === userBrandId);
        } else {
          filtered = [];
        }
      }
      setProducts(filtered);
    } catch (error) {
      toast.error('Không thể tải danh sách sản phẩm');
    }
  };

  const handleToggleVisibility = async (productId, currentStatus) => {
    if (!isBrand) return;

    if (window.confirm(`Bạn có chắc muốn ${currentStatus ? 'Ẩn' : 'Hiện'} sản phẩm này?`)) {
      try {
        await toggleVisibility(productId);
        toast.success(`Đã ${currentStatus ? 'ẩn' : 'hiện'} sản phẩm thành công`);
        fetchProducts();
      } catch (error) {
        toast.error('Không thể thay đổi trạng thái sản phẩm');
      }
    }
  };

  const getSuggestedVehicle = (shippingTypeId) => {
    if (!shippingTypeId) return '';
    const id = Number(shippingTypeId);
    const type = shippingTypes.find(t => t.shipping_type_id === id);
    return type?.suggested_vehicle || '';
  };

  useEffect(() => {
    if (shippingTypes.length > 0 && formData.shipping_type_id) {
      const suggested = getSuggestedVehicle(formData.shipping_type_id);
      if (suggested !== formData.suggested_vehicle) {
        setFormData(prev => ({
          ...prev,
          suggested_vehicle: suggested
        }));
      }
    }
  }, [shippingTypes.length, formData.shipping_type_id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Chỉ chấp nhận file: JPG, PNG, GIF, WebP');
        e.target.value = '';
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      if (editingProduct?.image_url) {
        setImagePreview(editingProduct.image_url);
      } else {
        setImagePreview('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataSubmit = new FormData();

    formDataSubmit.append('product_name', formData.product_name.trim());
    formDataSubmit.append('description', formData.description.trim());
    formDataSubmit.append('price', Number(formData.price));
    formDataSubmit.append('weight_kg', Number(formData.weight_kg));
    formDataSubmit.append('volume_m3', Number(formData.volume_m3));
    formDataSubmit.append('stock', Number(formData.stock));
    formDataSubmit.append('category_id', Number(formData.category_id));
    formDataSubmit.append('shipping_type_id', Number(formData.shipping_type_id));
    formDataSubmit.append('suggested_vehicle', formData.suggested_vehicle || getSuggestedVehicle(formData.shipping_type_id));

    if (imageFile && imageFile instanceof File) {
      formDataSubmit.append('image', imageFile);
    }

    try {
      if (editingProduct) {
        formDataSubmit.append('_method', 'PUT');
        await updateProduct(editingProduct.product_id, formDataSubmit);
        toast.success('Cập nhật thành công');
      } else {
        await createProduct(formDataSubmit);
        toast.success('Thêm thành công');
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      const msg = error.response?.data?.message || 'Lỗi server';
      const errors = error.response?.data?.errors;
      if (errors) {
        const errMsg = Object.values(errors).flat().join(', ');
        toast.error(`${msg}: ${errMsg}`);
      } else {
        toast.error(msg);
      }
    }
  };

  const resetForm = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormData({
      product_name: '',
      description: '',
      price: '',
      weight_kg: '',
      volume_m3: '',
      stock: '',
      category_id: '',
      shipping_type_id: '',
      suggested_vehicle: '',
      brand_id: ''
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      description: product.description || '',
      price: product.price.toString(),
      weight_kg: product.weight_kg.toString(),
      volume_m3: product.volume_m3.toString(),
      stock: product.stock.toString(),
      category_id: product.category_id?.toString() || '',
      shipping_type_id: product.shipping_type_id?.toString() || '',
      suggested_vehicle: product.suggested_vehicle || '',
      brand_id: isAdmin ? product.brand_id?.toString() || '' : ''
    });
    setImagePreview(product.image_url || '');
    setImageFile(null);
    setModalOpen(true);
  };

  return (
    <div className={styles.dashboardContainer}>
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
                <li onClick={() => navigate("/admin/orders")}>📦Quản lý Đơn hàng</li>
                <li onClick={() => navigate("/admin/statistics")}>📊 Thống kê </li>
              </>
            )}
            {isBrand && (
              <>
                <li className={styles.active}>🛍️Quản lý sản phẩm</li>
                <li onClick={() => navigate('/brand/categories')}>📁Quản lý loại hàng hóa</li>
                <li onClick={() => navigate("/brand/promotions")}>🎫 Quản lý khuyến mãi</li>       
                <li onClick={() => navigate("/brand/orders")}> 📦 Quản lý đơn hàng </li>
                <li onClick={() => navigate("/brand/statistics")}>📊 Thống kê </li>
              </>
            )}
          </ul>
        </nav>
      </aside>

      <main className={styles.content}>
        <header className={styles.headerBar}>
          <h1>Quản lý Sản phẩm </h1>
          {/* - {user?.role} */}
          <UserMenu />
        </header>

        <div className={styles.productPage}>
          <div className={styles.header}>
            <h1>Danh sách sản phẩm</h1>
            {isBrand && (
              <button className={styles.addButton} onClick={() => setModalOpen(true)}>
                Thêm sản phẩm
              </button>
            )}
          </div>

          <div className={styles.productList}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ảnh</th>
                  <th>Tên</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th>Khối lượng</th>
                  <th>Kích thước</th>
                  <th>Loại hàng hóa</th>
                  <th>Loại vận chuyển</th>
                  {isBrand && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.product_id}>
                    <td>{p.product_id}</td>
                    <td>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.product_name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <div style={{ width: '50px', height: '50px', background: '#eee', borderRadius: '4px' }}></div>
                      )}
                    </td>
                    {/* <td  className={styles.productNameLink} onClick={() => navigate(`/productdetail/${p.product_id}`)}>{p.product_name}</td> */}
                   <td>{p.product_name}</td>
                    <td>{p.price}</td>
                    <td>{p.stock}</td>
                    <td>{p.is_active ? 'Hiện' : 'Ẩn'}</td>
                    <td>{p.weight_kg} kg</td>
                    <td>{p.volume_m3} m³</td>
                    <td>{p.category?.category_name}</td>
                    <td>{p.shipping_type?.name || '—'}</td>
                   
                    {isBrand && (
                      <td className={styles.tdActions}>
                        <button className={styles.editButton} onClick={() => handleEdit(p)}>Sửa</button>
                        <button
                          className={p.is_active ? styles.deactivateButton : styles.activateButton}
                          onClick={() => handleToggleVisibility(p.product_id, p.is_active)}
                        >
                          {p.is_active ? 'Ẩn' : 'Hiện'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingProduct ? 'Sửa' : 'Thêm'} sản phẩm</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Tên:</label>
                <input
                  name="product_name"
                  value={formData.product_name}
                  onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Mô tả:</label>
                <input
                  name="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Giá:</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Khối lượng(kg):</label>
                <input
                  type="number"
                  name="weight_kg"
                  value={formData.weight_kg}
                  onChange={e => setFormData({ ...formData, weight_kg: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Kích thước sau khi đóng gói (m3):</label>
                <input
                  type="number"
                  name="volume_m3"
                  value={formData.volume_m3}
                  onChange={e => setFormData({ ...formData, volume_m3: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tồn kho:</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Ảnh sản phẩm:</label>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {imagePreview && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <img
                      src={imagePreview}
                      alt="Xem trước"
                      style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                  </div>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>Loại hàng hóa:</label>
                <select
                  name="category_id"
                  value={formData.category_id || ''}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Loại vận chuyển:</label>
                <select
                  name="shipping_type_id"
                  value={formData.shipping_type_id || ''}
                  onChange={e => {
                    const id = e.target.value;
                    const suggested = getSuggestedVehicle(id);
                    setFormData(prev => ({
                      ...prev,
                      shipping_type_id: id,
                      suggested_vehicle: suggested
                    }));
                  }}
                  required
                >
                  <option value="">-- Chọn loại --</option>
                  {shippingTypes.map(type => (
                    <option key={type.shipping_type_id} value={type.shipping_type_id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Phương tiện vận chuyển:</label>
                {isBrand && (
                  <div style={{
                    padding: '8px 0',
                    fontWeight: 'bold',
                    color: formData.suggested_vehicle === 'xe_tai' ? '#d32f2f' : '#2e7d32',
                    fontSize: '15px'
                  }}>
                    {formData.suggested_vehicle === 'xe_may' ? 'Xe máy' :
                     formData.suggested_vehicle === 'xe_tai' ? 'Xe tải' : '—'}
                  </div>
                )}
                {isAdmin && (
                  <select
                    value={formData.suggested_vehicle || ''}
                    onChange={e => setFormData(prev => ({ ...prev, suggested_vehicle: e.target.value }))}
                    style={{ marginTop: '6px', width: '100%' }}
                  >
                    <option value="">— Chọn lại —</option>
                    <option value="xe_may">Xe máy</option>
                    <option value="xe_tai">Xe tải</option>
                  </select>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton}>Lưu</button>
                <button type="button" className={styles.cancelButton} onClick={resetForm}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Product;
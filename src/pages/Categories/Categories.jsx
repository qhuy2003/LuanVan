import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import styles from './Categories.module.scss';
import { getCategories, createCategories, updateCategories, deleteCategories } from '../../api/CategoriesApi';
import UserMenu from '../../components/UserMenu/UserMenu';
function Categories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user?.role === 'admin';
    const isBrand = user?.role === 'brand';
    const brandId = user?.profile?.brand_id; // Lấy từ profile khi login

    const [formData, setFormData] = useState({
        category_name: '',
        description: '',
        brand_id: brandId || '' // Brand tự động điền, admin chọn được
    });

    // Tải danh sách loại hàng hóa
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            toast.error('Không thể tải danh sách loại hàng hóa');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Brand không được sửa brand_id
        const payload = {
            category_name: formData.category_name,
            description: formData.description || null,
            brand_id: isBrand ? brandId : formData.brand_id // Brand: tự động, Admin: chọn
        };

        try {
            if (editingCategory) {
                await updateCategories(editingCategory.category_id, payload);
                toast.success('Cập nhật loại hàng hóa thành công');
            } else {
                await createCategories(payload);
                toast.success('Thêm loại hàng hóa thành công');
            }

            closeModal();
            fetchCategories();
        } catch (error) {
            const msg = error?.response?.data?.message || 'Lưu thất bại!';
            toast.error(msg);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingCategory(null);
        setFormData({
            category_name: '',
            description: '',
            brand_id: brandId || ''
        });
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            category_name: category.category_name,
            description: category.description || '',
            brand_id: category.brand_id?.toString() || ''
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa loại hàng hóa này?')) {
            try {
                await deleteCategories(id);
                toast.success('Xóa thành công');
                fetchCategories();
            } catch (error) {
                toast.error('Không thể xóa (có thể đã có sản phẩm thuộc loại này)');
            }
        }
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
                                <li onClick={() => navigate('/admin/products')}>🛍️Quản lý sản phẩm</li>
                                <li className={styles.active}>📁Quản lý loại hàng hóa</li>
                                <li onClick={() => navigate("/admin/promotions")}>🎫Quản lý khuyến mãi</li>
                                <li onClick={() => navigate("/admin/orders")}>📦Quản lý đơn hàng</li>

                            </>
                        )}
                        {isBrand && (
                            <>
                                <li onClick={() => navigate("/brand/products")}>🛍️Quản lý sản phẩm</li>
                                <li className={styles.active}>📁Quản lý loại hàng hóa</li>
                                <li onClick={() => navigate("/brand/promotions")}>🎫Quản lý khuyến mãi</li>
                                <li onClick={() => navigate("/brand/orders")}>📦Quản lý đơn hàng</li>
                                <li onClick={() => navigate("/brand/statistics")}>📊 Thống kê </li>

                            </>
                        )}
                    </ul>
                </nav>
            </aside>

            <main className={styles.content}>
                <header className={styles.headerBar}>
                    <h1>Quản lý loại hàng hóa</h1>
                    <UserMenu />
                </header>

                <div className={styles.categoryPage}>
                    <div className={styles.header}>
                        <h2>Danh sách loại hàng hóa</h2>
                    {isBrand && ( 
                        <button className={styles.addButton} onClick={() => setModalOpen(true)}>
                            + Thêm loại hàng hóa mới
                        </button> )}
                    </div>

                    {categories.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>Chưa có loại hàng hóa nào.</p>
                            <button className={styles.addButton} onClick={() => setModalOpen(true)}>
                                Thêm loại hàng hóa đầu tiên
                            </button>
                        </div>
                    ) : (
                        <div className={styles.categoryList}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên loại hàng hóa</th>
                                        <th>Mô tả</th>
                                        {isAdmin && <th>Brand ID</th>}
                                      {isBrand && <th>Hành động</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((cat) => (
                                        <tr key={cat.category_id}>
                                            <td>{cat.category_id}</td>
                                            <td>{cat.category_name}</td>
                                            <td>{cat.description || '—'}</td>
                                            {isAdmin && <td>{cat.brand_id}</td>}
                                            <td className={styles.actionButtons}>
  {isBrand && (
    <>
      <button 
        className={styles.editButton} 
        onClick={() => handleEdit(cat)}
      >
        Sửa
      </button>
      <button 
        className={styles.deleteButton} 
        onClick={() => handleDelete(cat.category_id)}
        disabled={cat.has_products} // Nếu bạn có trường này để kiểm tra còn sản phẩm không
        title={cat.has_products ? 'Không thể xóa vì còn sản phẩm thuộc loại này' : 'Xóa loại hàng hóa'}
      >
        Xóa
      </button>
    </>
  )}
</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal thêm/sửa */}
            {modalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>{editingCategory ? 'Sửa loại hàng hóa' : 'Thêm loại hàng hóa mới'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Tên loại hàng hóa <span className={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    name="category_name"
                                    value={formData.category_name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="VD: Áo thun, Điện thoại, Mỹ phẩm..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Mô tả</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="Mô tả ngắn về loại hàng hóa (tùy chọn)"
                                />
                            </div>

                            {/* Admin mới được chọn Brand ID */}
                            {isAdmin && (
                                <div className={styles.formGroup}>
                                    <label>Brand ID <span className={styles.required}>*</span></label>
                                    <input
                                        type="number"
                                        name="brand_id"
                                        value={formData.brand_id}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                    />
                                </div>
                            )}

                            {/* Brand thì tự động điền (ẩn) */}
                            {isBrand && (
                                <input type="hidden" name="brand_id" value={brandId} />
                            )}

                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.submitButton}>
                                    {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                                <button type="button" className={styles.cancelButton} onClick={closeModal}>
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

export default Categories;
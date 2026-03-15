import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import styles from './Users.module.scss';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/UserApi';
import axios from 'axios';
import UserMenu from '../../components/UserMenu/UserMenu';
function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const user = JSON.parse(localStorage.getItem("user"));
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: '',
        phone_number: '',
        address: ''
    });

    // Fetch users list
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            toast.error('Không thể tải danh sách người dùng');
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
        try {
            if (editingUser) {
                await updateUser(editingUser.user_id, formData);
                toast.success('Cập nhật người dùng thành công');
            } else {
                await createUser(formData);
                toast.success('Thêm người dùng thành công');
            }

            setModalOpen(false);
            setEditingUser(null);
            setFormData({
                full_name: '',
                email: '',
                password: '',
                role: '',
                phone_number: '',
                address: ''
            });
            fetchUsers();
        } catch (error) {
            const resp = error?.response?.data;
            if (resp) {
                if (resp.errors) {
                    Object.values(resp.errors).flat().forEach(msg => toast.error(msg));
                } else if (resp.message) {
                    toast.error(resp.message);
                }
            } else {
                toast.error('Có lỗi xảy ra khi lưu thông tin');
            }
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            phone_number: user.phone_number || '',
            address: user.address || ''
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            try {
                await deleteUser(id);
                toast.success('Xóa người dùng thành công');
                fetchUsers();
            } catch (error) {
                toast.error('Không thể xóa người dùng');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div className={styles.dashboardContainer}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <h2>Admin</h2>
                </div>
                <nav>
                    <ul>
                        <li className={styles.active} onClick={() => navigate("/admin/users")}>👤 Quản lý người dùng</li>
                        <li onClick={() => navigate("/admin/products")}>🛍️ Quản lý sản phẩm</li>
                        <li onClick={() => navigate("/admin/categories")}>📁 Quản lý loại hàng hóa</li>
                        <li onClick={() => navigate("/admin/promotions")}>🎫 Quản lý khuyến mãi</li>       
                        <li onClick={() => navigate("/admin/orders")}> 📦 Quản lý Đơn hàng </li>
                        <li onClick={() => navigate("/admin/statistics")}>📊 Thống kê </li>

                    </ul>
                </nav>
            </aside>

            <main className={styles.content}>
                <header className={styles.headerBar}>
                <h1>Quản lý Sản phẩm - {user?.role}</h1>
                <UserMenu />
                </header>
                <div className={styles.userPage}>
                    <div className={styles.header}>
                        <button
                            className={styles.addButton}
                            onClick={() => {
                                setEditingUser(null);
                                setFormData({
                                    full_name: '',
                                    email: '',
                                    password: '',
                                    role: '',
                                    phone_number: '',
                                    address: ''
                                });
                                setModalOpen(true);
                            }}
                        >
                            Thêm người dùng mới
                        </button>
                    </div>

                    <div className={styles.userList}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Tên</th>
                                    <th>Email</th>
                                    <th>Vai trò</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.user_id}>
                                        <td>{user.full_name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                        <td>
                                            <button
                                                className={styles.editButton}
                                                onClick={() => handleEdit(user)}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                className={styles.deleteButton}
                                                onClick={() => handleDelete(user.user_id)}
                                            >
                                                Xóa
                                            </button>
                                        </td>
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
                        <h2>{editingUser ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Tên:</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Email:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {!editingUser && (
                                <div className={styles.formGroup}>
                                    <label>Mật khẩu:</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required={!editingUser}
                                    />
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label>Vai trò:</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Chọn vai trò</option>
                                    <option value="brand">Nhà cung cấp</option>
                                    <option value="retailer">Nhà bán lẻ</option>
                                    <option value="shipper">Nhân viên giao hàng</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Số điện thoại:</label>
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Địa chỉ:</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.submitButton}>
                                    {editingUser ? 'Cập nhật' : 'Thêm'}
                                </button>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
                                    onClick={() => {
                                        setModalOpen(false);
                                        setEditingUser(null);
                                        setFormData({
                                            full_name: '',
                                            email: '',
                                            password: '',
                                            role: '',
                                            phone_number: '',
                                            address: ''
                                        });
                                    }}
                                >
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

export default Users;
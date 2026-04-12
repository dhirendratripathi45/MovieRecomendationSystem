import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="admin-layout-clean">
            <main className="admin-main-full">
                <div className="admin-page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;

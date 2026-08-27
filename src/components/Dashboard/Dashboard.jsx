import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { useUser } from '../../context/UserContext';

const Dashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <div>
          <h1>Sports Management Dashboard</h1>
          <p>
            Welcome back, <strong>{user?.member_name || user?.email || 'Member'}</strong>
            {user?.member_id && <span style={{ fontSize: '0.85rem', color: '#6b7280', marginLeft: '8px' }}>(ID: #{user.member_id})</span>}
          </p>
        </div>
        <div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Issued</h3>
          <div className="stat-value">24</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
          <h3>Active Students</h3>
          <div className="stat-value">150</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
          <h3>Sports Categories</h3>
          <div className="stat-value">5</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <h3>Server Status</h3>
          <div className="stat-value" style={{ fontSize: '18px', color: '#10b981' }}>Connected</div>
        </div>
      </div>

      <div className="actions-section">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button onClick={() => navigate('/issue-equipment')} className="action-btn">
            ➕ Issue Equipment to Student
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

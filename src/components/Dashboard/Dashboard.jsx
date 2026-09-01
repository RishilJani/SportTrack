import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, PackagePlus, Package, Users, Trophy, Activity } from 'lucide-react';
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
            Welcome back, <span className="user-name-highlight">{user?.member_name || user?.email || 'Member'}</span>
          </p>
        </div>
        <div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Total Issued</h3>
            <Package size={20} className="stat-icon" color="#3b82f6" />
          </div>
          <div className="stat-value">24</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="stat-card-header">
            <h3>Active Students</h3>
            <Users size={20} className="stat-icon" color="#10b981" />
          </div>
          <div className="stat-value">150</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="stat-card-header">
            <h3>Sports Categories</h3>
            <Trophy size={20} className="stat-icon" color="#f59e0b" />
          </div>
          <div className="stat-value">5</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="stat-card-header">
            <h3>Server Status</h3>
            <Activity size={20} className="stat-icon" color="#8b5cf6" />
          </div>
          <div className="stat-value" style={{ fontSize: '18px', color: '#10b981' }}>Connected</div>
        </div>
      </div>

      <div className="actions-section">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button onClick={() => navigate('/issue-equipment')} className="action-btn">
            <PackagePlus size={18} />
            Issue Equipment to Student
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

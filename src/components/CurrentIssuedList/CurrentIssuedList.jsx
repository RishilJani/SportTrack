import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, AlertCircle, Loader2, UserCheck, Package } from 'lucide-react';
import './CurrentIssuedList.css';

const CurrentIssuedList = ({ onCountUpdate }) => {
  const [issuedList, setIssuedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIssuedList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:4221/issue/current');
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setIssuedList(list);
      if (onCountUpdate) {
        onCountUpdate(list.length);
      }
    } catch (err) {
      console.error('Failed to fetch issued list:', err);
      setError(err.message || 'Failed to load issued records');
    } finally {
      setLoading(false);
    }
  }, [onCountUpdate]);

  useEffect(() => {
    fetchIssuedList();
  }, [fetchIssuedList]);

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="issued-section">
      <div className="issued-section-header">
        <div className="title-with-count">
          <h2>Current Issued Equipment</h2>
          <span className="count-badge">{issuedList.length}</span>
        </div>
        <div>

          <button onClick={fetchIssuedList} className="refresh-btn" disabled={loading} title="Refresh List">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="state-container">
          <Loader2 size={24} className="spinning" color="#3b82f6" />
          <p>Fetching current issued list...</p>
        </div>
      ) : error ? (
        <div className="state-container error-state">
          <AlertCircle size={24} color="#ef4444" />
          <p>{error}</p>
          <button onClick={fetchIssuedList} className="retry-btn">Try Again</button>
        </div>
      ) : issuedList.length === 0 ? (
        <div className="state-container empty-state">
          <Package size={32} color="#9ca3af" />
          <p>No equipment currently issued.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="issued-table">
            <thead>
              <tr>
                <th>Issue ID</th>
                <th>Student Info</th>
                <th>Equipments Issued</th>
                <th>Issued By</th>
                <th>Issue Time</th>
              </tr>
            </thead>
            <tbody>
              {issuedList.map((item) => (
                <tr key={item.issue_id}>
                  <td className="issue-id-cell">#{item.issue_id}</td>
                  <td>
                    <div className="student-info">
                      <span className="student-name">{item.student_name}</span>
                      <div className="student-subtext">
                        <span>Enroll: {item.enrollment}</span>
                        {item.phone && <span> • Ph: {item.phone}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="equipment-tags">
                      {item.equipments && item.equipments.map((eq, idx) => (
                        <span key={idx} className="equipment-tag">
                          {eq.equipment_name}
                          <span className="qty-badge">x{eq.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="member-info">
                      <UserCheck size={14} color="#6b7280" />
                      <span>{item.member_name || `Member #${item.member_id}`}</span>
                    </div>
                  </td>
                  <td className="time-cell">
                    <Clock size={13} color="#6b7280" />
                    <span>{formatDate(item.issue_time)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CurrentIssuedList;

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, AlertCircle, Loader2, UserCheck, Package, X, MoveLeft } from 'lucide-react';
import './CurrentIssuedList.css';

const CurrentIssuedList = ({ onCountUpdate }) => {
  const [issuedList, setIssuedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Return Modal State
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [returnFormData, setReturnFormData] = useState([]);

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

  const handleOpenReturnModal = (item) => {
    setSelectedIssue(item);
    if (item.equipments) {
      const initialData = item.equipments.map(eq => ({
        issue_record_id: eq.issue_record_id || -1,
        equipment_name: eq.equipment_name,
        issued_quantity: eq.issued_quantity,
        returned_quantity: 0,
        damaged_quantity: 0,
        lost_quantity: 0
      }));
      setReturnFormData(initialData);
    } else {
      setReturnFormData([]);
    }
  };

  const handleCloseModal = () => {
    setSelectedIssue(null);
    setReturnFormData([]);
  };

  const handleFormChange = (index, field, value) => {
    const updatedForm = [...returnFormData];
    const parsedValue = parseInt(value, 10);
    updatedForm[index][field] = isNaN(parsedValue) ? 0 : parsedValue;
    setReturnFormData(updatedForm);
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handeReturnSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const equipment_list = returnFormData.map((eq) => ({
      "issue_record_id": eq.issue_record_id,
      "returned_quantity": eq.returned_quantity || 0,
      "damaged_quantity": eq.damaged_quantity || 0,
      "lost_quantity": eq.lost_quantity || 0
    }));

    const data = {
      "issue_id": selectedIssue.issue_id,
      "equipment_list": equipment_list
    };

    try {
      const response = await fetch('http://localhost:4221/issue/return', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Server returned status ${response.status}`);
      }

      handleCloseModal();
      fetchIssuedList();
    } catch (err) {
      console.error("Error submitting return:", err);
      setSubmitError(err.message || "Failed to submit return request.");
    } finally {
      setSubmitting(false);
    }
  };

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

  const isReturnValid = returnFormData.length > 0 && returnFormData.every((eq) => {
    const totalReturned = (eq.returned_quantity || 0) + (eq.damaged_quantity || 0) + (eq.lost_quantity || 0);
    return totalReturned === (eq.issued_quantity || 0);
  });

  return (
    <>
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
                  <th>Sr.</th>
                  <th>Student Info</th>
                  <th>Equipments Issued</th>
                  <th>Issued By</th>
                  <th>Issue Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {issuedList.map((item, index) => (
                  <tr key={item.issue_id}>
                    <td className="issue-id-cell">#{index + 1}</td>
                    <td>
                      <div className="student-info">
                        <span className="student-name">{item.student_name}</span>
                        <div className="student-subtext">
                          <div>Enroll: {item.enrollment}</div>
                          {item.phone && <div>Phone: {item.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="equipment-tags">
                        {item.equipments && item.equipments.map((eq, idx) => (
                          <span key={idx} className="equipment-tag">
                            {eq.equipment_name}
                            <span className="qty-badge">x{eq.issued_quantity || eq.quantity}</span>
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
                    <td>
                      <button className="return-action-btn" onClick={() => handleOpenReturnModal(item)}>
                        <MoveLeft size={14} />
                        Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Modal */}
      {selectedIssue && (
        <div className="return-modal-overlay">
          <div className="return-modal-content">
            <div className="modal-header">
              <h3>Return Equipment for {selectedIssue.student_name}</h3>
              <div>
                <button className="close-modal-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handeReturnSubmit} className="return-modal-form">
              <div className="return-equipments-list">
                {submitError && (
                  <div className="modal-error-banner">
                    <AlertCircle size={18} color="#ef4444" />
                    <span>{submitError}</span>
                  </div>
                )}
                {returnFormData.map((eq, index) => {
                  const currentSum = (eq.returned_quantity || 0) + (eq.damaged_quantity || 0) + (eq.lost_quantity || 0);
                  const isItemValid = currentSum === (eq.issued_quantity || 0);

                  return (
                    <div key={index} className={`return-equipment-card ${!isItemValid ? 'invalid-card' : ''}`}>
                      <div className="eq-card-header">
                        <h4 className="eq-title">{eq.equipment_name}</h4>
                        <span className={`qty-sum-status ${isItemValid ? 'status-valid' : 'status-invalid'}`}>
                          Total: {currentSum} / {eq.issued_quantity}
                        </span>
                      </div>
                      <div className="eq-inputs-grid">
                        <div className="input-group">
                          <label>Issued Qty</label>
                          <input type="number" value={eq.issued_quantity} readOnly className="read-only-input" />
                        </div>
                        <div className="input-group">
                          <label>Returned</label>
                          <input type="number" min="0" max={eq.issued_quantity} value={eq.returned_quantity} onChange={(e) => handleFormChange(index, 'returned_quantity', e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>Damaged</label>
                          <input type="number" min="0" max={eq.issued_quantity} value={eq.damaged_quantity} onChange={(e) => handleFormChange(index, 'damaged_quantity', e.target.value)} />
                        </div>
                        <div className="input-group warning-group">
                          <label>Lost</label>
                          <input type="number" min="0" max={eq.issued_quantity} value={eq.lost_quantity} onChange={(e) => handleFormChange(index, 'lost_quantity', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={!isReturnValid || submitting}>
                  {submitting ? 'Processing...' : 'Process Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CurrentIssuedList;

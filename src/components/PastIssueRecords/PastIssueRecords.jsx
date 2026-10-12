import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './PastIssueRecords.css';
import {
  MoveLeft,
  Calendar,
  RefreshCw,
  Search,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  AlertCircle,
  X,
  User,
  Phone,
  GraduationCap,
  Eye,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const API_BASE = 'http://localhost:4221/issue';

const PastIssueRecords = () => {
  const navigate = useNavigate();

  // Helper for today's date formatted as YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'RETURNED' | 'PENDING'
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Fetch data for the selected date
  const fetchRecords = useCallback(async (date) => {
    if (!date) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        console.log("data = ", data);
        setRecords(Array.isArray(data) ? data : []);
      } else {
        const errJson = await response.json().catch(() => ({}));
        setError(errJson.message || `Server error (${response.status})`);
        setRecords([]);
      }
    } catch (err) {
      console.error('Failed to fetch past issue records:', err);
      setError('Could not connect to backend server. Please make sure the server is running.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords(selectedDate);
  }, [selectedDate, fetchRecords]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleShiftDate = (days) => {
    const curr = new Date(selectedDate || new Date());
    curr.setDate(curr.getDate() + days);
    const dateStr = curr.toISOString().split('T')[0];
    setSelectedDate(dateStr);
  };

  // Format date-time for display
  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtered records based on search query and status filter
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      // Status filter
      if (statusFilter === 'RETURNED' && !item.return_time) return false;
      if (statusFilter === 'PENDING' && item.return_time) return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      const studentName = item.student?.student_name?.toLowerCase() || '';
      const enrollment = item.student?.enrollment?.toLowerCase() || '';
      const department = item.student?.department?.toLowerCase() || '';
      const phone = item.student?.phone?.toLowerCase() || '';
      const memberName = item.member?.member_name?.toLowerCase() || '';
      const issueId = String(item.issue_id || '');

      const equipmentMatch = item.equipments?.some(
        (eq) => eq.equipment_name?.toLowerCase().includes(q)
      );

      return (
        studentName.includes(q) ||
        enrollment.includes(q) ||
        department.includes(q) ||
        phone.includes(q) ||
        memberName.includes(q) ||
        issueId.includes(q) ||
        equipmentMatch
      );
    });
  }, [records, statusFilter, searchQuery]);

  // Summary Metrics calculations
  const stats = useMemo(() => {
    let totalItemsIssued = 0;
    let totalItemsReturned = 0;
    let totalItemsDamaged = 0;
    let totalItemsLost = 0;
    let pendingReturnsCount = 0;

    records.forEach((record) => {
      if (!record.return_time) {
        pendingReturnsCount += 1;
      }
      if (Array.isArray(record.equipments)) {
        record.equipments.forEach((eq) => {
          totalItemsIssued += Number(eq.issued_quantity) || 0;
          totalItemsReturned += Number(eq.returned_quantity) || 0;
          totalItemsDamaged += Number(eq.damaged_quantity) || 0;
          totalItemsLost += Number(eq.lost_quantity) || 0;
        });
      }
    });

    return {
      totalRecords: records.length,
      totalItemsIssued,
      totalItemsReturned,
      totalItemsDamaged,
      totalItemsLost,
      pendingReturnsCount,
    };
  }, [records]);

  // Export to Excel
  const generateExcel = () => {
    if (records.length === 0) return;

    const exportRows = [];

    records.forEach((record, idx) => {
      const equipNames = record.equipments?.map((eq) => `${eq.equipment_name} (Qty: ${eq.issued_quantity})`).join(', ') || 'None';
      const totalIssued = record.equipments?.reduce((sum, eq) => sum + (Number(eq.issued_quantity) || 0), 0) || 0;
      const totalReturned = record.equipments?.reduce((sum, eq) => sum + (Number(eq.returned_quantity) || 0), 0) || 0;
      const totalDamaged = record.equipments?.reduce((sum, eq) => sum + (Number(eq.damaged_quantity) || 0), 0) || 0;
      const totalLost = record.equipments?.reduce((sum, eq) => sum + (Number(eq.lost_quantity) || 0), 0) || 0;

      exportRows.push({
        'Sr.': idx + 1,
        'Student Name': record.student?.student_name || 'N/A',
        'Enrollment No.': record.student?.enrollment || 'N/A',
        'Department': record.student?.department || 'N/A',
        'Phone': record.student?.phone || 'N/A',
        'Issued Equipments': equipNames,
        'Total Issued Qty': totalIssued,
        'Total Returned Qty': totalReturned,
        'Damaged Qty': totalDamaged,
        'Lost Qty': totalLost,
        'Issued By': record.member?.member_name || `Member #${record.member?.member_id || 'N/A'}`,
        'Issue Time': formatDateTime(record.issue_time),
        'Return Time': record.return_time ? formatDateTime(record.return_time) : 'Pending Return',
        'Status': record.return_time ? 'Returned' : 'Pending',
      });
    });

    const workSheet = XLSX.utils.json_to_sheet(exportRows);
    workSheet['!cols'] = [
      { wch: 'Sr.'.length + 2 },
      { wch: 'Student Name'.length + 2 },
      { wch: 'Enrollment No.'.length + 2 },
      { wch: 'Department'.length + 2 },
      { wch: 'Phone'.length + 2 },
      { wch: 'Issued Equipments'.length + 2 },
      { wch: 'Total Issued Qty'.length + 2 },
      { wch: 'Total Returned Qty'.length + 2 },
      { wch: 'Damaged Qty'.length + 2 },
      { wch: 'Lost Qty'.length + 2 },
      { wch: 'Issued By'.length + 2 },
      { wch: 'Issue Time'.length + 2 },
      { wch: 'Return Time'.length + 2 },
      { wch: 'Status'.length + 2 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, workSheet, 'Issue History');
    XLSX.writeFile(workbook, `issue_history_${selectedDate}.xlsx`);
  };

  return (
    <div className="issue-history-container">
      {/* Header Bar */}
      <div className="issue-history-header">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="back-btn"
        >
          <MoveLeft size={16} /> Back to Dashboard
        </button>
        <h2>Past Issue Records</h2>
      </div>

      {/* Date Filter & Export Controls Card */}
      <div className="history-card filter-card">
        <div className="filter-controls-row">
          <div className="date-picker-section">
            <label className="filter-label">
              <Calendar size={15} /> Select Issue Date
            </label>
            <div className="date-input-group">
              <button
                type="button"
                className="date-nav-btn"
                title="Previous Day"
                onClick={() => handleShiftDate(-1)}
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="history-date-input"
              />
              <button
                type="button"
                className="date-nav-btn"
                title="Next Day"
                onClick={() => handleShiftDate(1)}
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                className="today-shortcut-btn"
                onClick={() => setSelectedDate(getTodayString())}
              >
                Today
              </button>
            </div>
          </div>

          <div className="filter-action-buttons">
            <button
              type="button"
              disabled={loading}
              onClick={() => fetchRecords(selectedDate)}
              className="refresh-records-btn"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'spinning' : ''} />
              {loading ? 'Fetching...' : 'Refresh'}
            </button>

            <button
              type="button"
              disabled={loading || records.length === 0}
              onClick={generateExcel}
              className="export-excel-btn"
              title="Export to Excel"
            >
              <FileSpreadsheet size={15} />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="history-stats-grid">
        <div className="history-stat-card total-issues">
          <div className="stat-icon">
            <Package size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Issues</span>
            <span className="stat-value">{stats.totalRecords}</span>
          </div>
        </div>

        <div className="history-stat-card items-issued">
          <div className="stat-icon">
            <Package size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Equipments Issued</span>
            <span className="stat-value">{stats.totalItemsIssued}</span>
          </div>
        </div>

        <div className="history-stat-card items-returned">
          <div className="stat-icon">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Returned Qty</span>
            <span className="stat-value">{stats.totalItemsReturned}</span>
          </div>
        </div>

        <div className="history-stat-card items-pending">
          <div className="stat-icon">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending Returns</span>
            <span className="stat-value">{stats.pendingReturnsCount}</span>
          </div>
        </div>

        <div className="history-stat-card items-damaged-lost">
          <div className="stat-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Damaged / Lost</span>
            <span className="stat-value">{stats.totalItemsDamaged + stats.totalItemsLost}</span>
          </div>
        </div>
      </div>

      {/* Table & Local Filters Card */}
      <div className="history-card table-card">
        {/* Search and Status Tabs */}
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by student, enrollment, dept, equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="status-filter-pills">
            <button
              type="button"
              className={`pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All ({records.length})
            </button>
            <button
              type="button"
              className={`pill-btn ${statusFilter === 'RETURNED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('RETURNED')}
            >
              Returned ({records.length - stats.pendingReturnsCount})
            </button>
            <button
              type="button"
              className={`pill-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PENDING')}
            >
              Pending ({stats.pendingReturnsCount})
            </button>
          </div>
        </div>

        {error && (
          <div className="history-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="history-loading">
            <RefreshCw size={24} className="spinning" />
            <span>Loading records for {selectedDate}...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="history-empty">
            <Package size={44} color="#9ca3af" />
            <p>
              {records.length === 0
                ? `No issue records found for ${selectedDate}.`
                : 'No records match your search filter.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Sr.</th>
                  <th>Student Name</th>
                  <th>Equipments Issued</th>
                  <th>Issued By</th>
                  <th>Issue Time</th>
                  <th>Return Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((item, index) => {
                  const isReturned = Boolean(item.return_time);
                  return (
                    <tr
                      key={item.issue_id || index}
                      className="clickable-row"
                      onClick={() => setSelectedRecord(item)}
                      title="Click to view full details"
                    >
                      <td className="row-sr">
                        <span className="issue-id-badge">#{item.issue_id || index + 1}</span>
                      </td>
                      <td>
                        <span className="student-name-simple">
                          {item.student?.student_name || 'Unknown Student'}
                        </span>
                      </td>
                      <td>
                        <div className="equipment-tags-container">
                          {item.equipments && item.equipments.length > 0 ? (
                            item.equipments.map((eq, eqIdx) => (
                              <div key={eq.equipment_id || eqIdx} className="eq-item-tag simple">
                                <span className="eq-name">{eq.equipment_name}</span>
                                <span className="eq-issued-qty">x{eq.issued_quantity}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted">No equipment data</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="member-info">
                          <UserCheck size={14} color="#6b7280" />
                          <span>
                            {item.member?.member_name ||
                              (item.member?.member_id ? `Member #${item.member.member_id}` : 'Staff')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="time-info">
                          <Clock size={14} color="#6b7280" />
                          <span>{formatDateTime(item.issue_time)}</span>
                        </div>
                      </td>
                      <td>
                        {isReturned ? (
                          <div className="status-badge-container">
                            <span className="status-badge returned">
                              <CheckCircle2 size={13} /> Returned
                            </span>
                          </div>
                        ) : (
                          <div className="status-badge-container">
                            <span className="status-badge pending">
                              <Clock size={13} /> Pending
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="view-detail-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(item);
                          }}
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Dialog Modal */}
      {selectedRecord && (
        <div className="record-modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="record-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="record-modal-header">
              <div className="modal-title-wrap">
                <h3>Issue Record Details</h3>
                <span className="modal-id-badge">#{selectedRecord.issue_id}</span>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setSelectedRecord(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="record-modal-body">
              {/* Student Details Section */}
              <div className="modal-section">
                <h4 className="section-title">
                  <User size={16} /> Student Information
                </h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Student Name</span>
                    <span className="info-value highlight">
                      {selectedRecord.student?.student_name || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Enrollment No.</span>
                    <span className="info-value">
                      <GraduationCap size={14} className="inline-icon" />
                      {selectedRecord.student?.enrollment || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Department</span>
                    <span className="info-value">
                      {selectedRecord.student?.department || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone Number</span>
                    <span className="info-value">
                      <Phone size={14} className="inline-icon" />
                      {selectedRecord.student?.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Equipment & Return Breakdown Section */}
              <div className="modal-section">
                <h4 className="section-title">
                  <Package size={16} /> Equipments & Return Breakdown
                </h4>

                {selectedRecord.equipments && selectedRecord.equipments.length > 0 ? (
                  <div className="modal-equipments-list">
                    {selectedRecord.equipments.map((eq, idx) => {
                      const isReturned = Boolean(selectedRecord.return_time);
                      return (
                        <div key={eq.equipment_id || idx} className="modal-equipment-card">
                          <div className="modal-eq-header">
                            <span className="modal-eq-name">{eq.equipment_name}</span>
                            <span className="modal-issued-badge">Issued: {eq.issued_quantity}</span>
                          </div>

                          {isReturned ? (
                            <div className="return-quantities-row">
                              <div className="qty-box returned">
                                <span className="qty-label">Returned</span>
                                <span className="qty-num">{eq.returned_quantity ?? 0}</span>
                              </div>
                              <div className={`qty-box damaged ${(eq.damaged_quantity || 0) > 0 ? 'has-issue' : ''}`}>
                                <span className="qty-label">Damaged</span>
                                <span className="qty-num">{eq.damaged_quantity ?? 0}</span>
                              </div>
                              <div className={`qty-box lost ${(eq.lost_quantity || 0) > 0 ? 'has-issue' : ''}`}>
                                <span className="qty-label">Lost</span>
                                <span className="qty-num">{eq.lost_quantity ?? 0}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="pending-return-notice">
                              <Clock size={14} /> Equipment currently with student (Pending return)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted">No equipment records available.</p>
                )}
              </div>

              {/* Issue & Return Metadata */}
              <div className="modal-section">
                <h4 className="section-title">
                  <Clock size={16} /> Transaction Details
                </h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Issued By</span>
                    <span className="info-value">
                      <UserCheck size={14} className="inline-icon" />
                      {selectedRecord.member?.member_name ||
                        (selectedRecord.member?.member_id
                          ? `Member #${selectedRecord.member.member_id}`
                          : 'Staff')}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Issue Time</span>
                    <span className="info-value">
                      {formatDateTime(selectedRecord.issue_time)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Return Status</span>
                    <span className="info-value">
                      {selectedRecord.return_time ? (
                        <span className="status-badge returned">
                          <CheckCircle2 size={13} /> Returned
                        </span>
                      ) : (
                        <span className="status-badge pending">
                          <Clock size={13} /> Pending
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Return Time</span>
                    <span className="info-value">
                      {selectedRecord.return_time
                        ? formatDateTime(selectedRecord.return_time)
                        : 'Not yet returned (Pending)'}
                    </span>
                  </div>
                </div>
              </div>


            </div>

            <div className="record-modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PastIssueRecords;

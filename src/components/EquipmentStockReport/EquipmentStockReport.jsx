import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './EquipmentStockReport.css';
import { MoveLeft, Calendar, RefreshCw, BarChart2, Package, PlusCircle, AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:4221/equipments/report';

const EquipmentStockReport = () => {
  const navigate = useNavigate();

  // Helper for default date strings YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getFirstDayOfMonthString = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  };

  const [fromDate, setFromDate] = useState(getFirstDayOfMonthString());
  const [toDate, setToDate] = useState(getTodayString());

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    setError('');

    try {
      const url = `${API_BASE}?from=${fromDate}&to=${toDate}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = (await response.json()).equipments;
        setReportData(Array.isArray(data) ? data : []);
      } else {
        const errJson = await response.json().catch(() => ({}));
        setError(errJson.message || errJson.error || `Server error (${response.status})`);
      }
    } catch (err) {
      console.error('Failed to fetch stock report:', err);
      setError('Could not connect to backend server. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  // Grand Totals
  const totals = reportData.reduce(
    (acc, curr) => ({
      opening_stock: acc.opening_stock + (Number(curr.opening_stock) || 0),
      added: acc.added + (Number(curr.added) || 0),
      lost: acc.lost + (Number(curr.lost) || 0),
      damaged: acc.damaged + (Number(curr.damaged) || 0),
      disposed: acc.disposed + (Number(curr.disposed) || 0),
      closing_stock: acc.closing_stock + (Number(curr.closing_stock) || 0),
    }),
    { opening_stock: 0, added: 0, lost: 0, damaged: 0, disposed: 0, closing_stock: 0 }
  );

  return (
    <div className="report-container">
      {/* Header Bar */}
      <div className="report-header">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="back-btn"
        >
          <MoveLeft size={16} /> Back to Dashboard
        </button>
        <h2>Equipment Stock Report</h2>
      </div>

      {/* Date Filter Form */}
      <div className="report-card filter-card">
        <form onSubmit={handleSubmit} className="date-filter-form">
          <div className="filter-group">
            <label>
              <Calendar size={14} /> From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
            />
          </div>

          <div className="filter-group">
            <label>
              <Calendar size={14} /> To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="fetch-report-btn">
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            {loading ? 'Fetching...' : 'Generate Report'}
          </button>
        </form>
      </div>

      {/* Metric Cards Summary */}
      <div className="report-stats-grid">
        <div className="report-stat-card opening">
          <div className="stat-icon">
            <Package size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Opening Stock</span>
            <span className="stat-value">{totals.opening_stock}</span>
          </div>
        </div>

        <div className="report-stat-card added">
          <div className="stat-icon">
            <PlusCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Added</span>
            <span className="stat-value">+{totals.added}</span>
          </div>
        </div>

        <div className="report-stat-card lost">
          <div className="stat-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Lost</span>
            <span className="stat-value">-{totals.lost}</span>
          </div>
        </div>

        <div className="report-stat-card damaged">
          <div className="stat-icon">
            <ShieldAlert size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Damaged</span>
            <span className="stat-value">-{totals.damaged}</span>
          </div>
        </div>

        <div className="report-stat-card disposed">
          <div className="stat-icon">
            <Trash2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Disposed</span>
            <span className="stat-value">-{totals.disposed}</span>
          </div>
        </div>

        <div className="report-stat-card closing">
          <div className="stat-icon">
            <BarChart2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Closing Stock</span>
            <span className="stat-value">{totals.closing_stock}</span>
          </div>
        </div>
      </div>

      {/* Report Table Card */}
      <div className="report-card table-card">
        {error && <div className="report-error-banner">{error}</div>}

        {loading ? (
          <div className="report-loading">
            <RefreshCw size={24} className="spinning" />
            <span>Loading Stock Report...</span>
          </div>
        ) : reportData.length === 0 ? (
          <div className="report-empty">
            <Package size={40} color="#9ca3af" />
            <p>No stock data found for the selected date range.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipment Name</th>
                  <th>Opening Stock</th>
                  <th>Added</th>
                  <th>Lost</th>
                  <th>Damaged</th>
                  <th>Disposed</th>
                  <th>Closing Stock</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => (
                  <tr key={item.equipment_id || index}>
                    <td className="row-num">#{index + 1}</td>
                    <td className="eq-name">{item.equipment_name}</td>
                    <td className="val-opening">{item.opening_stock}</td>
                    <td className="val-added">{item.added > 0 ? `+${item.added}` : item.added}</td>
                    <td className="val-lost">{item.lost > 0 ? `-${item.lost}` : item.lost}</td>
                    <td className="val-damaged">{item.damaged > 0 ? `-${item.damaged}` : item.damaged}</td>
                    <td className="val-disposed">{item.disposed > 0 ? `-${item.disposed}` : item.disposed}</td>
                    <td className="val-closing">{item.closing_stock}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="grand-total-row">
                  <td colSpan={2}>Grand Total</td>
                  <td>{totals.opening_stock}</td>
                  <td className="val-added">+{totals.added}</td>
                  <td className="val-lost">-{totals.lost}</td>
                  <td className="val-damaged">-{totals.damaged}</td>
                  <td className="val-disposed">-{totals.disposed}</td>
                  <td className="val-closing">{totals.closing_stock}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentStockReport;

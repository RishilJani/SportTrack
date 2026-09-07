import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoveLeft, Search, RefreshCw, Loader2, AlertCircle, Package, Layers, CheckCircle2, Clock, Trophy } from 'lucide-react';
import './EquipmentsPage.css';

const EquipmentsPage = () => {
  const navigate = useNavigate();

  const [equipments, setEquipments] = useState([]);
  const [issuedList, setIssuedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eqRes, issueRes] = await Promise.all([
        fetch('http://localhost:4221/equipments'),
        fetch('http://localhost:4221/issue/current')
      ]);

      if (!eqRes.ok) {
        throw new Error(`Failed to fetch equipments (${eqRes.status})`);
      }
      const eqData = await eqRes.json();

      let currentIssued = [];
      if (issueRes.ok) {
        const issueData = await issueRes.json();
        if (Array.isArray(issueData)) {
          currentIssued = issueData;
        }
      }

      setEquipments(Array.isArray(eqData) ? eqData : []);
      setIssuedList(currentIssued);
    } catch (err) {
      console.error('Error loading equipment data:', err);
      setError(err.message || 'Failed to load equipment data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map issued quantity by equipment_name
  const issuedMap = {};
  issuedList.forEach((issue) => {
    if (issue.equipments && Array.isArray(issue.equipments)) {
      issue.equipments.forEach((eq) => {
        const nameKey = (eq.equipment_name || '').toLowerCase().trim();
        const qty = parseInt(eq.issued_quantity || eq.quantity || 0, 10);
        if (nameKey) {
          issuedMap[nameKey] = (issuedMap[nameKey] || 0) + qty;
        }
      });
    }
  });

  // Calculate processed list
  const processedEquipments = equipments.map((eq) => {
    const nameKey = (eq.equipment_name || '').toLowerCase().trim();
    const total = parseInt(eq.quantity || 0, 10);
    const issued = issuedMap[nameKey] || 0;
    const available = Math.max(0, total - issued);

    return {
      ...eq,
      total_quantity: total,
      issued_quantity: issued,
      available_quantity: available
    };
  });

  // Filtered equipment list based on search term
  const filteredEquipments = processedEquipments.filter((eq) => {
    return (eq.equipment_name || '').toLowerCase().includes(searchTerm.toLowerCase().trim());
  });

  // Group by Category
  const groupedEquipments = filteredEquipments.reduce((acc, eq) => {
    const cat = eq.category || 'Uncategorized';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(eq);
    return acc;
  }, {});

  // Overall Stats
  const categoriesCount = new Set(processedEquipments.map((eq) => eq.category || 'Uncategorized')).size;
  const totalTypes = processedEquipments.length;
  const grandTotalItems = processedEquipments.reduce((sum, item) => sum + item.total_quantity, 0);
  const grandIssuedItems = processedEquipments.reduce((sum, item) => sum + item.issued_quantity, 0);
  const grandAvailableItems = processedEquipments.reduce((sum, item) => sum + item.available_quantity, 0);

  return (
    <div className="equipments-page-wrapper">
      {/* Header */}
      <div className="equipments-header">
        <div className="header-title-area">
          <button onClick={() => navigate('/dashboard')} className="back-btn-icon" title="Back to Dashboard">
            <MoveLeft size={18} />
          </button>
          <div>
            <h1>Equipments</h1>
            <p>Overview of total, issued, and available sports equipment</p>
          </div>
        </div>
        <div>
          <button onClick={fetchData} className="refresh-btn" disabled={loading} title="Refresh Inventory">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="stat-card-header">
            <h3>Categories</h3>
            <Trophy size={20} className="stat-icon" color="#8b5cf6" />
          </div>
          <div className="stat-value">{categoriesCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Total Types</h3>
            <Layers size={20} className="stat-icon" color="#3b82f6" />
          </div>
          <div className="stat-value">{totalTypes}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#6366f1' }}>
          <div className="stat-card-header">
            <h3>Total Stock</h3>
            <Package size={20} className="stat-icon" color="#6366f1" />
          </div>
          <div className="stat-value">{grandTotalItems}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="stat-card-header">
            <h3>Currently Issued</h3>
            <Clock size={20} className="stat-icon" color="#f59e0b" />
          </div>
          <div className="stat-value">{grandIssuedItems}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="stat-card-header">
            <h3>Available Stock</h3>
            <CheckCircle2 size={20} className="stat-icon" color="#10b981" />
          </div>
          <div className="stat-value">{grandAvailableItems}</div>
        </div>
      </div>

      {/* Controls: Search */}
      <div className="inventory-controls">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search equipment by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content State */}
      {loading ? (
        <div className="state-container">
          <Loader2 size={28} className="spinning" color="#3b82f6" />
          <p>Fetching equipment inventory...</p>
        </div>
      ) : error ? (
        <div className="state-container error-state">
          <AlertCircle size={28} color="#ef4444" />
          <p>{error}</p>
          <button onClick={fetchData} className="retry-btn">Try Again</button>
        </div>
      ) : Object.keys(groupedEquipments).length === 0 ? (
        <div className="state-container empty-state">
          <Package size={36} color="#9ca3af" />
          <p>No equipment found matching your search criteria.</p>
        </div>
      ) : (
        <div className="categories-list">
          {Object.entries(groupedEquipments).map(([category, items]) => (
            <div key={category} className="category-group-card">
              <div className="category-group-header">
                <h2>{category}</h2>
                <span className="category-count-badge">{items.length} Items</span>
              </div>
              <div className="table-responsive">
                <table className="equipment-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Equipment Name</th>
                      <th>Total Qty</th>
                      <th>Issued Qty</th>
                      <th>Available Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((eq, index) => {
                      return (
                        <tr key={eq.equipment_id || index}>
                          <td className="sr-cell">{index + 1}</td>
                          <td className="equipment-name-cell">{eq.equipment_name}</td>
                          <td>
                            <span className="qty-pill total-qty">{eq.total_quantity}</span>
                          </td>
                          <td>
                            <span className={`qty-pill issued-qty ${eq.issued_quantity > 0 ? 'active-issued' : ''}`}>
                              {eq.issued_quantity}
                            </span>
                          </td>
                          <td>
                            <span className={`qty-pill avail-qty ${eq.available_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                              {eq.available_quantity}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EquipmentsPage;

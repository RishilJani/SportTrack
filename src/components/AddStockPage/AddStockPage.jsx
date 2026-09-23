import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoveLeft,
  PlusCircle,
  Layers,
  Package,
  Hash,
  CheckCircle,
  AlertCircle,
  Loader2,
  PackagePlus,
} from 'lucide-react';
import { useEquipment } from '../../context/EquipmentContext';
import './AddStockPage.css';

const toTitleCase = (str) => {
  return (str || '').replace(
    /\b\w+/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
};

const AddStockPage = () => {
  const navigate = useNavigate();
  const { equipments: contextEquipments } = useEquipment();

  const [equipments, setEquipments] = useState(
    Array.isArray(contextEquipments) ? contextEquipments : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [category, setCategory] = useState('');
  const [equipment, setEquipment] = useState(''); // stores equipment_id
  const [stockAmount, setStockAmount] = useState('');
  const [submittingStock, setSubmittingStock] = useState(false);
  const [stockSubmitError, setStockSubmitError] = useState(null);
  const [stockSubmitted, setStockSubmitted] = useState(false);
  const [lastSubmittedStock, setLastSubmittedStock] = useState(null);

  const fetchEquipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:4221/equipments');
      if (!res.ok) {
        throw new Error(`Failed to load equipments (${res.status})`);
      }
      const data = await res.json();
      setEquipments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching equipments:', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  // Unique categories for existing flow
  const categories = [
    ...new Set(equipments.map((eq) => toTitleCase(eq.category_name)).filter(Boolean)),
  ];

  // Equipments filtered by selected category
  const filteredEquipments = category
    ? equipments.filter((eq) => eq.category_name?.toUpperCase() === category.toUpperCase())
    : [];

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setEquipment('');
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!equipment || !stockAmount) return;

    setSubmittingStock(true);
    setStockSubmitError(null);

    const payload = {
      equipment_id: Number(equipment),
      transaction_type: 'PURCHASE',
      quantity: Number(stockAmount),
    };

    console.log('Submitting Add Equipment Stock (Purchase):', payload);

    try {
      const response = await fetch('http://localhost:4221/transactions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(
          errJson.message || errJson.error || `Server returned status ${response.status}`
        );
      }

      const resData = await response.json().catch(() => ({}));
      console.log('Transaction response:', resData);

      const selectedEqObj = equipments.find((eq) => String(eq.equipment_id) === String(equipment));
      setLastSubmittedStock({
        category,
        equipmentName: selectedEqObj ? selectedEqObj.equipment_name : `Equipment #${equipment}`,
        stockAmount,
      });
      setStockSubmitted(true);
      fetchEquipments();
    } catch (err) {
      console.error('Error adding equipment stock:', err);
      setStockSubmitError(err.message || 'Failed to submit data to server. Please try again.');
    } finally {
      setSubmittingStock(false);
    }
  };

  const handleResetStock = () => {
    setCategory('');
    setEquipment('');
    setStockAmount('');
    setStockSubmitError(null);
    setStockSubmitted(false);
    setLastSubmittedStock(null);
  };

  return (
    <div className="add-stock-page-wrapper">
      <div className="add-stock-container">
        {/* Header Bar */}
        <div className="add-stock-header">
          <button
            type="button"
            onClick={() => navigate('/equipments')}
            className="back-btn-icon"
            title="Back to Equipments"
          >
            <MoveLeft size={18} />
          </button>
          <div>
            <div className="header-badge-row">
              <PackagePlus size={20} className="header-icon-accent" />
              <h1>Add Equipment Stock</h1>
            </div>
            <p>Restock existing inventory items and record incoming purchase shipments</p>
          </div>
        </div>

        {/* Card Content */}
        <div className="add-stock-card">
          {loading ? (
            <div className="add-stock-state-container">
              <Loader2 size={32} className="spinning" color="#3b82f6" />
              <p>Loading equipment catalog...</p>
            </div>
          ) : error ? (
            <div className="add-stock-state-container error-state">
              <AlertCircle size={32} color="#ef4444" />
              <p>{error}</p>
              <button
                type="button"
                className="retry-btn"
                onClick={fetchEquipments}
              >
                Retry
              </button>
            </div>
          ) : stockSubmitted ? (
            <div className="add-stock-success-card">
              <CheckCircle size={48} color="#10b981" />
              <h2>Stock Added Successfully!</h2>
              <p>The transaction has been recorded in the database.</p>
              <div className="success-summary-box">
                <div><strong>Category:</strong> {lastSubmittedStock?.category}</div>
                <div><strong>Equipment:</strong> {lastSubmittedStock?.equipmentName}</div>
                <div><strong>Stock Added:</strong> +{lastSubmittedStock?.stockAmount} units</div>
                <div><strong>Transaction Type:</strong> PURCHASE</div>
              </div>
              <div className="success-actions">
                <button type="button" onClick={handleResetStock} className="add-more-btn">
                  Add More Stock
                </button>
                <button type="button" onClick={() => navigate('/equipments')} className="go-back-btn">
                  View All Equipments
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStockSubmit} className="add-stock-form-main">
              <div className="section-intro">
                <h3>Restock Existing Inventory</h3>
                <p>Select a sport category and equipment item to add incoming stock quantity.</p>
              </div>

              {stockSubmitError && (
                <div className="add-stock-error-banner">
                  <AlertCircle size={18} />
                  <span>{stockSubmitError}</span>
                </div>
              )}

              {/* Category Field */}
              <div className="form-field-group">
                <label htmlFor="category-select">
                  <Layers size={16} /> Category / Sport
                </label>
                <select
                  id="category-select"
                  value={category}
                  onChange={handleCategoryChange}
                  disabled={submittingStock}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipment Field */}
              <div className="form-field-group">
                <label htmlFor="equipment-select">
                  <Package size={16} /> Equipment Name
                </label>
                <select
                  id="equipment-select"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  disabled={!category || submittingStock}
                  required
                >
                  <option value="">
                    {category ? '-- Select Equipment --' : '-- Select Category First --'}
                  </option>
                  {filteredEquipments.map((eq) => (
                    <option key={eq.equipment_id} value={eq.equipment_id}>
                      {eq.equipment_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Amount Field */}
              <div className="form-field-group">
                <label htmlFor="stock-amount-input">
                  <Hash size={16} /> Stock Amount to Add
                </label>
                <input
                  id="stock-amount-input"
                  type="number"
                  min="1"
                  placeholder="Enter quantity (e.g. 5, 10, 25)"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  disabled={submittingStock}
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="form-action-buttons">
                <button
                  type="button"
                  onClick={() => navigate('/equipments')}
                  className="cancel-btn"
                  disabled={submittingStock}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={!category || !equipment || !stockAmount || submittingStock}
                >
                  {submittingStock ? (
                    <>
                      <Loader2 size={16} className="spinning" />
                      Adding Stock...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      Add Equipment Stock
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddStockPage;

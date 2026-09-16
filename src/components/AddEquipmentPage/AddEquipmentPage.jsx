import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoveLeft, PlusCircle, Layers, Package, Hash, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import './AddEquipmentPage.css';

const AddEquipmentPage = () => {
  const navigate = useNavigate();

  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [category, setCategory] = useState('');
  const [equipment, setEquipment] = useState(''); // stores equipment_id
  const [stockAmount, setStockAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState(null);

  useEffect(() => {
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

    fetchEquipments();
  }, []);

  // Unique categories
  const categories = [...new Set(equipments.map((eq) => eq.category).filter(Boolean))];

  // Equipments filtered by selected category
  const filteredEquipments = category
    ? equipments.filter((eq) => eq.category?.toUpperCase() === category.toUpperCase())
    : [];

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setEquipment('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!equipment || !stockAmount) return;

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      equipment_id: Number(equipment),
      transaction_type: 'PURCHASE',
      quantity: Number(stockAmount),
    };

    console.log('Submitting Add Equipment (Purchase):', payload);

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
        console.log("err = ", errJson);

        throw new Error(errJson.message || errJson.error || `Server returned status ${response.status}`);
      }

      const resData = await response.json().catch(() => ({}));
      console.log('Transaction response:', resData);

      const selectedEqObj = equipments.find((eq) => String(eq.equipment_id) === String(equipment));
      setLastSubmitted({
        category,
        equipmentName: selectedEqObj ? selectedEqObj.equipment_name : `Equipment #${equipment}`,
        stockAmount,
      });
      setFormSubmitted(true);
    } catch (err) {
      console.error('Error adding equipment stock:', err);
      setSubmitError(err.message || 'Failed to submit data to server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setCategory('');
    setEquipment('');
    setStockAmount('');
    setSubmitError(null);
    setFormSubmitted(false);
    setLastSubmitted(null);
  };

  return (
    <div className="add-equipment-page-wrapper">
      <div className="add-equipment-container">
        {/* Header Bar */}
        <div className="add-equipment-header">
          <div>

            <button
              type="button"
              onClick={() => navigate('/equipments')}
              className="back-btn-icon"
              title="Back to Equipments"
            >
              <MoveLeft size={18} />
            </button>
          </div>
          <div>
            <h1>Add Equipment Stock</h1>
            <p>Select category and equipment to add new stock inventory</p>
          </div>
        </div>

        {/* Card Content */}
        <div className="add-equipment-card">
          {loading ? (
            <div className="add-eq-state-container">
              <Loader2 size={32} className="spinning" color="#3b82f6" />
              <p>Loading equipment catalog...</p>
            </div>
          ) : error ? (
            <div className="add-eq-state-container error-state">
              <AlertCircle size={32} color="#ef4444" />
              <p>{error}</p>
              <button
                type="button"
                className="retry-btn"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : formSubmitted ? (
            <div className="add-eq-success-card">
              <CheckCircle size={48} color="#10b981" />
              <h2>Stock Added Successfully!</h2>
              <p>The transaction has been recorded in the database.</p>
              <div className="success-summary-box">
                <div><strong>Category:</strong> {lastSubmitted?.category}</div>
                <div><strong>Equipment:</strong> {lastSubmitted?.equipmentName}</div>
                <div><strong>Stock Added:</strong> {lastSubmitted?.stockAmount}</div>
                <div><strong>Transaction Type:</strong> PURCHASE</div>
              </div>
              <div className="success-actions">
                <button type="button" onClick={handleReset} className="add-more-btn">
                  Add Another Equipment
                </button>
                <button type="button" onClick={() => navigate('/equipments')} className="go-back-btn" >
                  View All Equipments
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="add-equipment-form-main">
              {submitError && (
                <div className="add-eq-error-banner">
                  <AlertCircle size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Category Field */}
              <div className="form-field-group">
                <label htmlFor="category-select">
                  <Layers size={16} /> Category / Sport
                </label>
                <select id="category-select" value={category} onChange={handleCategoryChange} disabled={submitting} required >
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
                  <Package size={16} /> Equipment
                </label>
                <select id="equipment-select" value={equipment} onChange={(e) => setEquipment(e.target.value)} disabled={!category || submitting} required >
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
                <input id="stock-amount-input" type="number" min="1" placeholder="Enter quantity (e.g. 5, 10, 25)" value={stockAmount} onChange={(e) => setStockAmount(e.target.value)} disabled={submitting} required />
              </div>

              {/* Form Actions */}
              <div className="form-action-buttons">
                <button
                  type="button" onClick={() => navigate('/equipments')} className="cancel-btn" disabled={submitting} >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={!category || !equipment || !stockAmount || submitting} >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="spinning" />
                      Adding Stock...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      Add Equipment
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

export default AddEquipmentPage;

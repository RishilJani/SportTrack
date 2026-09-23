import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoveLeft,
  PlusCircle,
  Layers,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  FolderPlus,
  ListPlus,
} from 'lucide-react';
import './AddCategoryPage.css';

const toTitleCase = (str) => {
  return (str || '').replace(
    /\b\w+/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
};

const AddCategoryPage = () => {
  const navigate = useNavigate();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [equipmentList, setEquipmentList] = useState([
    { equipment_name: '', quantity: '' },
  ]);
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [categorySubmitError, setCategorySubmitError] = useState(null);
  const [categorySubmitted, setCategorySubmitted] = useState(false);
  const [lastSubmittedCategory, setLastSubmittedCategory] = useState(null);

  const handleCategoryNameChange = (e) => {
    const val = e.target.value;
    setNewCategoryName(toTitleCase(val));
    if (categorySubmitError) setCategorySubmitError(null);
  };

  const handleAddEquipmentRow = () => {
    setEquipmentList((prev) => [...prev, { equipment_name: '', quantity: '' }]);
  };

  const handleRemoveEquipmentRow = (index) => {
    if (equipmentList.length <= 1) return;
    setEquipmentList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEquipmentRowChange = (index, field, value) => {
    const updated = [...equipmentList];
    if (field === 'equipment_name') {
      updated[index][field] = toTitleCase(value.toString());
    } else {
      updated[index][field] = value;
    }
    setEquipmentList(updated);
    if (categorySubmitError) setCategorySubmitError(null);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setCategorySubmitError('Please enter a category name.');
      return;
    }

    const invalidRow = equipmentList.find(
      (item) => !item.equipment_name.trim() || !item.quantity || Number(item.quantity) < 0
    );

    if (invalidRow) {
      setCategorySubmitError('Please enter valid name and quantity for all equipment rows.');
      return;
    }

    setSubmittingCategory(true);
    setCategorySubmitError(null);

    const submitData = {
      category_name: newCategoryName.trim(),
      equipment_list: equipmentList.map((item) => ({
        equipment_name: item.equipment_name.trim(),
        quantity: Number(item.quantity) || 0,
      })),
    };

    console.log('Add Category & Equipments Data:', submitData);

    try {
      const response = await fetch('http://localhost:4221/category/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(
          errJson.message || errJson.error || `Server returned status ${response.status}`
        );
      }

      const resData = await response.json().catch(() => ({}));
      console.log('Category create response:', resData);

      setLastSubmittedCategory(submitData);
      setCategorySubmitted(true);
    } catch (err) {
      console.error('Error adding new category:', err);
      setCategorySubmitError(err.message || 'Failed to submit category data. Please try again.');
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleResetCategory = () => {
    setNewCategoryName('');
    setEquipmentList([{ equipment_name: '', quantity: '' }]);
    setCategorySubmitError(null);
    setCategorySubmitted(false);
    setLastSubmittedCategory(null);
  };

  return (
    <div className="add-category-page-wrapper">
      <div className="add-category-container">
        {/* Header Bar */}
        <div className="add-category-header">
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
              <FolderPlus size={20} className="header-icon-accent" />
              <h1>Add New Category & Equipments</h1>
            </div>
            <p>Register a new sport category and configure its starting inventory of equipments</p>
          </div>
        </div>

        {/* Card Content */}
        <div className="add-category-card">
          {categorySubmitted ? (
            <div className="add-category-success-card">
              <CheckCircle size={48} color="#10b981" />
              <h2>Category & Equipments Added!</h2>
              <p>The new category and equipment list has been recorded.</p>

              <div className="success-summary-box">
                <div><strong>Category Name:</strong> {lastSubmittedCategory?.category_name}</div>
                <div><strong>Total Equipment Items:</strong> {lastSubmittedCategory?.equipment_list?.length}</div>

                <div className="success-items-sublist">
                  <span className="sublist-title">Equipments Defined:</span>
                  <ul>
                    {lastSubmittedCategory?.equipment_list?.map((item, idx) => (
                      <li key={idx}>
                        <span>{item.equipment_name}</span>
                        <span className="qty-badge">Qty: {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="success-actions">
                <button type="button" onClick={handleResetCategory} className="add-more-btn">
                  Add Another Category
                </button>
                <button type="button" onClick={() => navigate('/equipments')} className="go-back-btn">
                  View All Equipments
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCategorySubmit} className="add-category-form-main">
              <div className="section-intro">
                <h3>New Sport / Category Details</h3>
                <p>Enter the category name and define its initial equipment list with quantities.</p>
              </div>

              {categorySubmitError && (
                <div className="add-category-error-banner">
                  <AlertCircle size={18} />
                  <span>{categorySubmitError}</span>
                </div>
              )}

              {/* Category Name Input (Title Case) */}
              <div className="form-field-group">
                <label htmlFor="new-category-input">
                  <Layers size={16} /> Category Name (Auto Title Case)
                </label>
                <input
                  id="new-category-input"
                  type="text"
                  placeholder="e.g. Badminton, Table Tennis, Swimming, Football"
                  value={newCategoryName}
                  onChange={handleCategoryNameChange}
                  disabled={submittingCategory}
                  required
                />
              </div>

              {/* Dynamic Equipment Rows */}
              <div className="equipment-rows-section">
                <div className="equipment-rows-header">
                  <label>
                    <ListPlus size={16} /> Equipment List & Quantities
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEquipmentRow}
                    className="add-row-btn"
                    disabled={submittingCategory}
                  >
                    <Plus size={15} /> Add Equipment
                  </button>
                </div>

                <div className="equipment-rows-list">
                  {equipmentList.map((row, index) => (
                    <div key={index} className="equipment-row-item">
                      <span className="row-number-badge">#{index + 1}</span>
                      <div className="row-field name-field">
                        <input
                          type="text"
                          placeholder="Equipment Name (e.g. Racket, Shuttlecock, Ball)"
                          value={row.equipment_name}
                          onChange={(e) =>
                            handleEquipmentRowChange(index, 'equipment_name', e.target.value)
                          }
                          disabled={submittingCategory}
                          required
                        />
                      </div>
                      <div className="row-field qty-field">
                        <input
                          type="number"
                          min="0"
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={(e) =>
                            handleEquipmentRowChange(index, 'quantity', e.target.value)
                          }
                          disabled={submittingCategory}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className="remove-row-btn"
                        onClick={() => handleRemoveEquipmentRow(index)}
                        disabled={equipmentList.length <= 1 || submittingCategory}
                        title={
                          equipmentList.length <= 1
                            ? 'At least one equipment is required'
                            : 'Remove equipment'
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-action-buttons">
                <button
                  type="button"
                  onClick={() => navigate('/equipments')}
                  className="cancel-btn"
                  disabled={submittingCategory}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submittingCategory || !newCategoryName.trim()}
                >
                  {submittingCategory ? (
                    <>
                      <Loader2 size={16} className="spinning" />
                      Saving Category...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      Save Category & Equipments
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

export default AddCategoryPage;

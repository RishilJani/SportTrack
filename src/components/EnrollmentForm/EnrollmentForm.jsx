import React, { useState } from 'react';
import './EnrollmentForm.css';

const equipmentData = {
  Cricket: ['Bat', 'Ball', 'Stumps'],
  Badminton: ['Racket', 'Shuttlecock'],
  Chess: ['Chess Board', 'Chess Clock'],
  "Table Tennis": ['Table Tennis Racket', 'Table Tennis Ball']
};

const EnrollmentForm = () => {
  const [step, setStep] = useState(1);
  const [enrollment, setEnrollment] = useState('');

  // Step 2 details
  const [studentName, setStudentName] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');

  // Selection
  const [sport, setSport] = useState('');
  const [equipment, setEquipment] = useState('');
  const [quantity, setQuantity] = useState('');
  const [addedItems, setAddedItems] = useState([]);
  
  const nextStep = (e) => {
    e.preventDefault();
    if (enrollment.trim() !== '') {
      setStep(2);
    }
  };

  const prevStep = (e) => {
    e.preventDefault();
    setStep(1);
  };

  const handleSportChange = (e) => {
    setSport(e.target.value);
    setEquipment('');
  };

  const getCurrentItem = () => {
    if (sport && equipment && Number(quantity) > 0) {
      return { sport, equipment, quantity: Number(quantity) };
    }

    return null;
  };

  const handleAddItem = () => {
    const currentItem = getCurrentItem();

    if (currentItem) {
      setAddedItems((previousItems) => [...previousItems, currentItem]);
      setEquipment('');
      setQuantity('');
    }
  };

  const handleRemoveItem = (index) => {
    const newItems = [...addedItems];
    newItems.splice(index, 1);
    setAddedItems(newItems);
  };

  const submitForm = (e) => {
    e.preventDefault();

    const currentItem = getCurrentItem();
    const finalItems = currentItem
      ? [...addedItems, currentItem]
      : addedItems;

    setAddedItems(finalItems);

    const formData = {
      enrollment,
      studentName,
      department,
      semester,
      issuedEquipments: finalItems
    };

    console.log(JSON.stringify(formData, null, 2));
    alert('Form data logged to console! Check developer tools.');
    clearForm();
  };

  const clearForm =()=>{
    setEnrollment('');
    setStudentName('');
    setDepartment('');
    setSemester('');
    setSport('');
    setEquipment('');
    setQuantity('');
    setAddedItems([]);
  }
  const availableEquipments = sport && equipmentData[sport] ? equipmentData[sport] : [];

  return (
    <div className="form-wrapper">
      <div className="form-container">
        <h2>Student Registration</h2>
        <div className="form-overflow-wrapper">
          <div
            className="form-slider"
            style={{ transform: `translateX(${step === 1 ? '0' : '-50%'})` }}
          >
            {/* Step 1 */}
            <div className="form-step">
              <form onSubmit={nextStep}>
                <div className="form-group">
                  <label>Enrollment Number</label>
                  <input
                    type="text"
                    placeholder="Enter Enrollment Number"
                    value={enrollment}
                    onChange={(e) => setEnrollment(e.target.value)}
                    required
                  />
                </div>
                <div className="button-group">
                  <button type="submit">Next</button>
                </div>
              </form>
            </div>

            {/* Step 2 */}
            <div className="form-step">
              <form onSubmit={submitForm}>
                <div className="form-group">
                  <label>Enrollment Number</label>
                  <input type="text" value={enrollment} readOnly />
                </div>
                <div className="form-group">
                  <label>Student Name</label>
                  <input type="text" placeholder="Enter Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
                </div>

                <div className="horizontal-group">
                  <div className="form-group">
                    <label>Department</label>
                    <select required value={department} onChange={(e) => setDepartment(e.target.value)}>
                      <option value="">Select...</option>
                      <option value="cs">Computer Science</option>
                      <option value="it">Information Technology</option>
                      <option value="mech">Mechanical</option>
                      <option value="civil">Civil</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Semester</label>
                    <input type="number" placeholder="Sem" min="1" max="8" value={semester} onChange={(e) => setSemester(e.target.value)} required />
                  </div>
                </div>

                <hr className="divider" />
                <label className="section-label">Equipments Required</label>

                <div className="horizontal-group">
                  <div className="form-group">
                    <label>Sport</label>
                    <select value={sport} onChange={handleSportChange}>
                      <option value="">Select...</option>
                      {Object.keys(equipmentData).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Equipment</label>
                    <select
                      value={equipment}
                      onChange={(e) => setEquipment(e.target.value)}
                      disabled={!sport}
                    >
                      <option value="">Select...</option>
                      {availableEquipments.map((eq) => (
                        <option key={eq} value={eq}>{eq}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group qty-group">
                    <label>Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      disabled={!equipment}
                    />
                  </div>

                  <div className="form-group add-button-wrapper">
                    <label>&nbsp;</label>
                    <button
                      type="button"
                      className="add-btn"
                      onClick={handleAddItem}
                      disabled={!sport || !equipment || Number(quantity) <= 0}
                    >
                      + Add Equipment
                    </button>
                  </div>
                </div>

                {addedItems.length > 0 && (
                  <div className="added-items-list">
                    {addedItems.map((item, index) => (
                      <div className="added-item" key={index}>
                        <span><strong>{item.sport}</strong>: {item.equipment} (x{item.quantity})</span>
                        <button type="button" className="remove-btn" onClick={() => handleRemoveItem(index)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="button-group" style={{ marginTop: '30px' }}>
                  <button type="button" onClick={prevStep} className="back-btn">Back</button>
                  <button type="submit">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentForm;

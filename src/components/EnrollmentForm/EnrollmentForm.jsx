import React, { useState } from 'react';
import './EnrollmentForm.css';

const equipmentData = {
  Cricket: ['Bat', 'Ball', 'Stumps', 'Pads', 'Gloves', 'Helmet'],
  Badminton: ['Racket', 'Shuttlecock', 'Net', 'Shoes'],
  Chess: ['Chess Board', 'Chess Clock', 'Scorebook'],
  Football: ['Football', 'Goal Nets', 'Cones', 'Shin Guards'],
  Tennis: ['Racket', 'Tennis Ball', 'Net']
};

const defaultDepartments = ['B.Tech', 'BCA', 'MCA', 'BBA', 'B.E.'];

const EnrollmentForm = () => {
  const member_id = 1;
  const [step, setStep] = useState(1);
  const [enrollment, setEnrollment] = useState('');

  // Step 2 details
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');

  // Auto-fill & Read-only state
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Selection
  const [sport, setSport] = useState('');
  const [equipment, setEquipment] = useState('');
  const [quantity, setQuantity] = useState('');
  const [addedItems, setAddedItems] = useState([]);

  const normalizeDepartment = (deptStr) => {
    if (!deptStr) return '';
    const lower = String(deptStr).toLowerCase().trim();
    const match = defaultDepartments.find(
      d => d.toLowerCase() === lower
    );
    return match || deptStr;
  };

  const nextStep = async (e) => {
    e.preventDefault();
    if (!enrollment.trim()) return;

    setLoading(true);
    setFetchError('');

    try {
      const response = await fetch(`http://localhost:4221/students/${enrollment.trim()}`);

      if (response.ok) {
        const data = await response.json();

        // Backend returns: student_id, enrollment, student_name, phone, email, department, semester
        setStudentId(data.student_id || data.studentId || '');
        setStudentName(data.student_name || data.studentName || '');
        setEmail(data.email || '');
        setPhoneNumber(data.phone || data.phoneNumber || '');
        setDepartment(normalizeDepartment(data.department));
        setSemester(data.semester !== undefined && data.semester !== null ? String(data.semester) : '');
        if (data.enrollment) {
          setEnrollment(data.enrollment);
        }

        setIsReadOnly(true);
      } else {
        setIsReadOnly(false);
        setFetchError('Student data not found for this enrollment number. Please enter details manually.');
        setStep(2);
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
      setIsReadOnly(false);
      setFetchError('Could not fetch student data from server. Please enter details manually.');
    } finally {
      setLoading(false);
    }
  };

  const prevStep = (e) => {
    e.preventDefault();
    setStep(1);
  };

  const handleEnrollmentChange = (e) => {
    setEnrollment(e.target.value);
    // Reset read-only status and fields if user changes enrollment number
    if (isReadOnly) {
      setIsReadOnly(false);
      setStudentId('');
      setStudentName('');
      setEmail('');
      setPhoneNumber('');
      setDepartment('');
      setSemester('');
      setFetchError('');
    }
  };

  const handleSportChange = (e) => {
    setSport(e.target.value);
    setEquipment('');
  };

  const handleAddItem = () => {
    if (sport && equipment && quantity > 0) {
      setAddedItems([...addedItems, { sport, equipment, quantity }]);
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
    const result = {
      member_id,
      student_id: studentId,
      issuedEquipments: addedItems
    };
    console.log("Submitted Form Result Object:", result);
    console.log(JSON.stringify(result, null, 2));
    alert("Form data logged to console! Check developer tools.");
  };

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
                    onChange={handleEnrollmentChange}
                    required
                  />
                </div>
                <div className="button-group">
                  <button type="submit" disabled={loading}>
                    {loading ? 'Fetching...' : 'Next'}
                  </button>
                </div>
              </form>
            </div>

            {/* Step 2 */}
            <div className="form-step">
              <form onSubmit={submitForm}>
                {isReadOnly && (
                  <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.82rem' }}>
                    ✓ Student details auto-filled from database (Read-only)
                  </div>
                )}
                {fetchError && (
                  <p className="error-message" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px' }}>
                    {fetchError}
                  </p>
                )}
                <div className="horizontal-group">
                  <div className="form-group">
                    <label>Enrollment Number</label>
                    <input type="text" value={enrollment} readOnly />
                  </div>
                  {studentId && (
                    <div className="form-group">
                      <label>Student ID</label>
                      <input type="text" value={studentId} readOnly />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Student Name</label>
                  <input
                    type="text"
                    placeholder="Enter Name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    readOnly={isReadOnly}
                    required
                  />
                </div>

                <div className="horizontal-group">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Enter Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      readOnly={isReadOnly}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter Phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      readOnly={isReadOnly}
                      required
                    />
                  </div>
                </div>

                <div className="horizontal-group">
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="">Select...</option>
                      {defaultDepartments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                      {department && !defaultDepartments.includes(department) && (
                        <option value={department}>{department}</option>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Semester</label>
                    <input
                      type="number"
                      placeholder="Sem"
                      min="1"
                      max="8"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      readOnly={isReadOnly}
                      required
                    />
                  </div>
                </div>

                <hr className="divider" />
                <label className="section-label">Equipments Required</label>

                <div className="form-group">
                  <label>Sport</label>
                  <select value={sport} onChange={handleSportChange}>
                    <option value="">Select...</option>
                    {Object.keys(equipmentData).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="horizontal-group equipment-row">
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

                  <button
                    type="button"
                    className="add-btn inline-btn"
                    onClick={handleAddItem}
                    disabled={!sport || !equipment || !quantity}
                  >
                    + Add
                  </button>
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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './IssueEquipmentForm.css';
import { useUser } from '../../context/UserContext';
import { useEquipment } from '../../context/EquipmentContext';
import { MoveLeft, Barcode } from 'lucide-react';

const defaultDepartments = ['B.Tech', 'BCA', 'MCA', 'BBA', 'B.E.'];

const IssueEquipmentForm = () => {
  const { user } = useUser();
  const { categories, getByCategory } = useEquipment();

  const navigate = useNavigate();
  const member_id = user?.member_id || 1;
  const [step, setStep] = useState(1);
  const [enrollment, setEnrollment] = useState('');

  const enrollmentInputRef = useRef(null);
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

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
  const [issuequantity, setIssueQuantity] = useState('');
  const [addedItems, setAddedItems] = useState([]);
  const [itemError, setItemError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const normalizeDepartment = (deptStr) => {
    if (!deptStr) return '';
    const lower = String(deptStr).toLowerCase().trim();
    const match = defaultDepartments.find(
      d => d.toLowerCase() === lower
    );
    return match || deptStr;
  };

  const scanTimerRef = useRef(null);

  const fetchStudentByEnrollment = useCallback(async (enrollmentVal) => {
    const trimmed = (enrollmentVal || '').trim();
    if (!trimmed) return;

    setLoading(true);
    setFetchError('');
    setEnrollment(trimmed);

    try {
      const response = await fetch(`http://localhost:4221/students/${trimmed}`);
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
      }
      setStep(2);
    } catch (err) {
      console.error('Error fetching student data:', err);
      setIsReadOnly(false);
      setFetchError('Could not fetch student data from server. Please enter details manually.');
    } finally {
      setLoading(false);
    }
  }, []);

  const nextStep = (e) => {
    if (e) e.preventDefault();
    if (!enrollment.trim()) return;
    fetchStudentByEnrollment(enrollment);
  };

  // Auto-focus input on step 1
  useEffect(() => {
    if (step === 1 && enrollmentInputRef.current) {
      enrollmentInputRef.current.focus();
    }
  }, [step]);

  // Global barcode listener for hardware barcode scanners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (step !== 1) return;

      if (e.key === 'Enter' || e.key === 'Tab') {
        if (barcodeBuffer.current.length >= 3) {
          e.preventDefault();
          const scannedCode = barcodeBuffer.current.trim();
          barcodeBuffer.current = '';
          if (scannedCode) {
            fetchStudentByEnrollment(scannedCode);
          }
        } else {
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        const currentTime = Date.now();
        const timeDiff = currentTime - lastKeyTime.current;

        if (timeDiff > 200) {
          barcodeBuffer.current = e.key;
        } else {
          barcodeBuffer.current += e.key;
        }
        lastKeyTime.current = currentTime;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [step, fetchStudentByEnrollment]);

  const prevStep = (e) => {
    e.preventDefault();
    setStep(1);
  };

  const handleEnrollmentChange = (e) => {
    const val = e.target.value;
    setEnrollment(val);

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

    // Auto-fetch if rapid typing / barcode scanning pauses (300ms debounce for 3+ chars)
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    if (val.trim().length >= 3) {
      scanTimerRef.current = setTimeout(() => {
        // Automatically trigger fetch if 3+ characters entered
        fetchStudentByEnrollment(val.trim());
      }, 350);
    }
  };

  const handleEnrollmentKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      if (enrollment.trim()) {
        e.preventDefault();
        fetchStudentByEnrollment(enrollment.trim());
      }
    }
  };

  const handleSportChange = (e) => {
    setSport(e.target.value);
    setEquipment('');
  };

  const availableEquipments = sport ? getByCategory(sport) : [];

  const handleAddItem = () => {
    if (sport && equipment && issuequantity > 0) {
      const foundEq = availableEquipments.find(e => e.equipment_name === equipment);
      setAddedItems([
        ...addedItems,
        {
          equipment_id: foundEq ? foundEq.equipment_id : null,
          equipment_name: equipment,
          quantity: parseInt(issuequantity, 10) || 1,
          sport,
          equipment,
          issuequantity
        }
      ]);
      setEquipment('');
      setIssueQuantity('');
      setItemError('');
    }
  };

  const handleRemoveItem = (index) => {
    const newItems = [...addedItems];
    newItems.splice(index, 1);
    setAddedItems(newItems);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (addedItems.length === 0) {
      setItemError('Please select and add at least one equipment to issue.');
      return;
    }
    setItemError('');
    setSubmitError('');
    setSubmitting(true);

    const payload = {
      member_id: Number(member_id),
      student_id: studentId ? Number(studentId) : null,
      issuedEquipments: addedItems.map(item => ({
        equipment_id: item.equipment_id,
        issue_quantity: Number(item.quantity || item.issuequantity)
      })),
    };

    try {
      const response = await fetch('http://localhost:4221/issue/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        navigate('/dashboard');
      } else {
        const errData = await response.json().catch(() => ({}));
        setSubmitError(errData.message || errData.error || `Server returned status ${response.status}`);
      }
    } catch (err) {
      console.error('Error submitting issue form:', err);
      setSubmitError('Failed to connect to backend server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-wrapper">
      <div className="form-container">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', position: 'relative' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="back-btn"
            style={{ position: 'absolute', left: 0, width: 'auto', padding: '6px 12px', fontSize: '13px' }}
          >
            {/* ← */}
            <MoveLeft />
          </button>
          <h2 style={{ width: '100%', textAlign: 'center', margin: 0 }}>Student Issue Form</h2>
        </div>
        <div className="form-overflow-wrapper">
          <div
            className="form-slider"
            style={{ transform: `translateX(${step === 1 ? '0' : '-50%'})` }}
          >
            {/* Step 1 */}
            <div className="form-step">
              <form onSubmit={nextStep}>
                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Enrollment Number</span>
                    <span style={{ fontSize: '11px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px', background: '#eff6ff', padding: '2px 8px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                      <Barcode size={14} /> Ready for Barcode Scan
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={enrollmentInputRef}
                      type="text"
                      placeholder="Scan Barcode or Enter Enrollment Number"
                      value={enrollment}
                      onChange={handleEnrollmentChange}
                      onKeyDown={handleEnrollmentKeyDown}
                      required
                      autoFocus
                    />
                  </div>
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
                {submitError && (
                  <p className="error-message" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px' }}>
                    {submitError}
                  </p>
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
                  <label>Sports</label>
                  <select value={sport} onChange={handleSportChange}>
                    <option value="">Select...</option>
                    {categories.map((s) => (
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
                        <option key={eq.equipment_id} value={eq.equipment_name}>{eq.equipment_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group qty-group">
                    <label>Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={issuequantity}
                      onChange={(e) => setIssueQuantity(e.target.value)}
                      disabled={!equipment}
                    />
                  </div>

                  <button
                    type="button"
                    className="add-btn inline-btn"
                    onClick={handleAddItem}
                    disabled={!sport || !equipment || !issuequantity}
                  >
                    + Add
                  </button>
                </div>

                {itemError && (
                  <p className="error-message" style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '8px', marginBottom: '8px' }}>
                    {itemError}
                  </p>
                )}

                {addedItems.length > 0 && (
                  <div className="added-items-list">
                    {addedItems.map((item, index) => (
                      <div className="added-item" key={index}>
                        <span><strong>{item.sport}</strong>: {item.equipment} (x{item.issuequantity})</span>
                        <button type="button" className="remove-btn" onClick={() => handleRemoveItem(index)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="button-group" style={{ marginTop: '30px' }}>
                  <button type="button" onClick={prevStep} className="back-btn" disabled={submitting}>Back</button>
                  <button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueEquipmentForm;

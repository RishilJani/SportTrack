import React, { useState } from 'react';
import './EnrollmentForm.css';

const equipmentData = {
  "Cricket": ['Bat', 'Ball', 'Stumps', 'Pads', 'Gloves', 'Helmet'],
  "Badminton": ['Racket', 'Shuttle'],
  "Chess": ['Ches', 'Chess Clock'],
  "Football": ['Football', 'Goal Nets', 'Cones', 'Shin Guards'],
  "Table Tennis": ['Table Tennis Racket', 'Table Tennis Ball']
};

const EnrollmentForm = () => {
  const [step, setStep] = useState(1);
  const [enrollment, setEnrollment] = useState('');
  const [sport, setSport] = useState('');
  const [equipment, setEquipment] = useState('');

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
    setEquipment(''); // Reset equipment when sport changes
  };

  const availableEquipments = sport && equipmentData[sport] ? equipmentData[sport] : [];

  return (
    <div className="form-wrapper">
      <div className="form-container">
        <h2>Student Registration</h2>
        <div className="form-slider">

          {/* Step 1 */}
          {step == 1 ?
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

            : <div className="form-step">
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label>Enrollment Number</label>
                  <input type="text" value={enrollment} readOnly />
                </div>
                <div className="form-group">
                  <label>Student Name</label>
                  <input type="text" placeholder="Enter Name" required />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select required>
                    <option value="">Select Department</option>
                    <option value="cs">Computer Science</option>
                    <option value="it">Information Technology</option>
                    <option value="mech">Mechanical</option>
                    <option value="civil">Civil</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Semester</label>
                  <input type="number" placeholder="Enter Semester" min="1" max="8" required />
                </div>

                <div className="form-group">
                  <label>Sports</label>
                  <select value={sport} onChange={handleSportChange} required>
                    <option value="">Select a Sport</option>
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
                    required
                    disabled={!sport}
                  >
                    <option value="">Select Equipment</option>
                    {availableEquipments.map((eq) => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" placeholder="Enter Quantity" min="1" required />
                </div>

                <div className="button-group">
                  <button type="button" onClick={prevStep} className="back-btn">Back</button>
                  <button type="submit">Submit</button>
                </div>
              </form>
            </div>
          }


        </div>
      </div>
    </div>
  );
};

export default EnrollmentForm;

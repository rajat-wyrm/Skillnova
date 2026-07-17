import React, { useState } from "react";

const AddInternModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    internId: "",
    name: "",
    email: "",
    department: "",
    offerLetterDate: "",
    onboardingDate: "",
    currentStage: "Offer Letter",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    if (
      !formData.internId ||
      !formData.name ||
      !formData.email ||
      !formData.department
    ) {
      alert("Please fill all required fields.");
      return;
    }

    onSave(formData);

    setFormData({
      internId: "",
      name: "",
      email: "",
      department: "",
      offerLetterDate: "",
      onboardingDate: "",
      currentStage: "Offer Letter",
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>Add Intern</h2>

        <input
          type="text"
          name="internId"
          placeholder="Intern ID"
          value={formData.internId}
          onChange={handleChange}
        />

        <input
          type="text"
          name="name"
          placeholder="Intern Name"
          value={formData.name}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          type="text"
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleChange}
        />

        <label>Offer Letter Date</label>

        <input
          type="date"
          name="offerLetterDate"
          value={formData.offerLetterDate}
          onChange={handleChange}
        />

        <label>Actual Onboarding Date</label>

        <input
          type="date"
          name="onboardingDate"
          value={formData.onboardingDate}
          onChange={handleChange}
        />

        <label>Current Stage</label>

        <select
          name="currentStage"
          value={formData.currentStage}
          onChange={handleChange}
        >
          <option>Offer Letter</option>
          <option>TL Assigned</option>
          <option>Internship Started</option>
          <option>Task Assigned</option>
          <option>Task Completed</option>
          <option>Internship Completed</option>
          <option>Certificate Issued</option>
        </select>

        <div style={{ marginTop: "20px" }}>
          <button onClick={handleSave}>Save</button>

          <button
            onClick={onClose}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalStyle = {
  background: "#fff",
  padding: "25px",
  borderRadius: "10px",
  width: "420px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

export default AddInternModal;
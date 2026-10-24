
import React from "react";

export default function App() {
  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      padding: "40px",
      textAlign: "center"
    }}>
      <h1>🩸 Blood Bank Management System</h1>
      <p>Welcome to the Blood Donation Portal</p>

      <h2>Dashboard</h2>

      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        flexWrap: "wrap"
      }}>
        <div style={{ padding: "25px", border: "1px solid #ddd" }}>
          <h3>Donor Registration</h3>
          <p>Register new blood donors</p>
        </div>

        <div style={{ padding: "25px", border: "1px solid #ddd" }}>
          <h3>Blood Availability</h3>
          <p>Check available blood groups</p>
        </div>

        <div style={{ padding: "25px", border: "1px solid #ddd" }}>
          <h3>Blood Requests</h3>
          <p>Manage blood requests</p>
        </div>
      </div>
    </div>
  );
}

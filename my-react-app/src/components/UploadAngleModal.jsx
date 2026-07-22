import React, { useState } from "react";
import { uploadPersonAngle } from "../api/persons";

const PRESET_ANGLES = ["Frontal", "Left 45°", "Right 45°", "Left Profile", "Right Profile"];

export function UploadAngleModal({ personId, personName, onSuccess, onClose }) {
  const [selectedAngle, setSelectedAngle] = useState(PRESET_ANGLES[0]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image file first.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await uploadPersonAngle(personId, file, selectedAngle);
      setFile(null);
      setPreviewUrl(null);
      onSuccess(); // Triggers parent to reload list
    } catch (err) {
      const msg = err.response?.data?.photo?.[0] || "Failed to upload image.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>Add Baseline Angle</h3>
        <p>Target: <strong>{personName}</strong></p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label>Angle Label:</label>
            <select value={selectedAngle} onChange={(e) => setSelectedAngle(e.target.value)}>
              {PRESET_ANGLES.map((angle) => (
                <option key={angle} value={angle}>{angle}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label>Reference Image:</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          {previewUrl && (
            <img src={previewUrl} alt="Preview" style={styles.preview} />
          )}

          <div style={styles.actions}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Save Angle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 1000
  },
  modal: {
    backgroundColor: "#1e293b", color: "#fff", padding: "20px",
    borderRadius: "8px", width: "350px", display: "flex", flexDirection: "column", gap: "10px"
  },
  field: { display: "flex", flexDirection: "column", gap: "5px" },
  preview: { width: "100%", height: "150px", objectFit: "cover", borderRadius: "4px" },
  error: { color: "#f87171", fontSize: "12px", backgroundColor: "#450a0a", padding: "8px", borderRadius: "4px" },
  actions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }
};
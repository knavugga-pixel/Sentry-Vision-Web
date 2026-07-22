import axios from "axios";

// Points to your local Django dev server
const API_BASE = "http://127.0.0.1:8000/api/persons/";

// 1. Get all persons with their baseline angles
export const getPersons = async () => {
  const response = await axios.get(API_BASE);
  return response.data;
};

// 2. Upload an angled reference photo for a specific person
export const uploadPersonAngle = async (personId, file, angleLabel) => {
  const formData = new FormData();
  formData.append("photo", file);
  formData.append("angle_label", angleLabel);

  const response = await axios.post(`${API_BASE}${personId}/upload_angle/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
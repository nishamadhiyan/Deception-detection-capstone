# VERITAS — Smart Deception Detection Using Computer Vision

VERITAS is a full-stack academic project for analyzing facial and behavioral indicators during a person's response using computer vision and machine learning.

## 🚀 Live Demo

**Frontend:**  
https://deception-detection-capstone-kghd3bufm-deception-detection.vercel.app/

**Backend API:**  
https://deception-detection-api.onrender.com

**API Health Check:**  
https://deception-detection-api.onrender.com/api/health

**Source Code:**  
https://github.com/nishamadhiyan/Deception-detection-capstone

---

## 🧠 Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Vercel

### Backend
- Python 3.11
- Flask
- Flask-CORS
- Gunicorn
- Render

### Computer Vision
- OpenCV
- MediaPipe Face Mesh

### Machine Learning
- Support Vector Machine (SVM)
- StandardScaler
- scikit-learn
- Joblib

---

## 🔍 How the System Works

The system follows this pipeline:

Webcam
↓
Video frames
↓
MediaPipe facial landmarks
↓
Feature extraction
↓
StandardScaler
↓
SVM classifier
↓
Deception probability
↓
Verdict and session report

The frontend captures a webcam frame approximately every 900 ms and sends the frame to the Flask backend.

The backend processes the frame using MediaPipe and extracts behavioral features including:

- Eye Aspect Ratio (EAR)
- Mouth Aspect Ratio (MAR)
- Gaze ratio
- Blink rate
- Head yaw
- Head pitch
- Head roll

These numerical features are standardized and passed to the trained SVM classifier.

The classifier returns a deception probability, which is displayed by the VERITAS console.

---

## 🤖 Machine Learning Model

The deployed classifier is a Support Vector Machine (SVM).

The trained model is stored as:

backend/models/deception_model.joblib

The feature scaler is stored as:

backend/models/scaler.joblib

The model uses seven extracted behavioral features.

The SVM produces a probability estimate for the learned classes, which the application uses to display:

- Deception probability
- Deceptive Indicators
- Truthful Indicators

### Important

The system detects behavioral patterns associated with the training data. It does not prove that a person is objectively telling the truth or lying.

---

## 📁 Project Structure

deception-detection-capstone/
│
├── backend/
│   ├── models/
│   │   ├── deception_model.joblib
│   │   └── scaler.joblib
│   ├── app.py
│   ├── classifier.py
│   ├── feature_extraction.py
│   ├── train_model.py
│   ├── requirements.txt
│   ├── render.yaml
│   ├── Procfile
│   └── .python-version
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
│
├── .vscode/
│   └── settings.json
│
└── README.md

---

## 💻 Run Locally

### Backend

```bash
cd backend

python -m venv venv
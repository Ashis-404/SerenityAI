import joblib
import pandas as pd

from feature_extractor import FeatureExtractor

# -----------------------------------
# Load trained model
# -----------------------------------

model = joblib.load("models/emotion_model.pkl")

# Load label encoder
encoder = joblib.load("models/label_encoder.pkl")

# -----------------------------------
# Initialize feature extractor
# -----------------------------------

extractor = FeatureExtractor()

# -----------------------------------
# Audio file to predict
# -----------------------------------

file_path = "test.wav"

print("\nExtracting features...")

features = extractor.extract_features(file_path)

# Convert to DataFrame
X = pd.DataFrame([features])

# -----------------------------------
# Predict emotion
# -----------------------------------

prediction = model.predict(X)

emotion = encoder.inverse_transform(prediction)

# -----------------------------------
# Predict probabilities
# -----------------------------------

probabilities = model.predict_proba(X)[0]

print("\n🎤 EMOTION PREDICTION")
print("-" * 40)

print(f"\nPredicted Emotion: {emotion[0].upper()}")

print("\nConfidence Scores:\n")

for label, prob in zip(encoder.classes_, probabilities):

    print(f"{label}: {prob * 100:.2f}%")
    
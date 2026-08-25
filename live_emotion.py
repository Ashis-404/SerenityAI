import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wav

import pandas as pd
import joblib
import time

from feature_extractor import FeatureExtractor

# -----------------------------------
# SETTINGS
# -----------------------------------

SAMPLE_RATE = 16000
DURATION = 5  # seconds

# -----------------------------------
# LOAD MODEL
# -----------------------------------

print("\nLoading trained model...")

model = joblib.load("models/emotion_model.pkl")

encoder = joblib.load("models/label_encoder.pkl")

# -----------------------------------
# FEATURE EXTRACTOR
# -----------------------------------

extractor = FeatureExtractor()

# -----------------------------------
# RECORD AUDIO
# -----------------------------------

print("\n🎤 Speak after the countdown...\n")

for i in range(3, 0, -1):
    print(f"{i}...")
    time.sleep(1)

print("\n🔴 RECORDING NOW!")

audio = sd.rec(
    int(DURATION * SAMPLE_RATE),
    samplerate=SAMPLE_RATE,
    channels=1,
    dtype=np.float32
)

sd.wait()

print("✅ Recording complete!")

# -----------------------------------
# SAVE TEMP AUDIO
# -----------------------------------

temp_file = "temp.wav"

wav.write(
    temp_file,
    SAMPLE_RATE,
    (audio * 32767).astype(np.int16)
)

# -----------------------------------
# EXTRACT FEATURES
# -----------------------------------

print("\nExtracting voice features...")

features = extractor.extract_features(temp_file)

X = pd.DataFrame([features])

# -----------------------------------
# PREDICT EMOTION
# -----------------------------------

prediction = model.predict(X)

emotion = encoder.inverse_transform(prediction)

probabilities = model.predict_proba(X)[0]

# -----------------------------------
# DISPLAY RESULTS
# -----------------------------------

print("\n" + "=" * 50)
print("🎭 LIVE EMOTION PREDICTION")
print("=" * 50)

print(f"\nDetected Emotion: {emotion[0].upper()}")

print("\nConfidence Scores:\n")

for label, prob in zip(encoder.classes_, probabilities):

    print(f"{label}: {prob * 100:.2f}%")

print("\n" + "=" * 50)
import os
import logging
from typing import Dict, Tuple, Any
import numpy as np
import pandas as pd
import joblib
import librosa
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class EmotionService:
    def __init__(self):
        self.sample_rate = 16000
        self.model_version = "RandomForest_v1.0"
        self.model = None
        self.encoder = None
        self._load_models()

    def _load_models(self):
        try:
            if os.path.exists(settings.MODEL_PATH) and os.path.exists(settings.ENCODER_PATH):
                self.model = joblib.load(settings.MODEL_PATH)
                self.encoder = joblib.load(settings.ENCODER_PATH)
                logger.info("Emotion model and label encoder successfully loaded.")
            else:
                logger.warning(f"Emotion model files not found at {settings.MODEL_PATH}")
        except Exception as e:
            logger.error(f"Error loading emotion model: {e}")

    def extract_features(self, file_path: str) -> Dict[str, float]:
        """Extracts acoustic features (Pitch, RMS Energy, Speaking Rate, 13 MFCCs) identical to baseline."""
        try:
            audio, sr = librosa.load(file_path, sr=self.sample_rate)
            features = {}

            # 1. Pitch Features
            pitches, magnitudes = librosa.piptrack(y=audio, sr=sr, fmin=50, fmax=300)
            pitch_values = []
            for i in range(pitches.shape[1]):
                index = magnitudes[:, i].argmax()
                pitch = pitches[index, i]
                if pitch > 0:
                    pitch_values.append(pitch)

            if len(pitch_values) > 0:
                features["pitch_mean"] = float(np.mean(pitch_values))
                features["pitch_std"] = float(np.std(pitch_values))
                features["pitch_range"] = float(np.max(pitch_values) - np.min(pitch_values))
            else:
                features["pitch_mean"] = 0.0
                features["pitch_std"] = 0.0
                features["pitch_range"] = 0.0

            # 2. Energy Features
            rms = librosa.feature.rms(y=audio)[0]
            features["energy_mean"] = float(np.mean(rms))
            features["energy_std"] = float(np.std(rms))

            # 3. Speaking Rate Approximation
            onset_frames = librosa.onset.onset_detect(y=audio, sr=sr)
            duration = librosa.get_duration(y=audio, sr=sr)
            if duration > 0:
                features["speaking_rate"] = float(len(onset_frames) / duration)
            else:
                features["speaking_rate"] = 0.0

            # 4. MFCC Features
            mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
            for i in range(13):
                features[f"mfcc_{i+1}"] = float(np.mean(mfccs[i]))

            return features
        except Exception as e:
            logger.error(f"Error extracting features from {file_path}: {e}")
            raise e

    def predict_emotion(self, file_path: str) -> Tuple[str, Dict[str, float]]:
        """
        Runs inference on the audio file.
        Returns:
            top_emotion: str (e.g. 'calm', 'happy', 'sad', 'angry', 'fearful', 'neutral')
            probabilities: Dict[str, float] (confidence scores normalized 0-1)
        """
        if self.model is None or self.encoder is None:
            # Fallback if model not loaded
            return "neutral", {"neutral": 1.0}

        try:
            features = self.extract_features(file_path)
            X = pd.DataFrame([features])
            prediction = self.model.predict(X)
            top_emotion = self.encoder.inverse_transform(prediction)[0]
            
            probabilities = self.model.predict_proba(X)[0]
            prob_dict = {
                str(label): float(round(prob, 4))
                for label, prob in zip(self.encoder.classes_, probabilities)
            }
            return str(top_emotion), prob_dict
        except Exception as e:
            logger.error(f"Emotion prediction failed: {e}")
            return "neutral", {"neutral": 1.0}

emotion_service = EmotionService()

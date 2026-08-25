import librosa
import numpy as np

class FeatureExtractor:

    def __init__(self):
        self.sample_rate = 16000

    def extract_features(self, file_path):

        # Load audio
        audio, sr = librosa.load(
            file_path,
            sr=self.sample_rate
        )

        features = {}

        # -----------------------------
        # 1. Pitch Features
        # -----------------------------
        pitches, magnitudes = librosa.piptrack(
            y=audio,
            sr=sr,
            fmin=50,
            fmax=300
        )

        pitch_values = []

        for i in range(pitches.shape[1]):

            index = magnitudes[:, i].argmax()
            pitch = pitches[index, i]

            if pitch > 0:
                pitch_values.append(pitch)

        if len(pitch_values) > 0:

            features["pitch_mean"] = np.mean(pitch_values)
            features["pitch_std"] = np.std(pitch_values)
            features["pitch_range"] = (
                np.max(pitch_values) - np.min(pitch_values)
            )

        else:
            features["pitch_mean"] = 0
            features["pitch_std"] = 0
            features["pitch_range"] = 0

        # -----------------------------
        # 2. Energy Features
        # -----------------------------
        rms = librosa.feature.rms(y=audio)[0]

        features["energy_mean"] = np.mean(rms)
        features["energy_std"] = np.std(rms)

        # -----------------------------
        # 3. Speaking Rate Approximation
        # -----------------------------
        onset_frames = librosa.onset.onset_detect(
            y=audio,
            sr=sr
        )

        duration = librosa.get_duration(y=audio, sr=sr)

        if duration > 0:
            features["speaking_rate"] = (
                len(onset_frames) / duration
            )
        else:
            features["speaking_rate"] = 0

        # -----------------------------
        # 4. MFCC Features
        # -----------------------------
        mfccs = librosa.feature.mfcc(
            y=audio,
            sr=sr,
            n_mfcc=13
        )

        for i in range(13):
            features[f"mfcc_{i+1}"] = np.mean(mfccs[i])

        return features
import os
import pandas as pd

from feature_extractor import FeatureExtractor

# Initialize extractor
extractor = FeatureExtractor()

# Dataset path
DATASET_PATH = "dataset"

# Emotion mapping
emotion_map = {
    "01": "neutral",
    "02": "calm",
    "03": "happy",
    "04": "sad",
    "05": "angry"
}

all_data = []

print("\nPreparing dataset...\n")

# Walk through all folders/files
for root, dirs, files in os.walk(DATASET_PATH):

    for file in files:

        if file.endswith(".wav"):

            try:
                filepath = os.path.join(root, file)

                # Extract filename parts
                parts = file.split("-")

                # Emotion code is third number
                emotion_code = parts[2]

                # Skip emotions not in map
                if emotion_code not in emotion_map:
                    continue

                emotion = emotion_map[emotion_code]

                print(f"Processing: {file}")

                # Extract features
                features = extractor.extract_features(filepath)

                # Add emotion label
                features["emotion"] = emotion

                # Add to dataset
                all_data.append(features)

            except Exception as e:
                print(f"Error processing {file}: {e}")

# Create DataFrame
df = pd.DataFrame(all_data)

# Save CSV
df.to_csv("emotion_dataset.csv", index=False)

print("\nDataset creation complete!")
print(f"Total samples: {len(df)}")

print("\nEmotion Distribution:")
print(df["emotion"].value_counts())
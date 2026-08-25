from feature_extractor import FeatureExtractor

extractor = FeatureExtractor()

file_path = "dataset/Actor_01/03-01-01-01-01-01-01.wav"

features = extractor.extract_features(file_path)

print("\nExtracted Features:\n")

for key, value in features.items():
    print(f"{key}: {value}")
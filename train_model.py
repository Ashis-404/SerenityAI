import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
from sklearn.metrics import classification_report

import joblib

print("\nLoading dataset...")

# Load dataset
df = pd.read_csv("emotion_dataset.csv")

print(f"Dataset shape: {df.shape}")

# -----------------------------------
# Separate features and labels
# -----------------------------------

X = df.drop(columns=["emotion"])
y = df["emotion"]

# -----------------------------------
# Convert labels into numbers
# -----------------------------------

encoder = LabelEncoder()

y_encoded = encoder.fit_transform(y)

print("\nEmotion Classes:")
for i, label in enumerate(encoder.classes_):
    print(f"{i} -> {label}")

# -----------------------------------
# Split dataset
# -----------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded
)

print(f"\nTraining samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")

# -----------------------------------
# Create Random Forest model
# -----------------------------------

print("\nTraining model...")

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

# -----------------------------------
# Train model
# -----------------------------------

model.fit(X_train, y_train)

# -----------------------------------
# Predict on test data
# -----------------------------------

predictions = model.predict(X_test)

# -----------------------------------
# Accuracy
# -----------------------------------

accuracy = accuracy_score(y_test, predictions)

print(f"\nModel Accuracy: {accuracy * 100:.2f}%")

# -----------------------------------
# Detailed report
# -----------------------------------

print("\nClassification Report:\n")

print(
    classification_report(
        y_test,
        predictions,
        target_names=encoder.classes_
    )
)

# -----------------------------------
# Save model
# -----------------------------------

joblib.dump(model, "models/emotion_model.pkl")

# Save label encoder
joblib.dump(encoder, "models/label_encoder.pkl")

print("\nModel saved successfully!")
print("Saved to models/")
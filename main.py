from record_audio import record_audio

from speech_to_text import transcribe_audio

from chatbot import generate_response

from text_to_speech import speak

import joblib
import pandas as pd

from feature_extractor import FeatureExtractor

# -----------------------------------
# LOAD EMOTION MODEL
# -----------------------------------

print("\nLoading emotion model...")

model = joblib.load("models/emotion_model.pkl")

encoder = joblib.load("models/label_encoder.pkl")

extractor = FeatureExtractor()

# -----------------------------------
# MAIN LOOP
# -----------------------------------

while True:

    print("\n" + "=" * 50)
    print("🎤 EMOTION AWARE VOICE ASSISTANT")
    print("=" * 50)

    # -----------------------------------
    # RECORD USER AUDIO
    # -----------------------------------

    audio_file = record_audio("temp.wav")

    # -----------------------------------
    # SPEECH TO TEXT
    # -----------------------------------

    print("\n📝 Converting speech to text...")

    user_text = transcribe_audio(audio_file)

    print(f"\n🧑 USER SAID:\n{user_text}")

    # -----------------------------------
    # EMOTION PREDICTION
    # -----------------------------------

    print("\n🎭 Predicting emotion...")

    features = extractor.extract_features(audio_file)

    X = pd.DataFrame([features])

    prediction = model.predict(X)

    emotion = encoder.inverse_transform(prediction)[0]

    print(f"\n🎭 DETECTED EMOTION: {emotion.upper()}")

    # -----------------------------------
    # CHATBOT RESPONSE
    # -----------------------------------

    print("\n🤖 Generating AI response...")

    bot_response = generate_response(
        user_text,
        emotion
    )

    print(f"\n🤖 AI RESPONSE:\n{bot_response}")

    # -----------------------------------
    # SPEAK RESPONSE
    # -----------------------------------

    speak(bot_response)

    # -----------------------------------
    # EXIT OPTION
    # -----------------------------------

    print("\nPress ENTER to continue...")
    print("Type 'exit' to quit.")

    choice = input("\nChoice: ").lower()

    if choice == "exit":
        break
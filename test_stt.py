from speech_to_text import transcribe_audio

text = transcribe_audio("temp.wav")

print("\n📝 TRANSCRIBED TEXT:")
print(text)
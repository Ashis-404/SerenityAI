import pyttsx3

# Initialize engine
engine = pyttsx3.init()

# Optional settings
engine.setProperty('rate', 170)

voices = engine.getProperty('voices')

# Select voice
engine.setProperty('voice', voices[0].id)

def speak(text):

    print("\n🔊 AI SPEAKING...\n")

    engine.say(text)

    engine.runAndWait()
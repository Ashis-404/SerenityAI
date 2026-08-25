import whisper

print("Loading Whisper model...")

model = whisper.load_model("base")

def transcribe_audio(file_path):

    result = model.transcribe(
    file_path,
    language="en"
)

    return result["text"]
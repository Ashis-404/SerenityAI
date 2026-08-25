import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wav
import time

# Audio settings
SAMPLE_RATE = 16000
DURATION = 15

def record_audio(output_file="temp.wav"):

    print("\n🎤 Speak after countdown...\n")

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

    # Save WAV file
    wav.write(
        output_file,
        SAMPLE_RATE,
        (audio * 32767).astype(np.int16)
    )

    print(f"✅ Saved as {output_file}")

    return output_file
import os
import base64
from dotenv import load_dotenv
from sarvamai import SarvamAI

load_dotenv()

API_KEY = os.getenv("SARVAM_API_KEY")

if not API_KEY:
    raise ValueError("SARVAM_API_KEY not found in .env")

client = SarvamAI(
    api_subscription_key=API_KEY
)


def transcribe_audio(audio_path):
    with open(audio_path, "rb") as audio_file:
        response = client.speech_to_text.transcribe(
            file=audio_file,
            model="saaras:v4",
        )

    return response.transcript
def text_to_speech(text, output_path="response.wav"):
    response = client.text_to_speech.convert(
        text=text,
        language_code="en-IN",
        model="bulbul:v3",
    )

    audio = base64.b64decode(response.audios[0])

    with open(output_path, "wb") as f:
        f.write(audio)

    return output_path
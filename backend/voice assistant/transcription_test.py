import speech_recognition as sr
import sys

def transcribe_audio(audio_file_path):
    """Transcribes audio from a WAV file."""

    recognizer = sr.Recognizer()

    try:
        with sr.AudioFile(audio_file_path) as source:
            audio_data = recognizer.record(source)  # Record the entire audio file

        text = recognizer.recognize_google(audio_data)  # Use Google Web Speech API
        return text

    except sr.UnknownValueError:
        return "Speech recognition could not understand audio"
    except sr.RequestError as e:
        return f"Could not request results from Google Web Speech API service; {e}"
    except FileNotFoundError:
        return "Audio file not found."
    except Exception as e:
        return f"An unexpected error occured: {e}"

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python speech_recognition_test.py <audio_file_path>")
        sys.exit(1)

    audio_file = sys.argv[1]
    result = transcribe_audio(audio_file)
    print(result)
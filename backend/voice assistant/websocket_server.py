# backend/websocket_server.py
import asyncio
import websockets
import speech_recognition as sr
import json
import io
import logging
import wave 

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

recognizer = sr.Recognizer()
# Define a filename for the saved audio
AUDIO_SAVE_PATH = "backend/audio/received_audio_from_mic.wav"

async def transcribe(websocket):
    """Handles WebSocket connections and transcribes audio chunks."""

    logging.info(f"Connection established with {websocket.remote_address}")

    # --- TEMPORARY CODE FOR TESTING LOCAL FILE ---
    # try:
    #     with sr.AudioFile("backend/audio/record_out.wav") as source:
    #         audio_recorded = recognizer.record(source)
    #     try:
    #         text = recognizer.recognize_google(audio_recorded, language='en-US')
    #         logging.info(f"Transcription from local file: {text}")
    #     except sr.UnknownValueError:
    #         logging.warning("Speech recognition could not understand audio from local file")
    #     except sr.RequestError as e:
    #         logging.error(f"Could not request results from Google Web Speech API service for local file; {e}")
    # except FileNotFoundError:
    #     logging.error("Error: backend/audio/file.wav not found.")
    # except Exception as e:
    #     logging.error(f"Error processing local audio file: {e}")
    
    try:
        async for message in websocket:
            # Save the received message to a WAV file
            # try:
            #     with open(AUDIO_SAVE_PATH, "wb") as f:
            #         f.write(message)
            #     logging.info(f"Saved received audio to {AUDIO_SAVE_PATH}")
            # except Exception as e:
            #     logging.error(f"Error saving received audio: {e}")
            try:
                # Process as WAV directly
                audio = sr.AudioFile(io.BytesIO(message))
                with audio as source:
                    audio_recorded = recognizer.record(source)
                text = recognizer.recognize_google(audio_recorded)
                await websocket.send(json.dumps({"text": text}))
                logging.info(f"Transcribed chunk: {text}")

            except sr.UnknownValueError:
                await websocket.send(json.dumps({"error": "Speech recognition could not understand audio in this chunk"}))
                logging.warning("Speech recognition could not understand audio in this chunk")
            except sr.RequestError as e:
                await websocket.send(json.dumps({"error": f"Could not request results from Google Web Speech API service for this chunk; {e}"}))
                logging.error(f"Could not request results from Google Web Speech API service for this chunk; {e}")
            except Exception as e:
                await websocket.send(json.dumps({"error": f"An unexpected error occurred: {e}"}))
                logging.error(f"Error processing audio chunk: {e}")

    except websockets.ConnectionClosed:
        logging.info(f"Connection closed with {websocket.remote_address}")
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")

async def main():
    print("Python server started.")
    async with websockets.serve(transcribe, "localhost", 8765):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
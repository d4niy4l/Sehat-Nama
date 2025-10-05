"""
test_pipeline_llm.py

Simple end-to-end test for: STT -> Start LLM session -> Send message -> TTS

Usage:
  - Put an audio file (Urdu) next to this script and set AUDIO_FILE.
  - Ensure the FastAPI server is running (python main.py)
  - Run: python test_pipeline_llm.py

This script will:
  1. POST /transcribe to get text
  2. POST /api/start-interview to create session
  3. POST /api/send-message with the transcribed text
  4. POST /text-to-speech with the assistant reply and save the audio
"""

import requests
import os
from dotenv import load_dotenv
from pathlib import Path
import json
import re
load_dotenv()

API_BASE = os.getenv('LISTENER_URL', 'http://localhost:8000')
TRANS_URL = f"{API_BASE}/transcribe"
START_URL = f"{API_BASE}/api/start-interview"
SEND_URL = f"{API_BASE}/api/send-message"
TTS_URL = f"{API_BASE}/text-to-speech"

AUDIO_FILE = 'stomachache.mp3'  # change to your file
OUTPUT_TTS = 'assistant_reply.mp3'

def main():
    if not Path(AUDIO_FILE).exists():
        print(f"Audio file '{AUDIO_FILE}' not found. Place it next to the script or change AUDIO_FILE")
        return

    print('1) Transcribing audio...')
    with open(AUDIO_FILE, 'rb') as f:
        files = {'file': (AUDIO_FILE, f, 'audio/opus')}
        data = {'model': 'whisper-large-v3'}
        r = requests.post(TRANS_URL, files=files, data=data)

    if r.status_code != 200:
        print('Transcription failed:', r.status_code, r.text)
        return

    transcript = r.json().get('text')
    print('Transcribed text:', transcript)

    print('\n2) Starting LLM interview...')
    r = requests.post(START_URL)
    if r.status_code != 200:
        print('Start interview failed:', r.status_code, r.text)
        return

    start_json = r.json()
    session_id = start_json.get('session_id')
    ai_intro = start_json.get('message')
    print('Session ID:', session_id)
    print('AI Intro:', ai_intro)

    print('\n3) Sending transcribed message to LLM session...')
    payload = {'session_id': session_id, 'message': transcript}
    r = requests.post(SEND_URL, json=payload)
    if r.status_code != 200:
        print('Send message failed:', r.status_code, r.text)
        return

    resp = r.json()
    
    raw_message = resp.get('message', '')

    # Try to extract the content='...' part safely
    match = re.search(r"content='([^']+)'", raw_message)
    if match:
        ai_reply = match.group(1)
    else:
        print("Could not extract AI reply from response:", raw_message)
        return

    print('AI Reply:', ai_reply)

    print('\n4) Asking TTS to generate audio response...')
    tts_payload = {'text': ai_reply, 'voice_id': 'v_meklc281', 'output_format': 'MP3_22050_32', 'save_file': 'false'}

    r = requests.post(TTS_URL, data=tts_payload, stream=True)
    if r.status_code != 200:
        print('TTS failed:', r.status_code, r.text)
        return

    with open(OUTPUT_TTS, 'wb') as f:
        for chunk in r.iter_content(8192):
            if chunk:
                f.write(chunk)

    print('Saved assistant audio to', OUTPUT_TTS)

    # Save conversation snapshot
    snapshot = {
        'session_id': session_id,
        'transcript': transcript,
        'ai_intro': ai_intro,
        'ai_reply': ai_reply,
        'collected_data': resp.get('collected_data')
    }
    Path('pipeline_snapshot.json').write_text(json.dumps(snapshot, ensure_ascii=False, indent=2))
    print('Saved snapshot to pipeline_snapshot.json')

if __name__ == '__main__':
    main()

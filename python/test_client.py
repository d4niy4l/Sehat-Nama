"""
simple_test.py - Complete STT → TTS test pipeline
"""

import requests
from dotenv import load_dotenv
import os
import json
from pathlib import Path

# Load environment variables
load_dotenv()

# Get API URL from .env
API_BASE_URL = os.getenv("LISTENER_URL", "http://localhost:8000")
API_TRANSCRIBE_URL = f"{API_BASE_URL}/transcribe"
API_TTS_URL = f"{API_BASE_URL}/text-to-speech"

# 🎯 CHANGE THIS to your audio file
AUDIO_FILE = "groqTestOne.opus"
OUTPUT_AUDIO = "tts_output.mp3"

print(f"\n🎤 Testing Complete Pipeline: STT → TTS")
print(f"📍 API URL: {API_BASE_URL}\n")
print("=" * 60)

try:
    # ============================================
    # STEP 1: Speech-to-Text (Transcription)
    # ============================================
    print("\n📝 STEP 1: Transcribing audio...")
    print(f"   Input: {AUDIO_FILE}")
    
    with open(AUDIO_FILE, "rb") as f:
        files = {"file": f}
        data = {"model": "whisper-large-v3"}
        
        print("   ⏳ Processing...")
        stt_response = requests.post(API_TRANSCRIBE_URL, files=files, data=data)
    
    # Check transcription result
    if stt_response.status_code == 200:
        result = stt_response.json()
        
        # Save transcription to JSON
        with open("transcription_result_large_2.json", "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=4)
        
        transcribed_text = result["text"]
        
        print("\n   ✅ Transcription successful!")
        print("   " + "-" * 56)
        print(f"   📝 Text: {transcribed_text}")
        print("   " + "-" * 56)
        print(f"   ⏱️  Duration: {result['duration']:.1f} seconds")
        print(f"   🌐 Language: {result['language']}")
        print(f"   💾 Saved: transcription_result.json")
        
        # ============================================
        # STEP 2: Text-to-Speech (Generate Audio)
        # ============================================
        print(f"\n🔊 STEP 2: Converting text to speech...")
        print(f"   Text to convert: {transcribed_text[:50]}...")
        
        tts_data = {
            "text": transcribed_text,
            "voice_id": "v_meklc281",
            "output_format": "MP3_22050_32",
            "save_file": "false"  # Stream mode
        }
        
        print("   ⏳ Generating speech...")
        tts_response = requests.post(API_TTS_URL, data=tts_data, stream=True)
        
        if tts_response.status_code == 200:
            # Save streamed audio
            with open(OUTPUT_AUDIO, "wb") as f:
                for chunk in tts_response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            file_size = Path(OUTPUT_AUDIO).stat().st_size
            
            print("\n   ✅ Speech generated successfully!")
            print("   " + "-" * 56)
            print(f"   📁 Output: {OUTPUT_AUDIO}")
            print(f"   📊 Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
            print("   " + "-" * 56)
            
            # ============================================
            # FINAL SUMMARY
            # ============================================
            print("\n" + "=" * 60)
            print("🎉 PIPELINE COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            print(f"\n📥 Input Audio:  {AUDIO_FILE}")
            print(f"📝 Transcribed:  {transcribed_text}")
            print(f"📤 Output Audio: {OUTPUT_AUDIO}")
            print(f"\n▶️  Play '{OUTPUT_AUDIO}' to hear the generated speech!")
            print("\n" + "=" * 60 + "\n")
            
        else:
            print(f"\n   ❌ TTS Error: {tts_response.status_code}")
            print(f"   {tts_response.text}")
            
    else:
        print(f"\n❌ Transcription Error: {stt_response.status_code}")
        print(stt_response.text)

except FileNotFoundError:
    print(f"\n❌ Error: File '{AUDIO_FILE}' not found!")
    print("Please put your audio file in the same folder as this script.")

except requests.exceptions.ConnectionError:
    print(f"\n❌ Error: Cannot connect to API at {API_BASE_URL}!")
    print("Make sure the API is running: python main.py")
    print("\nIf running on different URL, add to .env:")
    print("LISTENER_URL=http://your-server:8000")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
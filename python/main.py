

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from groq import Groq
from typing import Literal
import os
import tempfile
from pathlib import Path
from dotenv import load_dotenv
import base64
import requests
# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Urdu STT API",
    description="Urdu Speech-to-Text using Groq Whisper",
    version="1.0.0"
)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable not set")

client = Groq(api_key=GROQ_API_KEY)

# Initialize UpliftAI configuration
UPLIFTAI_API_KEY = os.getenv("UPLIFTAI_API_KEY")
UPLIFTAI_BASE_URL = "https://api.upliftai.org/v1"

print(f"UpliftAI API Key: {'Set' if UPLIFTAI_API_KEY else 'Not Set'}")
# Supported audio formats
SUPPORTED_FORMATS = {'flac', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'ogg','opus', 'wav', 'webm'}


@app.get("/")
async def root():
    """Health check"""
    return {"status": "running", "message": "Urdu STT API"}


@app.post("/transcribe")
async def transcribe_urdu_audio(
    file: UploadFile = File(..., description="Audio file in Urdu"),
    model: Literal["whisper-large-v3-turbo", "whisper-large-v3"] = Form(
        default="whisper-large-v3-turbo",
        description="Whisper model (turbo is faster)"
    )
):
    
    
    # Validate file format
    file_ext = Path(file.filename).suffix.lower().lstrip('.')
    if file_ext not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported format. Use: {', '.join(SUPPORTED_FORMATS)}"
        )
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Transcribe with Groq Whisper (Urdu language)
        with open(temp_file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=audio_file,
                model=model,
                language="ur",  # Urdu language code
                response_format="verbose_json",
                temperature=0.0
            )
        
        # Clean up temp file
        os.unlink(temp_file_path)
        
        # Return response
        return {
            "text": transcription.text,
            "language": transcription.language,
            "duration": transcription.duration,
            "segments": transcription.segments
        }
    
    except Exception as e:
        # Clean up on error
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@app.post("/text-to-speech")
async def text_to_speech(
    text: str = Form(..., description="Text to convert to speech"),
    voice_id: str = Form(
        default="v_meklc281",
        description="UpliftAI voice ID"
    ),
    output_format: str = Form(
        default="MP3_22050_32",
        description="Audio output format"
    ),
    save_file: bool = Form(
        default=False,
        description="Save to file (testing) or stream (production)"
    )
):
    """
    Convert text to speech using UpliftAI
    
    - **text**: Text to convert to speech
    - **voice_id**: Voice ID from UpliftAI (default: v_meklc281)
    - **output_format**: Audio format (MP3_22050_32, MP3_44100_128, etc.)
    - **save_file**: True = save file, False = stream audio (production)
    """
    
    if not UPLIFTAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="UPLIFTAI_API_KEY not configured in .env file"
        )
    
    try:
        # Prepare UpliftAI TTS request
        url = f"{UPLIFTAI_BASE_URL}/synthesis/text-to-speech"
        headers = {
            "Authorization": f"Bearer {UPLIFTAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "voiceId": voice_id,
            "outputFormat": output_format
        }
        
        # Call UpliftAI TTS API
        response = requests.post(url, json=payload, headers=headers)
        
        # if response.status_code != 200:
        #     raise HTTPException(
        #         status_code=response.status_code,
        #         detail=f"UpliftAI TTS failed: {response.text}"
        #     )
        
        # # Get audio data
        # result = response.json()
        
        # # Audio is typically base64 encoded or URL
        # if "audioContent" in result:
        #     # Base64 encoded audio
        #     audio_data = base64.b64decode(result["audioContent"])
        # elif "url" in result:
        #     # Download from URL
        #     audio_response = requests.get(result["url"])
        #     audio_data = audio_response.content
        # else:
        #     raise HTTPException(
        #         status_code=500,
        #         detail="Unexpected response format from UpliftAI"
        #     )
        content_type = response.headers.get("Content-Type", "")

        if "application/json" in content_type:
            result = response.json()

            if "audioContent" in result:
                # Base64 encoded audio
                audio_data = base64.b64decode(result["audioContent"])
            elif "url" in result:
                # Download from URL
                audio_response = requests.get(result["url"])
                audio_data = audio_response.content
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Unexpected JSON response format from UpliftAI"
                )

        elif "audio" in content_type:
            # Raw audio returned directly
            audio_data = response.content

        else:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected response from UpliftAI: {response.text}"
            )
        
        # Save file mode (for testing)
        if save_file:
            filename = f"tts_output_{os.urandom(4).hex()}.mp3"
            filepath = Path("audio_outputs") / filename
            filepath.parent.mkdir(exist_ok=True)
            
            with open(filepath, "wb") as f:
                f.write(audio_data)
            
            return {
                "message": "Audio saved successfully",
                "filepath": str(filepath),
                "filename": filename,
                "size_bytes": len(audio_data)
            }
        
        # Streaming mode (for production)
        else:
            return StreamingResponse(
                iter([audio_data]),
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": "attachment; filename=speech.mp3"
                }
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Text-to-speech failed: {str(e)}"
        )


# ========== LLM SESSION ENDPOINTS ==========
try:
    from llm import UrduMedicalHistorySystem
    from llm import medical_system as _unused  # if llm creates app instance, ignore
except Exception:
    # Import lazily if running as script
    from importlib import import_module
    llm_mod = import_module('llm')
    UrduMedicalHistorySystem = getattr(llm_mod, 'UrduMedicalHistorySystem')

# Single shared LLM system instance
llm_system = UrduMedicalHistorySystem()
llm_sessions = {}


@app.post('/api/start-interview')
async def api_start_interview():
    try:
        result = llm_system.start_interview()
        import uuid
        session_id = str(uuid.uuid4())
        llm_sessions[session_id] = result['state']

        # Extract clean message
        ai_message = result['ai_message']
        if hasattr(ai_message, "choices"):
            ai_message = ai_message.choices[0].message.content

        return {'session_id': session_id, 'message': ai_message}
    except Exception as e:
        return {'error': 'start-interview failed', 'details': str(e)}


from pydantic import BaseModel

class SendMessageRequest(BaseModel):
    session_id: str
    message: str

@app.post('/api/send-message')
async def api_send_message(req: SendMessageRequest):
    try:
        if req.session_id not in llm_sessions:
            return {'error': 'session not found'}

        state = llm_sessions[req.session_id]
        result = llm_system.process_user_message(state, req.message)
        llm_sessions[req.session_id] = result['state']

        return {
            'message': result['ai_message'],
            'collected_data': result['collected_data'],
            'is_complete': result['is_complete']
        }
    except Exception as e:
        return {'error': 'send-message failed', 'details': str(e)}



@app.get('/api/get-history')
async def api_get_history(session_id: str, view: str = 'patient'):
    """Return formatted history for a session. view='patient'|'doctor'"""
    if session_id not in llm_sessions:
        return { 'error': 'session not found' }

    state = llm_sessions[session_id]

    try:
        history = llm_system.get_history_view(state, view=view)
    except Exception as e:
        return { 'error': 'failed to build history', 'details': str(e) }

    return { 'session_id': session_id, 'view': view, 'history': history }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
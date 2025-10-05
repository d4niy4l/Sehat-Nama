Urdu STT + LLM + TTS Integration

This folder contains a small FastAPI service and utilities to perform: STT (Groq Whisper) -> LLM (Anthropic/Claude via langchain) -> TTS (UpliftAI).

Quick overview

- /transcribe (POST): upload audio -> returns transcription JSON
- /text-to-speech (POST): text, voice_id -> returns audio stream
- /api/start-interview (POST): starts a new LLM session -> returns session_id and first AI message
- /api/send-message (POST): session_id, message -> returns AI reply and collected_data
- /api/get-history (GET): session_id, view (patient|doctor) -> returns formatted history. Doctor view translates to English.

Frontend wiring (Next.js client snippets)

1) Record audio (browser) and send to /transcribe

```js
// recordAudioAndSend() - high level
const form = new FormData();
form.append('file', recordedBlob, 'speech.webm');
form.append('model', 'whisper-large-v3');
const res = await fetch('/api/proxy/transcribe', { method: 'POST', body: form });
const json = await res.json();
const text = json.text;
```

Note: Consider adding a server-side proxy route in Next.js (/api/proxy/transcribe) to forward the file to the Python service if you can't call it directly.

2) Start LLM session

```js
const res = await fetch(`${LLM_BASE}/api/start-interview`, { method: 'POST' });
const { session_id, message } = await res.json();
// Play message via TTS or show on UI
```

3) Send message (after STT)

```js
const payload = new URLSearchParams();
payload.append('session_id', sessionId);
payload.append('message', transcriptText);
const r = await fetch(`${LLM_BASE}/api/send-message`, { method: 'POST', body: payload });
const data = await r.json();
const aiReply = data.message;
// Play via TTS
```

4) Play TTS

```js
const ttsForm = new URLSearchParams();
ttsForm.append('text', aiReply);
ttsForm.append('voice_id', 'v_meklc281');
const ttsResp = await fetch(`${TTS_BASE}/text-to-speech`, { method: 'POST', body: ttsForm });
const audioBlob = await ttsResp.blob();
const url = URL.createObjectURL(audioBlob);
const audio = new Audio(url);
audio.play();
```

5) History views

- Patient UI: call `/api/get-history?session_id=...&view=patient`
- Doctor UI: call `/api/get-history?session_id=...&view=doctor` (doctor will get English translations)

Security & Notes

- Use CORS and auth to restrict access. Sessions are stored in memory in this example; persist to a DB for production.
- Keep API keys (GROQ_API_KEY, UPLIFTAI_API_KEY, etc.) in env and never expose them to the browser.
- Concurrency: memory sessions won't survive restarts or multiple workers; use Redis or your DB.

Files added

- `test_pipeline_llm.py`: simple end-to-end test runner
- `README_INTEGRATION.md`: this file

Running locally

1) Install dependencies (create a virtualenv)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # ensure fastapi, groq, requests, langchain deps
```

2) Start the API

```bash
python main.py
```

3) Run the test runner

```bash
python test_pipeline_llm.py
```


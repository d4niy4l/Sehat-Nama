"""
COMPLETE MEDICAL HISTORY SYSTEM - INTEGRATION GUIDE
Shows how LangGraph structure + Urdu configuration work together
"""

from typing import TypedDict, List, Annotated
from langgraph.graph import StateGraph, END
import os
try:
    from groq import Groq
except Exception:
    Groq = None
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from pydantic import BaseModel, Field
import json

# ========== FILE 1: STATE & STRUCTURE (LangGraph) ==========
# This defines HOW the conversation flows

class HistoryState(TypedDict):
    """The state that flows through the graph"""
    messages: List[dict]
    current_section: str
    collected_data: dict
    section_complete: bool
    all_sections_done: bool
    language_preference: str  # Added for language handling


# ========== FILE 2: LANGUAGE & PROMPTS (Urdu Config) ==========
# This defines WHAT the agent says and HOW it communicates

class UrduPromptBuilder:
    """Builds Urdu prompts for each section"""
    
    URDU_BASE_PROMPT = """You are a medical history-taking assistant conducting interviews in URDU (اردو).

CRITICAL LANGUAGE RULES:
1. **Always respond in Urdu script (اردو رسم الخط)** unless patient uses Roman Urdu
2. **Use simple, conversational Urdu** - avoid complex vocabulary
3. **Mix common English medical terms** naturally (blood pressure, diabetes, X-ray)
4. **Use respectful آپ (aap) form**
5. **Accept mixed language** - mirror patient's style

CURRENT SECTION: {current_section}
COLLECTED DATA SO FAR: {collected_data}

{section_specific_prompt}

Continue the interview naturally in Urdu."""

    SECTION_PROMPTS = {
        "demographics": """
اب میں آپ سے کچھ بنیادی معلومات لوں گا۔
Ask: نام، عمر، جنس، پیشہ
""",
        "complaint": """
آپ کو کیا تکلیف ہے؟ کب سے؟
""",
        "hpc_pain": """
Use SOCRATES in Urdu:
- کہاں درد ہے؟ (Site)
- کب شروع ہوا؟ (Onset)
- کیسا درد ہے؟ (Character)
- کہیں اور جاتا ہے؟ (Radiation)
...
""",
        "systems": """
Relevant system review in Urdu based on complaint
""",
        "pmh": """
پرانی بیماریاں: Sugar? Pressure? دل کی بیماری؟
""",
        "drugs": """
کوئی دوائیں؟ Allergies?
""",
        "social": """
سگریٹ؟ رہائش? مدد کی ضرورت؟
"""
    }
    
    @staticmethod
    def build_prompt(section: str, collected_data: dict) -> str:
        """Build section-specific Urdu prompt"""
        section_prompt = UrduPromptBuilder.SECTION_PROMPTS.get(section, "")
        
        return UrduPromptBuilder.URDU_BASE_PROMPT.format(
            current_section=section,
            collected_data=json.dumps(collected_data, ensure_ascii=False, indent=2),
            section_specific_prompt=section_prompt
        )
    
    @staticmethod
    def detect_language(text: str) -> str:
        """Detect patient's language preference"""
        # Urdu script check
        if any('\u0600' <= c <= '\u06FF' for c in text):
            return 'urdu_script'
        
        # Roman Urdu check
        roman_urdu_words = ['hai', 'mein', 'ka', 'dard', 'bukhar']
        if any(word in text.lower() for word in roman_urdu_words):
            return 'roman_urdu'
        
        return 'english'


# ========== TOOLS: Structure the data ==========

class RecordInfo(BaseModel):
    """Generic tool to record information"""
    section: str = Field(description="demographics/complaint/hpc/systems/pmh/drugs/social")
    field: str = Field(description="Specific field name")
    value: str = Field(description="The value to record")

class MarkSectionComplete(BaseModel):
    """Mark section as complete"""
    section: str
    reasoning: str


# ========== INTEGRATION: Bringing it all together ==========

class UrduMedicalHistorySystem:
    """
    THIS IS THE MAIN CLASS THAT COMBINES EVERYTHING
    - Uses LangGraph for flow control (File 1)
    - Uses Urdu prompts for communication (File 2)
    """
    
    def __init__(self):
        # Initialize LLM using Groq wrapper (gpt-oss-1220b)
        # This wrapper expects GROQ_API_KEY to be present in the environment and the
        # `groq` package to be installed. If not available, it raises a clear error when invoked.
        class GroqLLM:
            def __init__(self, model: str = "openai/gpt-oss-120b", temperature: float = 0.3, streaming: bool = True):
                self.model = model
                self.temperature = temperature
                self.streaming = streaming
                self.tools = []

                api_key = os.getenv('GROQ_API_KEY')
                if Groq is None or not api_key:
                    # Defer raising until actually used, but keep a flag
                    self._client = None
                else:
                    self._client = Groq(api_key=api_key)

            def bind_tools(self, tools_list):
                self.tools = tools_list
                return self

            def _build_prompt(self, messages):
                # Concatenate System / Human / AI messages into a single prompt
                prompt_parts = []
                for m in messages:
                    cls = m.__class__.__name__
                    if cls == 'SystemMessage':
                        prompt_parts.append(m.content)
                    elif cls == 'HumanMessage':
                        prompt_parts.append(f"User: {m.content}")
                    elif cls == 'AIMessage':
                        prompt_parts.append(f"Assistant: {m.content}")
                    else:
                        prompt_parts.append(m.content)
                return '\n'.join(prompt_parts)

            def invoke(self, messages):
                prompt = self._build_prompt(messages)

                if not self._client:
                    # Graceful mock fallback for local/dev when GROQ is not configured.
                    # Return a short Urdu demo reply so the app remains usable for UI testing.
                    mock_reply = (
                        "یہ ایک مقامی ڈیمو جواب ہے۔ براہِ کرم حقیقی ماڈل کے لئے GROQ_API_KEY سیٹ کریں۔\n"
                        "آپ کے مسئلے کے بارے میں مزید بتائیں۔"
                    )

                    class _RespMock:
                        def __init__(self, content):
                            self.content = content
                            self.tool_calls = []

                    return _RespMock(mock_reply)

                # Try common Groq client interfaces (best-effort compatibility)
                # 1) Chat completions interface
                if hasattr(self._client, 'chat') and hasattr(self._client.chat, 'completions'):
                    resp = self._client.chat.completions.create(model=self.model, messages=[{"role": "user", "content": prompt}], temperature=self.temperature)
                    content = getattr(resp, 'content', getattr(resp, 'text', str(resp)))
                # 2) text.generate interface
                elif hasattr(self._client, 'text') and hasattr(self._client.text, 'generate'):
                    resp = self._client.text.generate(model=self.model, input=prompt, temperature=self.temperature)
                    content = getattr(resp, 'text', str(resp))
                # 3) generic generate
                elif hasattr(self._client, 'generate'):
                    resp = self._client.generate(model=self.model, input=prompt, temperature=self.temperature)
                    content = getattr(resp, 'text', str(resp))
                else:
                    raise RuntimeError('Groq client does not expose a known text generation interface in this environment')

                # Simple response object compatible with existing code
                class _Resp:
                    def __init__(self, content):
                        self.content = content
                        self.tool_calls = []

                return _Resp(content)

        # Create and bind tools
        self.llm = GroqLLM(model="openai/gpt-oss-120b", temperature=0.3, streaming=True)
        tools = [RecordInfo, MarkSectionComplete]
        self.llm_with_tools = self.llm.bind_tools(tools)
        
        # Initialize prompt builder
        self.prompt_builder = UrduPromptBuilder()
        
        # Section order
        self.sections_order = [
            'demographics',
            'complaint', 
            'hpc_pain',
            'systems',
            'pmh',
            'drugs',
            'social'
        ]
        
        # Build the graph
        self.graph = self._build_graph()
    
    
    # ========== GRAPH NODES ==========
    # These are from File 1 (LangGraph structure)
    
    def agent_node(self, state: HistoryState) -> HistoryState:
        """
        CORE NODE: Where LLM makes decisions
        This is where File 1 (structure) meets File 2 (language)
        """
        
        # BUILD URDU PROMPT (File 2)
        system_prompt = self.prompt_builder.build_prompt(
            section=state['current_section'],
            collected_data=state['collected_data']
        )
        
        # PREPARE MESSAGES
        messages = [SystemMessage(content=system_prompt)]
        
        # Add conversation history
        for msg in state['messages']:
            if msg['role'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            else:
                messages.append(AIMessage(content=msg['content']))
        
        # CALL LLM (with Urdu instructions)
        response = self.llm_with_tools.invoke(messages)
        
        # UPDATE STATE
        state['messages'].append({
            'role': 'assistant',
            'content': response.content,
            'tool_calls': getattr(response, 'tool_calls', [])
        })
        
        return state
    
    
    def tool_node(self, state: HistoryState) -> HistoryState:
        """
        Execute tools that LLM called
        This structures the data from Urdu conversation
        """
        last_message = state['messages'][-1]
        tool_calls = last_message.get('tool_calls', [])
        
        for tool_call in tool_calls:
            tool_name = tool_call['name']
            tool_input = tool_call['args']
            
            if tool_name == 'RecordInfo':
                # Store structured data
                section = tool_input['section']
                field = tool_input['field']
                value = tool_input['value']
                
                if section not in state['collected_data']:
                    state['collected_data'][section] = {}
                
                state['collected_data'][section][field] = value
            
            elif tool_name == 'MarkSectionComplete':
                state['section_complete'] = True
        
        return state
    
    
    def next_section_node(self, state: HistoryState) -> HistoryState:
        """Move to next section"""
        current_idx = self.sections_order.index(state['current_section'])
        
        if current_idx < len(self.sections_order) - 1:
            state['current_section'] = self.sections_order[current_idx + 1]
            state['section_complete'] = False
        else:
            state['all_sections_done'] = True
        
        return state
    
    
    def router(self, state: HistoryState) -> str:
        """Decide what to do next"""
        last_msg = state['messages'][-1]
        
        # If LLM called tools, execute them
        if last_msg.get('tool_calls'):
            return "tools"
        
        # If section complete, move to next
        if state['section_complete']:
            return "next_section"
        
        # If all done, end
        if state['all_sections_done']:
            return "end"
        
        # Otherwise, wait for user response
        return "continue"
    
    
    # ========== BUILD GRAPH ==========
    
    def _build_graph(self):
        """Build the LangGraph workflow"""
        workflow = StateGraph(HistoryState)
        
        # Add nodes
        workflow.add_node("agent", self.agent_node)
        workflow.add_node("tools", self.tool_node)
        workflow.add_node("next_section", self.next_section_node)
        
        # Entry point
        workflow.set_entry_point("agent")
        
        # Routing
        workflow.add_conditional_edges(
            "agent",
            self.router,
            {
                "tools": "tools",
                "next_section": "next_section",
                "continue": END,
                "end": END
            }
        )
        
        workflow.add_edge("tools", "agent")
        workflow.add_edge("next_section", "agent")
        
        return workflow.compile()
    
    
    # ========== PUBLIC API ==========
    
    def start_interview(self) -> dict:
        """Initialize a new interview"""
        state = {
            "messages": [],
            "current_section": "demographics",
            "collected_data": {},
            "section_complete": False,
            "all_sections_done": False,
            "language_preference": "urdu_script"
        }
        
        # Get first question
        result = self.graph.invoke(state)
        
        return {
            "ai_message": result['messages'][-1]['content'],
            "state": result
        }
    
    
    def process_user_message(self, state: dict, user_message: str) -> dict:
        """
        Process a user message
        THIS IS YOUR MAIN INTERFACE
        """
        
        # Detect language on first message
        if len(state['messages']) == 1:
            lang_pref = self.prompt_builder.detect_language(user_message)
            state['language_preference'] = lang_pref
        
        # Add user message to state
        state['messages'].append({
            'role': 'user',
            'content': user_message
        })
        
        # Run through graph
        result = self.graph.invoke(state)
        
        return {
            "ai_message": result['messages'][-1]['content'],
            "state": result,
            "collected_data": result['collected_data'],
            "is_complete": result['all_sections_done']
        }
    
    
    async def process_user_message_streaming(self, state: dict, user_message: str):
        """
        Streaming version for better UX
        Yields tokens as they arrive
        """
        state['messages'].append({
            'role': 'user',
            'content': user_message
        })
        
        # Stream the response
        async for chunk in self.graph.astream(state):
            if 'agent' in chunk:
                yield chunk['agent']

    # ========== TRANSLATION / VIEW HELPERS ==========
    def translate_to_english(self, text: str) -> str:
        """Translate a piece of text to English using the LLM.

        This is used to present a doctor-facing view where all content
        must be in English. The translator preserves medical terms.
        """
        # Build a small translation system prompt
        system_prompt = (
            "You are a helpful translator. Translate the user's text to English. "
            "Preserve medical and clinical terms (do not paraphrase) and keep the meaning exact. "
            "Output only the translated text."
        )

        messages = [SystemMessage(content=system_prompt), HumanMessage(content=text)]

        # Use the same llm binding (tools are available but not required)
        response = self.llm_with_tools.invoke(messages)

        return getattr(response, 'content', str(response))

    def get_history_view(self, state: dict, view: str = 'patient') -> List[dict]:
        """Return the conversation history formatted for a specific view.

        - view='patient' returns messages in the patient's preferred language
        - view='doctor' returns messages translated to English (doctor always sees English)

        Note: translation is performed only when necessary (non-English characters detected).
        """
        formatted: List[dict] = []

        for msg in state.get('messages', []):
            content = msg.get('content', '')

            if view == 'doctor':
                # If the message contains Arabic/Urdu script, translate it
                if any('\u0600' <= c <= '\u06FF' for c in content):
                    try:
                        content_en = self.translate_to_english(content)
                        content = content_en
                    except Exception:
                        # Fallback to original if translation fails
                        pass

            # For patient view we assume the messages are already in the preferred language
            formatted.append({'role': msg.get('role', ''), 'content': content})

        return formatted


# ========== USAGE EXAMPLE: How you'd actually use this ==========

def main():
    """
    THIS IS HOW YOU USE THE COMPLETE SYSTEM
    """
    
    # Initialize the system
    system = UrduMedicalHistorySystem()
    
    print("="*60)
    print("URDU MEDICAL HISTORY TAKING SYSTEM")
    print("="*60)
    
    # Start interview
    result = system.start_interview()
    print(f"\nAI: {result['ai_message']}\n")
    
    state = result['state']
    
    # Conversation loop
    while not state['all_sections_done']:
        # Get user input
        user_input = input("Patient: ")
        print()
        
        if user_input.lower() in ['quit', 'exit']:
            break
        
        # Process message
        result = system.process_user_message(state, user_input)
        
        # Update state
        state = result['state']
        
        # Show AI response
        print(f"AI: {result['ai_message']}\n")
        
        # Show collected data (for debugging)
        if result['collected_data']:
            print("--- Collected Data ---")
            print(json.dumps(result['collected_data'], ensure_ascii=False, indent=2))
            print("----------------------\n")
    
    # Final summary
    print("\n" + "="*60)
    print("INTERVIEW COMPLETE")
    print("="*60)
    print("\nFinal Collected Data:")
    print(json.dumps(state['collected_data'], ensure_ascii=False, indent=2))


# ========== FASTAPI INTEGRATION (For Production) ==========

from fastapi import FastAPI, WebSocket
from fastapi.responses import JSONResponse

app = FastAPI()

# Global system instance
medical_system = UrduMedicalHistorySystem()

# Store active sessions
sessions = {}


@app.post("/api/start-interview")
async def start_interview():
    """Start a new interview"""
    result = medical_system.start_interview()
    
    # Generate session ID
    import uuid
    session_id = str(uuid.uuid4())
    
    # Store session
    sessions[session_id] = result['state']
    
    return {
        "session_id": session_id,
        "message": result['ai_message']
    }


@app.post("/api/send-message")
async def send_message(session_id: str, message: str):
    """Send a user message"""
    
    if session_id not in sessions:
        return JSONResponse(
            status_code=404,
            content={"error": "Session not found"}
        )
    
    # Get state
    state = sessions[session_id]
    
    # Process message
    result = medical_system.process_user_message(state, message)
    
    # Update session
    sessions[session_id] = result['state']
    
    return {
        "message": result['ai_message'],
        "collected_data": result['collected_data'],
        "is_complete": result['is_complete']
    }


@app.websocket("/ws/interview/{session_id}")
async def websocket_interview(websocket: WebSocket, session_id: str):
    """WebSocket for streaming responses"""
    await websocket.accept()
    
    # Initialize or get session
    if session_id not in sessions:
        result = medical_system.start_interview()
        sessions[session_id] = result['state']
        await websocket.send_json({
            "type": "message",
            "content": result['ai_message']
        })
    
    state = sessions[session_id]
    
    while True:
        # Receive user message
        data = await websocket.receive_json()
        user_message = data['message']
        
        # Stream response
        collected_text = ""
        async for chunk in medical_system.process_user_message_streaming(state, user_message):
            if 'content' in chunk:
                token = chunk['content']
                collected_text += token
                await websocket.send_json({
                    "type": "token",
                    "content": token
                })
        
        # Send completion
        await websocket.send_json({
            "type": "complete",
            "collected_data": state['collected_data'],
            "is_complete": state['all_sections_done']
        })
        
        # Update session
        sessions[session_id] = state


# ========== SUMMARY: How Files Work Together ==========

"""
FILE 1 (LangGraph Structure):
├─ Defines STATE (what data we track)
├─ Defines FLOW (how conversation moves)
├─ Defines NODES (what happens at each step)
└─ Defines ROUTING (where to go next)

FILE 2 (Urdu Configuration):
├─ Defines LANGUAGE rules (how to communicate)
├─ Defines PROMPTS (what to say in each section)
├─ Defines TERMS (medical vocabulary in Urdu)
└─ Defines CULTURAL context (Pakistani norms)

INTEGRATION (This File):
├─ Combines both files
├─ Agent node: Uses Urdu prompts + LangGraph flow
├─ Tool node: Structures Urdu responses into data
├─ Router: Controls flow based on conversation state
└─ API: Exposes to your frontend

FLOW:
User Message (Urdu) 
  → Agent Node (Uses Urdu prompt + LLM) 
  → LLM Response (Urdu) + Tool Calls
  → Tool Node (Structures data)
  → Router (Decides next step)
  → Next Section or Wait for User
"""


if __name__ == "__main__":
    main()
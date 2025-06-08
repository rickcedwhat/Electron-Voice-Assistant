# --- Imports ---
from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Depends
from fastapi.responses import HTMLResponse
import uvicorn
from google import genai
import os
from dotenv import load_dotenv
import io
import base64 # Added for image decoding
from PIL import Image
import json
import re
from pydantic import BaseModel
from typing import List, Optional # Added for list type hinting
from fastapi.middleware.cors import CORSMiddleware

# --- Load Environment and Prompt ---
load_dotenv()

PROMPT_FILE = "prompt.txt"
PROMPT_TEMPLATE = ""

try:
    with open(PROMPT_FILE, "r", encoding="utf-8") as f:
        PROMPT_TEMPLATE = f.read()
    if not PROMPT_TEMPLATE:
        print(f"Warning: Prompt file '{PROMPT_FILE}' is empty.")
    else:
        print(f"Successfully loaded prompt from {PROMPT_FILE}")
except FileNotFoundError:
    raise RuntimeError(f"Error: Prompt file '{PROMPT_FILE}' not found.")
except Exception as e:
    raise RuntimeError(f"Error reading prompt file '{PROMPT_FILE}': {e}")

# --- Initialize FastAPI App and CORS ---
app = FastAPI()

origins = [
    "https://learning.mheducation.com",
    "https://*.wwnorton.com", # Allow all wwnorton subdomains
    "http://localhost",
    "http://127.0.0.1",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configure API Keys and Gemini Client ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
APP_ACCESS_TOKEN = os.getenv("APP_ACCESS_TOKEN")

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set.")
if not APP_ACCESS_TOKEN:
    raise ValueError("APP_ACCESS_TOKEN environment variable not set.")

try:
    client = genai.Client(api_key=GOOGLE_API_KEY)
    print("Gemini client initialized successfully.")
except Exception as e:
    raise RuntimeError(f"Failed to initialize Gemini client: {e}")

# --- Authentication Dependency ---
async def verify_token(x_auth_token: str = Header(None, alias="X-AUTH-TOKEN")):
    if not x_auth_token or x_auth_token != APP_ACCESS_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid or missing X-AUTH-TOKEN.")
    return True

# --- Pydantic Models for Requests ---
class AskGeminiVisionRequest(BaseModel):
    prompt: str
    images: Optional[List[str]] = []
    # New optional parameter to choose model complexity
    model_preference: Optional[str] = "simple" 

class GenerateHtmlRequest(BaseModel):
    image_base64: str

# --- API Endpoints ---

@app.post("/ask-gemini/", dependencies=[Depends(verify_token)])
async def ask_gemini_vision(request: AskGeminiVisionRequest):
    """
    Receives a prompt and an optional list of Base64 encoded images,
    sends them to the Gemini Vision model, and returns the text response.
    """
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    
    # --- Construct the multi-modal content ---
    content_parts = [request.prompt]
    
    if request.images:
        for base64_string in request.images:
            try:
                if ',' in base64_string:
                    header, encoded = base64_string.split(',', 1)
                else:
                    encoded = base64_string
                
                image_data = base64.b64decode(encoded)
                image = Image.open(io.BytesIO(image_data))
                content_parts.append(image)
            except Exception as e:
                print(f"Error processing Base64 image: {e}")
                raise HTTPException(status_code=400, detail="Invalid Base64 image data.")

    try:
        # --- Model Selection Logic ---
        if request.model_preference == "complex":
            target_model = "gemini-2.5-pro-preview-06-05"
        else: # Default to the faster, simpler model
            target_model = "gemini-2.5-flash-preview-05-20"

        print(f"Sending multi-modal request to Gemini using model: {target_model}...")
        
        response = client.models.generate_content(
            model=target_model,
            contents=content_parts 
        )

        if response.candidates and response.candidates[0].finish_reason.name == "STOP":
            answer_text = "".join(part.text for part in response.candidates[0].content.parts if hasattr(part, 'text'))
            if answer_text:
                print(f"Gemini Answer: {answer_text[:150]}...")
                return {"answer": answer_text}
            else:
                raise HTTPException(status_code=500, detail="Gemini returned an empty text response.")
        else:
            reason = response.candidates[0].finish_reason.name if response.candidates else "N/A"
            detail_msg = f"Gemini request did not complete successfully. Reason: {reason}"
            print(detail_msg)
            raise HTTPException(status_code=500, detail=detail_msg)

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred with the Gemini API: {str(e)}")


@app.post("/generate-html-from-image/", response_class=HTMLResponse, dependencies=[Depends(verify_token)])
async def create_html_from_image(request: GenerateHtmlRequest):
    try:
        if ',' in request.image_base64:
            _, encoded = request.image_base64.split(',', 1)
        else:
            encoded = request.image_base64
        image_content = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(image_content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Base64 image data: {e}")

    prompt = PROMPT_TEMPLATE

    try:
        target_model = "gemini-2.5-pro-preview-06-05"
        print(f"Sending request to Gemini model: {target_model} for HTML generation.")
        
        response = client.models.generate_content(
            model=target_model,
            contents=[image, prompt],
            generation_config={"response_mime_type": "application/json"}
        )
        json_string = response.text
        
        if not json_string:
             raise HTTPException(status_code=500, detail="Gemini returned an empty response for HTML generation.")
        
        json_data = json.loads(json_string)
        # Assumes generate_html_from_json is defined elsewhere
        # from gemini_to_html import generate_html_from_json 
        # html_content = generate_html_from_json(json_data)
        html_content = "<html><body><h1>HTML Generation Placeholder</h1></body></html>" # Placeholder
        
        title = json_data.get("title", "generated_page")
        sanitized_title = re.sub(r'[\\/*?:"<>|]', "", title).strip() or "generated_page"
        headers = {'Content-Disposition': f'attachment; filename="{sanitized_title}.html"'}
        
        return HTMLResponse(content=html_content, headers=headers)
        
    except Exception as e:
        print(f"An error occurred during HTML generation: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during HTML generation: {str(e)}")


# --- Uvicorn runner ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

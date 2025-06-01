# --- Imports ---
from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Depends
from fastapi.responses import HTMLResponse
import uvicorn
from google import genai
import os
from dotenv import load_dotenv
import io
from PIL import Image
import json
import re
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware # Make sure this import is present


# Assuming your refactored function is here:
from gemini_to_html import generate_html_from_json

load_dotenv() # Load .env file for API key

# --- Read Prompt from File ---
PROMPT_FILE = "prompt.txt"
PROMPT_TEMPLATE = "" # Initialize empty prompt

try:
    # Assume prompt.txt is in the same directory as main.py
    # Use utf-8 encoding for compatibility
    with open(PROMPT_FILE, "r", encoding="utf-8") as f:
        PROMPT_TEMPLATE = f.read()
    if not PROMPT_TEMPLATE:
         # Prompt file is empty, might be an issue
         print(f"Warning: Prompt file '{PROMPT_FILE}' was found but is empty.")
         # Depending on requirements, you might want to raise an error here instead
    else:
        print(f"Successfully loaded prompt from {PROMPT_FILE}")
except FileNotFoundError:
    # If the prompt file is essential, stop the application at startup
    raise RuntimeError(f"Error: Prompt file '{PROMPT_FILE}' not found. Cannot start application.")
except Exception as e:
    # Catch other potential file reading errors
    raise RuntimeError(f"Error reading prompt file '{PROMPT_FILE}': {e}")
# --- END Read Prompt ---


app = FastAPI()

origins = [
    "https://learning.mheducation.com", # Allow your specific homework site
    "http://localhost", # Often useful for local testing if you have a frontend there
    "http://127.0.0.1", # Also for local testing
    # You can add other origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # More specific than ["*"] for production
    # allow_origins=["*"], # Allows all origins - USE FOR DEVELOPMENT/TESTING ONLY
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)

# --- Configure Gemini API Key ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set.")
APP_ACCESS_TOKEN = os.getenv("APP_ACCESS_TOKEN")
if not APP_ACCESS_TOKEN:
    raise ValueError("APP_ACCESS_TOKEN environment variable not set.")

# --- Initialize Gemini Client ---
try:
    client = genai.Client(api_key=GOOGLE_API_KEY)
    print("Gemini client initialized successfully.")
except Exception as e:
    raise RuntimeError(f"Failed to initialize Gemini client: {e}") # type: ignore

# --- Authentication Dependency ---
async def verify_token(x_auth_token: str = Header(None, alias="X-AUTH-TOKEN")):
    if not x_auth_token:
        raise HTTPException(status_code=401, detail="Not authenticated: X-AUTH-TOKEN header missing.")
    if x_auth_token != APP_ACCESS_TOKEN:
        print(f"Invalid token received. Expected: '{APP_ACCESS_TOKEN[:5]}...', Got: '{x_auth_token[:5]}...'") # Log part of tokens for debugging
        raise HTTPException(status_code=403, detail="Invalid X-AUTH-TOKEN.")
    return True


# --- API Endpoint ---
@app.post("/generate-html-from-image/", response_class=HTMLResponse, dependencies=[Depends(verify_token)])
async def create_html_from_image(image_file: UploadFile = File(...)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini client not initialized.")
    if not PROMPT_TEMPLATE: # Check if prompt failed to load or was empty
         raise HTTPException(status_code=500, detail="Server prompt template is not loaded or empty.")

    # --- Read and prepare image using PIL ---
    image_content = await image_file.read()
    mime_type = image_file.content_type
    if not mime_type or not mime_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
    try:
        image = Image.open(io.BytesIO(image_content))
    except Exception as e:
        print(f"Error opening image with PIL: {e}")
        raise HTTPException(status_code=400, detail="Could not process uploaded image file.")
    # --- End image prep ---

    # *** Use the prompt loaded from the file ***
    prompt = PROMPT_TEMPLATE

    # --- Call Gemini API ---
    try:
        # *** Use the requested experimental model name ***
        target_model = "gemini-2.5-pro-preview-03-25"
        print(f"Sending request to Gemini model: {target_model}")

        response = client.models.generate_content(
            model=target_model,
            contents=[image, prompt], # Pass PIL image and loaded prompt string
            # *** REMOVED 'stream=False' argument ***
         )

        # --- CORRECTED Handle Response ---
        json_string = None
        finish_reason_str = "UNKNOWN"
        safety_ratings_str = "N/A"

        # 1. Check for candidates and finish reason first (often indicates blocking)
        try:
            if hasattr(response, 'candidates') and response.candidates:
                first_candidate = response.candidates[0]
                if hasattr(first_candidate, 'finish_reason'):
                    finish_reason_str = str(first_candidate.finish_reason) # Get reason as string

                # Check for blocking reasons specifically
                # Common blocking reasons: SAFETY, RECITATION, OTHER
                # Adjust this list based on potential reasons you want to treat as errors
                blocking_reasons = ['SAFETY', 'RECITATION', 'OTHER']
                if finish_reason_str in blocking_reasons:
                    if hasattr(first_candidate, 'safety_ratings'):
                        safety_ratings_str = str(first_candidate.safety_ratings)
                    detail_msg = f"Gemini API request blocked or failed. Finish Reason: {finish_reason_str}. Safety Ratings: {safety_ratings_str}"
                    print(detail_msg) # Log the specific reason
                    raise HTTPException(status_code=500, detail=detail_msg) # Raise HTTP error

            # If not blocked, proceed to get text
            if hasattr(response, 'text'):
                 json_string = response.text
                 print("--- Gemini Raw Response ---")
                 print(json_string)
                 print("--------------------------")
            else:
                 # Response exists but has no .text, which is unexpected if not blocked
                 print("Error: Response object lacks .text attribute. Finish Reason:", finish_reason_str)
                 raise HTTPException(status_code=500, detail=f"Invalid response structure (no text). Finish Reason: {finish_reason_str}")

            # Final check: If not blocked but text is still empty/None
            if not json_string and finish_reason_str not in blocking_reasons:
                 print(f"Warning: Gemini API returned empty text content. Finish Reason: {finish_reason_str}")
                 # Decide if this is an error for your use case
                 raise HTTPException(status_code=500, detail=f"Gemini API returned empty content. Finish Reason: {finish_reason_str}")

        except AttributeError as e:
            # Catch errors if response structure is not as expected (e.g., no .candidates)
            print(f"Error accessing response attributes: {e}. Response: {response}")
            raise HTTPException(status_code=500, detail="Invalid response structure from Gemini API.")
        except Exception as e:
            # Catch other potential errors processing response structure
            print(f"Error processing Gemini response structure: {e}. Response: {response}")
            raise HTTPException(status_code=500, detail="Error processing Gemini response content.")
        # --- End CORRECTED Handle Response ---

    except Exception as e:
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error contacting Gemini API: {str(e)}")
    # --- End API Call ---
    except Exception as e:
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error contacting Gemini API: {str(e)}")
    # --- End API Call ---

    # --- Parse JSON Response (as before) ---
    try:
        if json_string.strip().startswith("```json"): json_string = json_string.strip()[7:-3].strip()
        elif json_string.strip().startswith("```"): json_string = json_string.strip()[3:-3].strip()
        json_data = json.loads(json_string)
    except json.JSONDecodeError as e:
        print(f"JSON Parsing Error: {e}. Received text: {json_string[:500]}...")
        raise HTTPException(status_code=500, detail="Failed to parse JSON response from Gemini API.")
    except Exception as e:
        print(f"Error processing Gemini response: {e}")
        raise HTTPException(status_code=500, detail="Error processing Gemini response.")
    # --- End JSON Parse ---

    # --- Generate HTML (as before) ---
    try:
        html_content = generate_html_from_json(json_data)
    except Exception as e:
        print(f"HTML Generation Error: {e}")
        raise HTTPException(status_code=500, detail="Error generating HTML content.")
    # --- End HTML Gen ---

    # --- ADDED: Prepare filename header ---
    try:
        # Get title from the parsed JSON data
        title = json_data.get("title", "generated_page")
        # Sanitize title to create a safe filename
        sanitized_title = re.sub(r'[\\/*?:"<>|]', "", title)
        # Ensure it's not empty after sanitization
        if not sanitized_title.strip():
             sanitized_title = "generated_page"
        download_filename = f"{sanitized_title}.html"
        # Create headers dictionary
        headers = {
            'Content-Disposition': f'attachment; filename="{download_filename}"'
        }
        print(f"Setting response headers for download: {headers}") # Log headers
    except Exception as e:
         print(f"Warning: Could not generate filename headers: {e}")
         headers = {} # Use empty headers if title processing fails
    # --- END ADDED ---

    # Return HTML Response with headers
    # *** MODIFIED RETURN STATEMENT ***
    return HTMLResponse(content=html_content, headers=headers)

class PromptRequest(BaseModel):
    prompt: str

# --- API Endpoint ---
@app.post("/ask-gemini/", dependencies=[Depends(verify_token)])
async def ask_gemini(request: PromptRequest):
    """
    Receives a prompt, sends it to the Gemini API,
    and returns the Gemini API's text response.
    """
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    
    if not client: # Ensure client is available
        raise HTTPException(status_code=500, detail="Gemini client not initialized.")

    try:
        print(f"Received prompt: {request.prompt[:100]}...") # Log received prompt (first 100 chars)

        # Send the prompt to Gemini
        # Use the client.models.generate_content pattern, consistent with the other endpoint
        # Using the same advanced model as the image endpoint, as it handles text-only well.
        # Alternatively, "gemini-1.0-pro" could be used for a standard text model.
        target_model = "gemini-2.5-flash-preview-05-20" # Consistent with the other endpoint
        response = client.models.generate_content(
            model=target_model,
            contents=request.prompt # For text-only, contents can be a string
        )

        # --- Process Gemini's Response ---
        # Ensure the response has text and handle potential blocking
        if response.candidates:
            first_candidate = response.candidates[0]
            if first_candidate.finish_reason.name == "STOP" and first_candidate.content and first_candidate.content.parts:
                answer_text = "".join(part.text for part in first_candidate.content.parts if hasattr(part, 'text'))
                if answer_text:
                    print(f"Gemini Answer: {answer_text[:100]}...") # Log Gemini answer
                    return {"answer": answer_text}
                else:
                    print("Gemini returned a response with no text content.")
                    raise HTTPException(status_code=500, detail="Gemini returned an empty text response.")
            else:
                # Handle cases where the response was blocked or stopped for other reasons
                blocking_reason = first_candidate.finish_reason.name
                safety_ratings_str = "N/A"
                if hasattr(first_candidate, 'safety_ratings'):
                    safety_ratings_str = str(first_candidate.safety_ratings)
                detail_msg = f"Gemini API request did not complete successfully. Finish Reason: {blocking_reason}. Safety Ratings: {safety_ratings_str}"
                print(detail_msg)
                raise HTTPException(status_code=500, detail=detail_msg)
        else:
            # This case should ideally be caught by the finish_reason check above,
            # but it's a fallback if the response structure is unexpected.
            # It might also indicate that the prompt itself was blocked by Gemini's prompt-level safety filters
            # before even generating candidates.
            prompt_feedback_str = "N/A"
            if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                 prompt_feedback_str = str(response.prompt_feedback)
            detail_msg = f"Gemini API returned no candidates. This might be due to prompt-level blocking. Prompt Feedback: {prompt_feedback_str}"
            print(detail_msg)
            raise HTTPException(status_code=500, detail=detail_msg)

    except genai.types.BlockedPromptException as e:
        print(f"Gemini API Error: Prompt was blocked. {e}")
        raise HTTPException(status_code=400, detail=f"Your prompt was blocked by the Gemini API. {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        # Log the full error for debugging on the server
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred while communicating with the Gemini API: {str(e)}")


# --- Uvicorn runner ---
if __name__ == "__main__":
    # Make sure 'main' matches the filename (e.g., main.py -> 'main:app')
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# run this with venv activated to start
# make sure venv is activated: cd into backend/homework solver and then call .\.venv\Scripts\activate
# uvicorn main:app --reload

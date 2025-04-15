# --- Imports ---
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse
import uvicorn
from google import genai
import os
from dotenv import load_dotenv
import io
from PIL import Image
import json
import re
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

# --- Configure Gemini API Key ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set.")

# --- Initialize Gemini Client ---
try:
    client = genai.Client(api_key=GOOGLE_API_KEY)
    print("Gemini client initialized successfully.")
except Exception as e:
    raise RuntimeError(f"Failed to initialize Gemini client: {e}")


# --- API Endpoint ---
@app.post("/generate-html-from-image/", response_class=HTMLResponse)
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

# --- Uvicorn runner ---
if __name__ == "__main__":
    # Make sure 'main' matches the filename (e.g., main.py -> 'main:app')
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# run this with venv activated to start
# uvicorn main:app --reload

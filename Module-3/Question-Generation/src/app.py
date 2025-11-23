import os
import time
import json
from typing import List, Dict, Any
from groq import Groq
from config import settings as config


def load_prompt_template() -> str:
    """
    Load the question generation prompt template from the prompts directory.
    
    Returns:
        str: The complete prompt template content
        
    Raises:
        FileNotFoundError: If the template file doesn't exist
    """
    file_path = os.path.join(config.PROMPT_DIR, config.QG_TEMPLATE_FILE)
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Prompt template not found at: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()


def chunk_text(text: str, chunk_size: int = 4000) -> List[str]:
    """
    Split a long text into smaller chunks for processing.
    
    Args:
        text: The input text to be chunked
        chunk_size: Maximum characters per chunk (default: 4000)
        
    Returns:
        List[str]: List of text chunks
    """
    chunks = []
    for i in range(0, len(text), chunk_size):
        chunks.append(text[i:i + chunk_size])
    return chunks


def build_prompt(template: str, text_chunk: str, expert_profile: Dict[str, str]) -> str:
    """
    Build the final prompt by replacing all placeholders with actual values.
    
    Args:
        template: The prompt template with placeholders
        text_chunk: The text chunk to generate questions from
        expert_profile: Dictionary containing expert role, skills, etc.
        
    Returns:
        str: Complete prompt ready for API call
    """
    prompt = template
    
    # Replace expert profile placeholders (e.g., {EXPERT_ROLE}, {REQUIRED_SKILLS})
    for key, value in expert_profile.items():
        prompt = prompt.replace(f"{{{key}}}", value)
    
    # Replace task-specific placeholders
    prompt = prompt.replace("{QUESTION_COUNT}", str(config.QUESTION_COUNT))
    prompt = prompt.replace("{TEXT_CHUNK}", text_chunk)
    
    return prompt


def call_groq_api(prompt: str) -> Dict[str, Any]:
    """
    Make an API call to Groq and return the response.
    
    Args:
        prompt: The complete prompt to send to the API
        
    Returns:
        Dict containing:
            - success: Boolean indicating if the call succeeded
            - content: The API response content (if successful)
            - latency: Time taken for the API call (if successful)
            - error: Error message (if failed)
    """
    # Initialize Groq client with API key
    client = Groq(api_key=config.GROQ_API_KEY)
    
    try:
        start_time = time.time()
        
        # Make the API request
        response = client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=config.DEFAULT_TEMPERATURE,
            max_tokens=config.MAX_TOKENS,
            response_format={"type": "json_object"}  # Request JSON format
        )
        
        # Calculate latency
        latency = time.time() - start_time
        print(f"    [SUCCESS] API call completed (latency: {latency:.2f}s)")
        
        return {
            "success": True,
            "content": response.choices[0].message.content,
            "latency": latency
        }
        
    except Exception as e:
        print(f"    [ERROR] API call failed: {e}")
        return {"success": False, "error": str(e)}


def extract_questions(api_response: Dict[str, Any]) -> List[str]:
    """
    Extract questions from the API response, handling multiple JSON formats.
    
    Supported formats:
        - Direct list: ["Q1", "Q2", ...]
        - Object with questions key: {"questions": ["Q1", "Q2", ...]}
        - Object with numbered keys: {"question_1": "Q1", "question_2": "Q2", ...}
    
    Args:
        api_response: The response dictionary from call_groq_api()
        
    Returns:
        List[str]: Extracted questions, empty list if parsing fails
    """
    # Check if API call was successful
    if not api_response.get("success"):
        return []
    
    content = api_response.get("content", "")
    
    try:
        # Parse the JSON response
        data = json.loads(content)
        
        # Initialize questions list
        questions = []
        
        # Handle format: ["Q1", "Q2", ...]
        if isinstance(data, list):
            questions = [q.strip() for q in data if isinstance(q, str)]
        
        # Handle format: {"questions": [...]} or {"question_1": "...", ...}
        elif isinstance(data, dict):
            if "questions" in data:
                # Extract from 'questions' key
                questions = [q.strip() for q in data["questions"] if isinstance(q, str)]
            else:
                # Extract all string values from dictionary
                questions = [v.strip() for k, v in data.items() if isinstance(v, str)]
        
        return questions
        
    except json.JSONDecodeError as e:
        # Log JSON parsing errors
        print(f"    [ERROR] JSON parsing failed: {e}")
        print(f"    [DEBUG] Raw content preview: {content[:200]}...")
        return []


def generate_questions_pipeline(document: str) -> List[str]:
    """
    Main pipeline: Generate questions from a document using Groq API.
    
    This function orchestrates the complete workflow:
    1. Loads the prompt template
    2. Splits document into chunks
    3. Processes each chunk through the API
    4. Extracts and deduplicates questions
    
    Args:
        document: The text document to generate questions from
        
    Returns:
        List[str]: Sorted list of unique questions generated from the document
    """
    print("\n" + "="*60)
    print("STARTING QUESTION GENERATION PIPELINE")
    print("="*60)
    
    # Step 1: Load prompt template from file
    print("\n[1/4] Loading prompt template...")
    template = load_prompt_template()
    print("    [OK] Template loaded successfully")
    
    # Step 2: Split document into processable chunks
    print("\n[2/4] Chunking document...")
    chunks = chunk_text(document)
    print(f"    [OK] Document split into {len(chunks)} chunk(s)")
    
    # Step 3: Process each chunk and collect questions
    print(f"\n[3/4] Processing chunks and generating questions...")
    all_questions = set()  # Using set to automatically handle duplicates
    
    for i, chunk in enumerate(chunks, 1):
        print(f"\n  Chunk {i}/{len(chunks)}:")
        
        # Build the complete prompt with all placeholders filled
        prompt = build_prompt(template, chunk, config.GLOBAL_EXPERT_PROFILE)
        
        # Send prompt to Groq API
        response = call_groq_api(prompt)
        
        # Extract questions from the API response
        questions = extract_questions(response)
        
        if questions:
            # Add questions to the set (duplicates automatically ignored)
            all_questions.update(questions)
            print(f"    [INFO] Extracted {len(questions)} question(s)")
        else:
            print(f"    [WARNING] No questions extracted from this chunk")
    
    # Step 4: Convert set to sorted list and return
    print(f"\n[4/4] Pipeline complete!")
    print(f"    [RESULT] Total unique questions generated: {len(all_questions)}")
    print("="*60 + "\n")
    
    return sorted(list(all_questions))
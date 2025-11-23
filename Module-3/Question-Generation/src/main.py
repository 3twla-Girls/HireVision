# Import the pipeline function from the application logic file
from src.app import generate_questions_pipeline 
SAMPLE_DOCUMENT = (
    "Google announced the Gemini 2.5 Pro model in October 2025, featuring advanced reasoning capabilities "
    "and a 2 million token context window, making it ideal for tasks requiring long document analysis. "
    "Groq relies on Language Processing Units (LPUs) to provide the fastest inference latency on the market, "
    "allowing large LLMs to run at incredible speed and low cost. The LPU architecture is designed specifically "
    "to maximize sequential processing for language models."
)

def main():
    """
    Main function containing the script's execution logic.
    This function loads the sample document and runs the pipeline.
    """
    
    print("--- Starting Groq-powered Question Generation Project ---")
    
    try:
        # Call the core function imported from app.py
        generated_questions = generate_questions_pipeline(document=SAMPLE_DOCUMENT)

        print("\n==================================")
        print("✅ Final Generated Questions:")
        for i, q in enumerate(generated_questions):
            print(f"{i+1}. {q}")
        print("==================================")

    except FileNotFoundError as e:
        print(f"\n❌ Error: Prompt files not found! Please check the structure.")
        print("Required file: 'prompts/qg_template.txt'")
    except Exception as e:
        print(f"\n❌ An unexpected error occurred: {e}")

# --- Script Entry Point ---
if __name__ == "__main__":
    main()
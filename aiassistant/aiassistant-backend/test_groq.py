import os
from llm import get_llm_response

print("GROQ key:", bool(os.getenv("GROQ_API_KEY")))
print(get_llm_response("Test connection to Groq."))

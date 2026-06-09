"""
SkillNova Cache Warm-up Utility.
Seeds the Redis/InMemory cache with 15-20 common queries.
"""
import requests
import time

BASE_URL = "http://localhost:8000/api/chat"

COMMON_QUERIES = [
    # Greetings & small talk (Cache 24h)
    "hi", "hello", "good morning", "how can you help me?",
    
    # Platform policies (Cache 12h)
    "What is the attendance policy?",
    "How do I submit my weekly report?",
    "What are the internship guidelines?",
    "How is my performance evaluated?",
    "What is the leave policy for interns?",
    
    # Process queries (Cache 12h)
    "How do I schedule a meeting with my mentor?",
    "What is the task validation process?",
    "How can I track my performance?",
    
    # General queries (Cache 24h)
    "What is SkillNova?",
    "Tell me about the platform features.",
    "Who are the mentors?",
    
    # Common questions about DSA (Cache 12h)
    "What DSA topics are covered?",
    "How to practice DSA on the platform?",
    "Are there any upcoming DSA contests?"
]

def warmup():
    print(f"--- Starting Cache Warm-up ({len(COMMON_QUERIES)} queries) ---")
    
    for i, q in enumerate(COMMON_QUERIES):
        print(f"[{i+1}/{len(COMMON_QUERIES)}] Waking up: '{q[:40]}...'")
        try:
            start = time.time()
            # We don't care about the response, just that it's processed and cached.
            # Using a fixed session_id to avoid polluting DB too much.
            requests.post(BASE_URL, json={
                "message": q,
                "session_id": "warmup_session_01",
                "role": "Intern"
            }, timeout=60)
            elapsed = time.time() - start
            print(f"    Done in {elapsed:.2f}s")
        except Exception as e:
            print(f"    Error: {e}")
        
        # Small delay to not spam the LLM provider too hard in burst
        time.sleep(0.5)

    print("\n--- Cache Warm-up Complete! ---")

if __name__ == "__main__":
    warmup()

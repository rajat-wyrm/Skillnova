"""
SkillNova Scaled Production Validator.
Simulates 10-15 concurrent users, 40-60 RPM for 3 minutes.
Distributes queries according to user's specification.
"""
import asyncio
import aiohttp
import time
import random
import logging
from collections import Counter

# Configuration
BASE_URL = "http://localhost:8000/api/chat"
CONCURRENT_USERS = 12  # (10-15 range)
TOTAL_DURATION = 180   # 3 minutes
TARGET_RPM = 50       # (40-60 range)

# Query Distribution Percentages
DISTRIBUTION = {
    "cached": 0.40,
    "general": 0.30,
    "rag": 0.20,
    "tool": 0.10
}

# Query Libraries
CACHED_QUERIES = [
    "What is the attendance policy?",
    "How do I submit my weekly report?",
    "What are the internship guidelines?",
    "How is my performance evaluated?",
    "What is the leave policy for interns?",
    "How do I schedule a meeting with my mentor?",
    "What is the task validation process?",
    "How can I track my performance?"
]

GENERAL_QUERIES = [
    "What is the capital of France?",
    "What is 2+2?",
    "Explain what a function is in programming.",
    "What is the largest ocean?",
    "Who wrote Romeo and Juliet?",
    "What is periodic table?",
    "What is the speed of light?",
    "How many continents are there?"
]

RAG_QUERIES = [
    "Tell me more about the platform features.",
    "Who are the mentors at SkillNova?",
    "What DSA topics should I study?",
    "Are there any upcoming contests?",
    "How do I use the learning portal?",
    "What happens if I miss a deadline?",
    "How can I contact support?",
    "Tell me about the internship certificate."
]

TOOL_QUERIES = [
    "What is the latest AI news today?",
    "Who won the match yesterday?",
    "What is the current stock price of Google?",
    "Weather in San Francisco today?",
    "Latest tech news about Groq."
]

# Metrics storage
latency_data = []
status_codes = Counter()
route_counts = Counter()

# Logger setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("validator")

async def send_request(session, query, category):
    global latency_data, status_codes, route_counts
    
    start_time = time.time()
    try:
        # Use random session_id for unique users
        sid = f"user_{random.randint(1, 1000)}"
        async with session.post(BASE_URL, json={
            "message": query,
            "session_id": sid,
            "role": "Intern"
        }, timeout=45) as response:
            latency = (time.time() - start_time) * 1000
            latency_data.append(latency)
            status_codes[response.status] += 1
            
            if response.status == 200:
                data = await response.json()
                # If we're lucky, the backend returns the route in the response?
                # (Assuming we matched main.py's format)
                # But even if it doesn't, we know our assigned category.
                route_counts[category] += 1
                
            return response.status
    except Exception as e:
        logger.error(f"Request failed: {e}")
        status_codes["Error"] += 1
        return "Error"

async def user_worker(worker_id):
    """Simulates a single user's behavior."""
    logger.info(f"User Worker {worker_id} started.")
    
    end_time = time.time() + TOTAL_DURATION
    
    while time.time() < end_time:
        # Pick category based on distribution
        r = random.random()
        if r < 0.40:
            category, query = "cached", random.choice(CACHED_QUERIES)
        elif r < 0.70:
            category, query = "general", random.choice(GENERAL_QUERIES)
        elif r < 0.90:
            category, query = "rag", random.choice(RAG_QUERIES)
        else:
            category, query = "tool", random.choice(TOOL_QUERIES)
            
        # Send request
        async with aiohttp.ClientSession() as session:
            await send_request(session, query, category)
            
        # Calculate delay for Target RPM (50 RPM across 12 users = ~4 sec per user)
        # Delay = (Users * 60) / RPM
        avg_delay = (CONCURRENT_USERS * 60) / TARGET_RPM
        # Wait with some jitter
        await asyncio.sleep(random.uniform(avg_delay * 0.5, avg_delay * 1.5))

async def main():
    logger.info(f"🚀 Starting Scaled Validation: {CONCURRENT_USERS} users, {TARGET_RPM} RPM target.")
    
    # Create worker tasks
    tasks = [user_worker(i) for i in range(CONCURRENT_USERS)]
    
    # Run loop
    await asyncio.gather(*tasks)
    
    # Final Summary
    logger.info("\n" + "="*50)
    logger.info("VALIDATION TEST COMPLETE")
    logger.info("="*50)
    
    total_reqs = sum(status_codes.values())
    success_rate = (status_codes.get(200, 0) / total_reqs) * 100 if total_reqs > 0 else 0
    
    logger.info(f"Total Requests: {total_reqs}")
    logger.info(f"Success Rate:   {success_rate:.1f}%")
    logger.info(f"Status Codes:   {dict(status_codes)}")
    logger.info(f"Route Dist:     {dict(route_counts)}")
    
    if latency_data:
        avg_lat = sum(latency_data) / len(latency_data)
        p95 = sorted(latency_data)[int(len(latency_data) * 0.95)]
        logger.info(f"Avg Latency:    {avg_lat:.0f}ms")
        logger.info(f"P95 Latency:    {p95:.0f}ms")
    
    logger.info("="*50)

if __name__ == "__main__":
    asyncio.run(main())

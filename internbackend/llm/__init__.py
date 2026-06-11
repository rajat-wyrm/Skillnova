import os
import time
import logging
import requests
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()
logger = logging.getLogger("skillnova.llm")

# -----------------------------------------------
# CIRCUIT BREAKER
# -----------------------------------------------
class CircuitBreaker:
    def __init__(self, failure_threshold=3, recovery_timeout=30):
        self.failure_count = 0
        self.last_failure_time = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = "closed"

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "open"

    def record_success(self):
        self.failure_count = 0
        self.state = "closed"

    def can_execute(self):
        if self.state == "closed":
            return True
        if self.state == "open":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "half_open"
                return True
            return False
        return True


gemini_cb = CircuitBreaker()
groq_cb = CircuitBreaker()
deepseek_cb = CircuitBreaker()


# -----------------------------------------------
# RATE LIMITER
# -----------------------------------------------
class RateLimiter:
    def __init__(self, min_interval=0.2):
        self.min_interval = min_interval
        self.last_call = 0

    def wait(self):
        now = time.time()
        if now - self.last_call < self.min_interval:
            time.sleep(self.min_interval - (now - self.last_call))
        self.last_call = time.time()


rate_limiter = RateLimiter()


# -----------------------------------------------
# GEMINI
# -----------------------------------------------
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


def _call_gemini(prompt):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not gemini_cb.can_execute():
        return None

    try:
        rate_limiter.wait()

        res = requests.post(
            f"{GEMINI_URL}?key={api_key}",
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=20,
        )

        if res.status_code != 200:
            gemini_cb.record_failure()
            return None

        data = res.json()
        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text")
        )

        if not text:
            return None

        gemini_cb.record_success()
        return text.strip()

    except Exception as e:
        logger.error(f"[GEMINI ERROR] {e}")
        gemini_cb.record_failure()
        return None


# -----------------------------------------------
# GROQ
# -----------------------------------------------
def _call_groq(prompt):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not groq_cb.can_execute():
        return None

    try:
        llm = ChatGroq(
            api_key=api_key,
            model="llama-3.1-8b-instant",
            temperature=0.3,
        )

        res = llm.invoke(prompt)

        if hasattr(res, "content"):
            groq_cb.record_success()
            return res.content.strip()

        return str(res)

    except Exception as e:
        logger.error(f"[GROQ ERROR] {e}")
        groq_cb.record_failure()
        return None


# -----------------------------------------------
# DEEPSEEK (OPENAI STYLE)
# -----------------------------------------------
def _call_deepseek(prompt):
    api_key = os.getenv("DEEPSEEK_API_KEY")
    base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

    if not api_key or not deepseek_cb.can_execute():
        return None

    try:
        rate_limiter.wait()

        res = requests.post(
            f"{base_url}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek-chat",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
            },
            timeout=25,
        )

        if res.status_code != 200:
            deepseek_cb.record_failure()
            return None

        data = res.json()

        text = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content")
        )

        if not text:
            return None

        deepseek_cb.record_success()
        return text.strip()

    except Exception as e:
        logger.error(f"[DEEPSEEK ERROR] {e}")
        deepseek_cb.record_failure()
        return None


# -----------------------------------------------
# FINAL ENTRY
# -----------------------------------------------
def get_llm_response(prompt: str) -> str:

    # 1️⃣ Gemini
    res = _call_gemini(prompt)
    if res:
        return res

    logger.warning("[LLM] Gemini failed → Groq")

    # 2️⃣ Groq
    res = _call_groq(prompt)
    if res:
        return res

    logger.warning("[LLM] Groq failed → DeepSeek")

    # 3️⃣ DeepSeek
    res = _call_deepseek(prompt)
    if res:
        return res

    logger.error("[LLM] All providers failed")

    return "AI service unavailable. Try again later."
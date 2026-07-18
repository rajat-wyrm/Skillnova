import os
import requests
import logging
import time

logger = logging.getLogger("skillnova.llm")


GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


# -----------------------------------------------
# SAFE JSON PARSER
# -----------------------------------------------
def _safe_extract(data: dict) -> str:
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return ""


# -----------------------------------------------
# MAIN LLM CALL (PRODUCTION UPGRADED)
# -----------------------------------------------
def get_llm_response(prompt: str, temperature: float = 0.3) -> str:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        logger.error("GEMINI_API_KEY missing")
        return ""

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "topK": 40,
            "topP": 0.9,
            "maxOutputTokens": 512,
        }
    }

    retries = 2

    for attempt in range(retries + 1):
        try:
            start = time.time()

            response = requests.post(
                f"{GEMINI_URL}?key={api_key}",
                json=payload,
                timeout=30,
            )

            latency = int((time.time() - start) * 1000)
            logger.info(f"[GEMINI] {latency}ms | attempt={attempt+1}")

            # ---------------------------------------
            # STATUS CHECK
            # ---------------------------------------
            if response.status_code != 200:
                logger.error(f"[GEMINI ERROR] {response.text}")

                # retry on server errors
                if attempt < retries:
                    time.sleep(1)
                    continue

                return ""

            data = response.json()

            text = _safe_extract(data)

            if not text.strip():
                logger.warning("[GEMINI EMPTY RESPONSE]")

                if attempt < retries:
                    time.sleep(1)
                    continue

                return ""

            return text.strip()

        except requests.exceptions.Timeout:
            logger.warning("[GEMINI TIMEOUT]")

            if attempt < retries:
                time.sleep(1)
                continue

        except Exception:
            logger.exception("[GEMINI FAILURE]")

            if attempt < retries:
                time.sleep(1)
                continue

    return ""
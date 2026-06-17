"""Smoke-test the Groq provider. Run with: python test_groq.py"""

import os

from dotenv import load_dotenv


def main() -> None:
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("GROQ_API_KEY missing — set it in .env to run this test.")
        return

    from langchain_groq import ChatGroq

    llm = ChatGroq(api_key=api_key, model="llama-3.1-8b-instant")
    response = llm.invoke("Say hello in one sentence.")
    print("RESPONSE:", getattr(response, "content", response))


if __name__ == "__main__":
    main()
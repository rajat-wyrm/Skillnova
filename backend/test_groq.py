import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

print("KEY:", api_key)

llm = ChatGroq(
    api_key=api_key,
    model="llama-3.1-8b-instant",  # ✅ FIXED
)

response = llm.invoke("Say hello")

print("RESPONSE:", response.content)
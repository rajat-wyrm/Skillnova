import requests
import json

def verify():
    url = "http://localhost:8000/api/chat"
    payload = {
        "message": "What is the attendance policy?",
        "session_id": "live_verify_final",
        "role": "Intern"
    }
    
    print("--- LIVE SYSTEM VERIFICATION ---")
    try:
        response = requests.post(url, json=payload, timeout=30)
        data = response.json()
        
        print(f"Status Code: {response.status_code}")
        print("-" * 30)
        print(f"REPLY: {data.get('reply', 'No reply')[:500]}...")
        print("-" * 30)
        print(f"CONFIDENCE: {data.get('confidence', 0.0)}")
        print(f"SOURCES: {data.get('sources', [])}")
        
        if response.status_code == 200 and data.get('confidence', 0) > 0.5:
            print("\n✅ VERIFICATION SUCCESSFUL: System is live and accurate.")
        else:
            print("\n⚠️ VERIFICATION WARNING: Check server logs or API limits.")
            
    except Exception as e:
        print(f"\n❌ VERIFICATION FAILED: {e}")

if __name__ == "__main__":
    verify()

import os
from groq import Groq
from dotenv import load_dotenv
import base64

load_dotenv()
keys = os.environ.get("GROQ_API_KEYS", "")
key_list = [k.strip() for k in keys.split(",") if k.strip()]
client = Groq(api_key=key_list[0])

# Download a sample circuit diagram image or just use text
import requests
image_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Circuit_Diagram.svg/512px-Circuit_Diagram.svg.png"
response = requests.get(image_url)
base64_image = base64.b64encode(response.content).decode('utf-8')

prompt = """
This is a test image. 
Return a JSON array of any diagrams or text blocks. 
For each, give {"type": "diagram" | "text", "bbox": [ymin, xmin, ymax, xmax] as values between 0 and 1000}.
"""

res = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}},
            ],
        }
    ],
    model="llama-3.2-90b-vision-preview",
    temperature=0.1
)
print(res.choices[0].message.content)

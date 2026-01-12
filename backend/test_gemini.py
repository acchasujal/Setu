from google import genai
from dotenv import load_dotenv
import os

load_dotenv()  # looks for .env in current & parent directories

secret_key = os.getenv("SECRET_KEY")
debug = os.getenv("DEBUG")
client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain scholarship process simply for parents"
)
print(response.text)

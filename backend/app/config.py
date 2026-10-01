import os

from dotenv import load_dotenv


# Load variables from backend/.env
load_dotenv()


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")
JWT_SECRET = os.getenv("JWT_SECRET")

import os

from dotenv import load_dotenv

# Load variables from backend/.env
load_dotenv()

# Primary AI provider
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Backup AI provider
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# MongoDB connection string
MONGODB_URI = os.getenv("MONGODB_URI")

# Secret used for JWT authentication
JWT_SECRET = os.getenv("JWT_SECRET")

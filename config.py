import secrets
from pathlib import Path
import os


def check_env():
    secret_key = secrets.token_hex(32)
    file_path = Path(".env")

    if not file_path.is_file():
        with open(".env", "w") as file:
            file.write(f"SECRET_KEY={secret_key}")
    else:
        print(".env already exists")

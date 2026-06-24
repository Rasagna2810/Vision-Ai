from passlib.context import CryptContext
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _normalize_password(password: str) -> str:
    """
    bcrypt only supports 72 bytes.
    If password is longer, hash it first with SHA-256.
    """
    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        return hashlib.sha256(password_bytes).hexdigest()

    return password

def hash_password(password: str) -> str:
    password = _normalize_password(password)
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    password = _normalize_password(password)
    return pwd_context.verify(password, hashed)

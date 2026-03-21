import jwt
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, Admin
from app.schemas.auth import TokenData

security = HTTPBearer()

def get_current_user(token: Annotated[HTTPAuthorizationCredentials, Depends(security)], db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token.credentials, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(id=user_id)
    except jwt.InvalidTokenError:
        raise credentials_exception
    user = db.query(User).filter(User.id == token_data.id).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin(token: Annotated[HTTPAuthorizationCredentials, Depends(security)], db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token.credentials, settings.SECRET_KEY, algorithms=["HS256"])
        admin_id: str = payload.get("sub")
        if admin_id is None:
            raise credentials_exception
        token_data = TokenData(id=admin_id)
    except jwt.InvalidTokenError:
        raise credentials_exception
    admin = db.query(Admin).filter(Admin.id == token_data.id).first()
    if admin is None:
        raise credentials_exception
    return admin

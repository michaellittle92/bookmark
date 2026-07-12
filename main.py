import os
import config
from dotenv import load_dotenv
import bcrypt
from schema import CategoryCreate, UserRegister, BookmarkCreate, CategoryUpdate
import database
from fastapi import FastAPI, Depends, HTTPException, status
import jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager


# Run at startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    database.create_table()
    yield


app = FastAPI(lifespan=lifespan)

# CORS CONFIG

# JWT CONFIG - Move to .env

config.check_env()
load_dotenv()

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# create a token
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# verify token on secure route
def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(database.get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Token"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or exipred token"
        )
    # fetch complete row from the db
    user = database.db_get_user_by_username(db, username)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return user


# login
@app.post("/login")
def login(
    user_data: OAuth2PasswordRequestForm = Depends(), db=Depends(database.get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "SELECT password FROM users WHERE username = ?", (user_data.username,)
    )
    row = cursor.fetchone()

    # generic exception to prevent user enumeration
    invalid_credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
    )
    if row is None:
        raise invalid_credentials_exception

    d = dict(row)

    submitted_password_bytes = user_data.password.encode("utf-8")
    stored_password_bytes = d["password"]

    if bcrypt.checkpw(submitted_password_bytes, stored_password_bytes):
        token = create_access_token(data={"sub": user_data.username})
        return {"access_token": token, "token_type": "bearer"}
    raise invalid_credentials_exception


# register
@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db=Depends(database.get_db)):
    new_password_bytes = user_data.password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password=new_password_bytes, salt=salt)

    success = database.db_register_user(db, user_data.username, hashed_password)

    if success:
        return {"message": f"User{user_data.username} created successfully"}
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Username already in use"
    )


# logout - will handle this client side for now. V2, add to backend with token token blacklist


# user/Get all bookmarks
# NOT WORKING Need to impliment catagories first
@app.get("/user/get_bookmarks")
def get_all_user_bookmarks(
    current_user=Depends(get_current_user), db=Depends(database.get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "SELECT * FROM bookmarks WHERE user_id = ?", (current_user["user_id"],)
    )
    bookmarks = cursor.fetchall()
    return bookmarks


# user/Create bookmark
@app.post("/user/create_bookmark")
def create_bookmark(
    bookmark: BookmarkCreate,
    current_user=Depends(get_current_user),
    db=Depends(database.get_db),
):
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO bookmarks (bookmark_title, bookmark_url, category_id, user_id) VALUES(?,?,?,?)",
        (
            bookmark.bookmark_title,
            bookmark.bookmark_url,
            bookmark.category_id,
            current_user["user_id"],
        ),
    )
    db.commit()
    return {"message": f"Bookmark{bookmark.bookmark_title} created succesfully"}


# user/Update bookmark
# user/Delete Bookmark


# user/get all categories
@app.get("/user/get_all_categories")
def get_all_categories(
    current_user=Depends(get_current_user), db=Depends(database.get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "SELECT * FROM categories WHERE user_id IS NULL OR user_id = ?",
        (current_user["user_id"],),
    )
    categories = cursor.fetchall()
    return [dict(row) for row in categories]


# user/create user category
@app.post("/user/create_user_category")
def create_user_category(
    category: CategoryCreate,
    current_user=Depends(get_current_user),
    db=Depends(database.get_db),
):
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO categories (user_id, category_name) VALUES(?,?)",
        (current_user["user_id"], category.category_name),
    )
    db.commit()
    return {"message": f"Category{category.category_name} created successfully"}


# user/delete user category
@app.delete("/user/delete_category/category_id")
def delete_category(
    category_id: int,
    current_user=Depends(get_current_user),
    db=Depends(database.get_db),
):
    cursor = db.cursor()
    cursor.execute(
        "DELETE FROM categories WHERE category_id = ? AND user_id = ?",
        (category_id, current_user["user_id"]),
    )
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return {"message": f"Category {category_id} deleted successfully"}


# user/update user category
@app.put("/users/update_category/{category_id}")
def update_category(
    category_id: int,
    category: CategoryUpdate,
    current_user=Depends(get_current_user),
    db=Depends(database.get_db),
):
    cursor = db.cursor()
    cursor.execute(
        "UPDATE categories SET category_name = ? WHERE category_id = ? AND user_id = ?",
        (category.category_name, category_id, current_user["user_id"]),
    )
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return {"message": f"Category {category_id} updated successfully"}

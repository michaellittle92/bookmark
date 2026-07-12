import sqlite3
import os
from fastapi import HTTPException, status

DB_LOCATION = ""
DB_PATH = os.path.join(DB_LOCATION, "bookmark.db")


def create_table():
    if DB_LOCATION and not os.path.exists(DB_LOCATION):
        os.makedirs(DB_LOCATION)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password BLOB NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories(
        category_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        category_name TEXT NOT NULL,
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        );

        CREATE TABLE IF NOT EXISTS bookmarks(
        bookmark_id INTEGER PRIMARY KEY AUTOINCREMENT,
        bookmark_title TEXT,
        bookmark_url TEXT,
        category_id INT,
        user_id INT NOT NULL,
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id),
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        );
    """)
    conn.commit()
    conn.close()


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def db_register_user(db, username, hashed_password):
    cursor = db.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password) VALUES (?,?)",
            (username, hashed_password),
        )
        db.commit()
        return True
    except sqlite3.IntegrityError:
        return False


def db_login(db, username):
    cursor = db.cursor()
    cursor.execute("SELECT password FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()

    if row is None:
        return False
    return dict(row)


def db_get_user_by_username(db, username: str):
    db.row_factory = sqlite3.Row
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    return cursor.fetchone()

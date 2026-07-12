from pydantic import BaseModel, Field


# login
class UserRegister(BaseModel):
    username: str = Field(..., min_length=1, max_length=20)
    password: str = Field(..., min_length=8, max_length=50)


class UserLogin(BaseModel):
    username: str
    password: str


# category
class CategoryCreate(BaseModel):
    category_name: str


class CategoryUpdate(BaseModel):
    category_name: str


# bookmark
class BookmarkCreate(BaseModel):
    bookmark_title: str = Field(..., min_length=1, max_length=50)
    bookmark_url: str = Field(..., min_length=10, max_length=200)
    category_id: int

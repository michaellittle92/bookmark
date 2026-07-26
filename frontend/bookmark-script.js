import {API_BASE_URL} from "./config.js";

let categoriesCache = [];

async function getBookmarks(){
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") || "Bearer";

    if (!token){
        window.location.href = "index.html";
        return
    }
    try{
        const response = await fetch(`${API_BASE_URL}/user/get_bookmarks`, {
            method: "GET",
            headers: {
                Authorization: `${tokenType} ${token}`,
            },
        });

        if (!response.ok){
            if (response.status === 401){
                localStorage.removeItem("access_token");
                localStorage.removeItem("token_type");
                window.location.href = "index.html";
                return
            }
            throw new Error(`Request failed: ${response.status}`);
        }
        const bookmarks = await response.json();
        renderBookmarks(bookmarks)
    }catch(err){
        console.log(err.message);
    }
}

async function getCategories(){
    const token = localStorage.getItem("access_token")
    const tokenType = localStorage.getItem("token_type") || "Bearer";

    if (!token){
        window.location.href = "index.html";
        return
    }
    try{
        const response = await fetch(`${API_BASE_URL}/user/get_all_categories`, {
            method: "GET",
            headers: {
                Authorization: `${tokenType} ${token}`,
            },
        });
        if (!response.ok){
            if(response.status === 401){
                localStorage.removeItem("access_token")
                localStorage.removeItem("token_type");
                window.location.href = "index.html";
                return []
            }
            throw new Error(`Request failed: ${response.status}`);
        }
        const categories = await response.json();
        categoriesCache = categories;
        return categories
    }
    catch(err){
        console.log(err.message)
        return []
    }
}

async function updateBookmarkCategory(bookmark, newCategoryId){
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") || "Bearer";

    try{
        const response = await fetch(`${API_BASE_URL}/user/update_bookmark/${bookmark.bookmark_id}`, {
            method: "PUT",
            headers: {
                Authorization: `${tokenType} ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                bookmark_title: bookmark.bookmark_title,
                bookmark_url: bookmark.bookmark_url,
                category_id: newCategoryId,
            }),
        });

        if (!response.ok){
            throw new Error(`Request failed: ${response.status}`);
        }
    }catch(err){
        console.log(err.message);
    }
} 

function createCategoryDropdown(bookmark){
    const select = document.createElement("select");
    select.classList.add("bookmark-category-select");

    const noneOption = document.createElement("option");
    noneOption.value = "";
    noneOption.textContent = "Uncategorized";
    if (bookmark.category_id === null){
        noneOption.selected = true;
    }
    select.appendChild(noneOption);

    categoriesCache.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.category_id;
        option.textContent = category.category_name;
        if (category.category_id === bookmark.category_id){
            option.selected = true;
        }
        select.appendChild(option);
    });

    select.addEventListener("change", (e) => {
        const newCategoryId = e.target.value === "" ? null : Number(e.target.value);
        updateBookmarkCategory(bookmark, newCategoryId);
    });

    return select;
}

function renderBookmarks(bookmarks){
    const container = document.querySelector("#bookmarks-container");
    container.innerHTML = "";

    if (bookmarks.length === 0){
        container.textContent = "No bookmarks found";
        return
    }

    bookmarks.forEach((bookmark) => {
        const row = document.createElement("div");
        row.classList.add("bookmark-row")

        const title = document.createElement("span");
        title.classList.add("bookmark-title")
        title.textContent = bookmark.bookmark_title;

        const link = document.createElement("a");
        link.classList.add("bookmark_url");
        link.href = bookmark.bookmark_url;
        link.textContent = bookmark.bookmark_title;
        link.target = "_blank";
        link.rel = "noopener noreferrer"

        const categorySelect = createCategoryDropdown(bookmark)

        row.appendChild(title);
        row.appendChild(link)
        row.appendChild(categorySelect)   // <-- added, this was missing

        container.appendChild(row);
    });

}
async function createBookmark(bookmarkTitle, bookmarkUrl, categoryId){
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") || "Bearer";

    try{
        const response = await fetch(`${API_BASE_URL}/user/create_bookmark`, {
            method: "POST",
            headers: {
                Authorization: `${tokenType} ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                bookmark_title: bookmarkTitle,
                bookmark_url: bookmarkUrl,
                category_id: categoryId,
            }),
        });

        if (!response.ok){
            throw new Error(`Request failed: ${response.status}`);
        }

        await getBookmarks(); // refresh list since the endpoint doesn't return the new bookmark
    }catch(err){
        console.log(err.message);
    }
}

function populateCategorySelect(selectEl){
    selectEl.innerHTML = "";

    const noneOption = document.createElement("option");
    noneOption.value = "";
    noneOption.textContent = "Uncategorized";
    selectEl.appendChild(noneOption)

    categoriesCache.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.category_id;
        option.textContent = category.category_name;
        selectEl.appendChild(option);
    });
}

function initCreateBookmarkForm(){
    const form = document.querySelector("#create-bookmark-form");
    if (!form) return;

    const categorySelect = document.querySelector("#new-bookmark-category");
    populateCategorySelect(categorySelect);

    form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.querySelector("#new-bookmark-title").value.trim();
    const url = document.querySelector("#new-bookmark-url").value.trim();
    const categoryValue = categorySelect.value;
    const categoryId = categoryValue === "" ? null : Number(categoryValue);

    if (!title || !url) return;

    createBookmark(title, url, categoryId);
    form.reset();
});
}

async function init(){
await getCategories();
await getBookmarks();
initCreateBookmarkForm();
}

init();


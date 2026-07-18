import {API_BASE_URL} from "./config.js";

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
            if(response === 401){
                localStorage.removeItem("access_token")
                localStorage.removeItem("token_type");
                window.location.href = "index.html";
                return
            }
            throw new Error(`Request failed: ${response.status}`);
        }
        const categories = await response.json();
        console.log(categories)
    }
    catch(err){
        console.log(err.message)
    }
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
        //row.classList.add("bookmark-row")

        const title = document.createElement("span");
        title.classList.add("bookmark-title")
        title.textContent = bookmark.bookmark_title;

        const link = document.createElement("a");
        link.classList.add("bookmark_url");
        link.href = bookmark.bookmark_url;
        link.textContent = bookmark.bookmark_title;
        link.target = "_blank";
        link.rel = "noopener noreferrer"

        row.appendChild(title);
        row.appendChild(link)
        container.appendChild(row);

    });
}

getCategories();
getBookmarks();

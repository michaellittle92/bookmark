import {API_BASE_URL} from "./config.js";

function requireAuth(){
    const token = localStorage.getItem("access_token");
    if (!token){
        window.location.href = "index.html";
        return false;
    }
    return true;
}

async function getCategories(){
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") || "Bearer";

    try{
        const response = await fetch(`${API_BASE_URL}/user/get_all_categories`, {
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
                return;
            }
            throw new Error(`Request failed: ${response.status}`);
        }
        const categories = await response.json();
        renderCategories(categories);
    }catch(err){
        console.log(err.message);
    }
}

async function createCategory(categoryName){
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") || "Bearer";

    try{
        const response = await fetch(`${API_BASE_URL}/user/create_user_category`, {
            method: "POST",
            headers: {
                Authorization: `${tokenType} ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                category_name: categoryName,
            }),
        });

        if (!response.ok){
            throw new Error(`Request failed: ${response.status}`);
        }

        await getCategories();
    }catch(err){
        console.log(err.message);
    }
}

async function updateCategory(categoryId, categoryName){
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") || "Bearer";

    try{
        const response = await fetch(`${API_BASE_URL}/user/update_category/${categoryId}`, {
            method: "PUT",
            headers: {
                Authorization: `${tokenType} ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                category_name: categoryName,
            }),
        });

        if (!response.ok){
            throw new Error(`Request failed: ${response.status}`);
        }
    }catch(err){
        console.log(err.message);
    }
}

async function deleteCategory(categoryId, rowEl){
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") || "Bearer";

    try{
        const response = await fetch(`${API_BASE_URL}/user/delete_category/${categoryId}`, {
            method: "DELETE",
            headers: {
                Authorization: `${tokenType} ${token}`,
            },
        });

        if (!response.ok){
            throw new Error(`Request failed: ${response.status}`);
        }

        rowEl.remove();
    }catch(err){
        console.log(err.message);
    }
}

function renderCategories(categories){
    const container = document.querySelector("#categories-container");
    container.innerHTML = "";

    if (categories.length === 0){
        container.textContent = "No categories found";
        return;
    }

    categories.forEach((category) => {
        const row = document.createElement("div");
        row.classList.add("category-row");

        const isOwned = category.user_id !== null;

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = category.category_name;
        nameInput.disabled = !isOwned;
        nameInput.classList.add("category-name-input");

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.disabled = !isOwned;
        saveButton.addEventListener("click", () => {
            const newName = nameInput.value.trim();
            if (!newName) return;
            updateCategory(category.category_id, newName);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.disabled = !isOwned;
        deleteButton.addEventListener("click", () => {
            deleteCategory(category.category_id, row);
        });

        row.appendChild(nameInput);
        row.appendChild(saveButton);
        row.appendChild(deleteButton);

        if (!isOwned){
            const badge = document.createElement("span");
            badge.textContent = "(global)";
            badge.classList.add("category-global-badge");
            row.appendChild(badge);
        }

        container.appendChild(row);
    });
}

function signOut(){
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    window.location.href = "index.html";
}

function initSignOutButton(){
    const button = document.querySelector("#signout-btn");
    if (!button) return;

    button.addEventListener("click", signOut);
}

function initCreateCategoryForm(){
    const form = document.querySelector("#create-category-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const nameInput = document.querySelector("#new-category-name");
        const name = nameInput.value.trim();
        if (!name) return;

        createCategory(name);
        form.reset();
    });
}

async function init(){
    if (!requireAuth()) return;

    await getCategories();
    initCreateCategoryForm();
    initSignOutButton();
}

init();
import {API_BASE_URL} from "./config.js";

const form = document.querySelector(".registration-form")
//add error message logic 

form.addEventListener("submit", async (event)=>{
    event.preventDefault();

    const username = document.querySelector("#username").value
    const password = document.querySelector("#password").value

    try{
        const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
});
        if (!response.ok){
            const errorData = await response.json().catch(()=>({}));
            throw new Error(errorData.detail || "Sign up failed")
        }
        const data = await response.json();

        window.location.href="index.html";
    }
    catch (err){
        console.log(err.message)
    }
})

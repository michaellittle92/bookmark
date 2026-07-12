const API_BASE_URL = "http://127.0.0.1:8000"

const form = document.querySelector(".login-form")
//error message logic goes here

form.addEventListener("submit", async (event)=> {
    event.preventDefault();

    const username = document.querySelector("#username").value
    const password = document.querySelector("#password").value

    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    try{
        const response = await fetch(`${API_BASE_URL}/login`, {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded",}, body: body,});
        if (!response.ok){
            const errorData = await response.json().catch(()=> ({}));
            throw new Error(errorData.detail || "Login failed");
        }

        const data = await response.json();

        //Save JWT
        localStorage.setItem("access token", data.access_token);
        localStorage.setItem("token_type", data.token_type);

        window.location.href="bookmark.html";
    } catch (err){
        console.log(err.message)
    }
   
    });

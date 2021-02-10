const loginContainer = document.getElementById("login-container")
const app = document.getElementById("app")
const loadingBar = document.getElementById("loading-bar")

async function onSignIn(user) {
  console.log(user.getAuthResponse())
  loadingBar.style.width = "30%"
  let res = await fetch("/login", {
      method: "POST",
      body: JSON.stringify({
        token: user.getAuthResponse().id_token
      }),
      headers: {
          "Content-Type": "application/json"
      }
  }).then(res => res.json())
  loadingBar.style.width = "100%"
  setTimeout(() => {
    if (res.status) {
      loginContainer.style.display = "none"
      app.style.display = "block"
    }
  }, 500)
}
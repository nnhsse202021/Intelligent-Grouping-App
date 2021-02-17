const loginContainer = document.getElementById("login-container")
const app = document.getElementById("app")
const loadingBar = document.getElementById("loading-bar")
const signOutBtn = document.getElementById("signout")
const username = document.getElementById("username")

let auth2
let googleUser

loadingBar.style.width = "30%"
gapi.load('auth2', () => {
  auth2 = gapi.auth2.init({
    client_id: '245771948528-c31us1t1k3l0tpmlcm2kq8jd33jmd6rj.apps.googleusercontent.com'
  })

  auth2.then(() => {
    if (!auth2.isSignedIn.get()) {
      show(loginContainer)
    }
  })

  gapi.signin2.render('login-btn', {
    'scope': 'profile email',
    'width': 240,
    'height': 50,
    'longtitle': true,
    'theme': 'dark'
  })

  auth2.attachClickHandler('login-btn', {})

  auth2.isSignedIn.listen(signinChanged)
  auth2.currentUser.listen(userChanged)
})

function signinChanged(val) {
  if (!val) {
    auth2.signOut()
    hide(app)
    show(loginContainer)
  }
}

function signOut() {
  auth2.signOut().then(function () {
    console.log('User signed out.')
  })
}

async function userChanged(user) {
  const verified = await verify(user)
  if (verified.status) {
    if (verified.user.given_name) {
      username.innerText = verified.user.given_name
    }
    hide(loginContainer)
    show(app)
  }
  loadingBar.style.width = "100%"
}

async function show(element) {
  element.classList.add("visible")
}

async function hide(element) {
  element.classList.remove("visible")
}

async function verify(user) {
  const res = await fetch("/login", {
    method: "POST",
    body: JSON.stringify({
      token: user.getAuthResponse().id_token
    }),
    headers: {
        "Content-Type": "application/json"
    }
  }).then(res => res.json())
  console.log(res)
  return res
}

signOutBtn.addEventListener("click", signOut)
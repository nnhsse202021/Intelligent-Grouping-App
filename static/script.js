const loginContainer = document.getElementById("login-container")
const app = document.getElementById("app")
const loadingBar = document.getElementById("loading-bar")
const signOutBtn = document.getElementById("signout")
const username = document.getElementById("username")
const addClass = document.getElementById("add-class-roster-input")
let resetLoadTimeout

let auth2
let googleUser

startLoad()
gapi.load('auth2', () => {
  auth2 = gapi.auth2.init({
    client_id: '245771948528-c31us1t1k3l0tpmlcm2kq8jd33jmd6rj.apps.googleusercontent.com'
  })

  auth2.then(() => {
    if (!auth2.isSignedIn.get()) {
      show(loginContainer)
      endLoad()
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

async function signOut() {
  loadAround(async () => {
    await auth2.signOut()
  })
}

function uploadClass(e) {
  if (addClass.files[0]) {
    addClassToDatabase(addClass.files[0])
  }
}

async function addClassToDatabase(file) {
  let data = await file.text() //raw string data
  let classObj = {}
  //Derek Zhang assignment - 24 Feb 2021
  //1. set the input to accept csv files only
  //2. transform data into a JSON (classObj) from the file in the following format:
  /*
    {
      name: "class name",
      period: "period number (as a string)",
      students: [
        {
          first: "first name",
          middle: "middle initial"
          last: "last name",
          id: "student id"
        }
      ]
    }
  */
  await fetch("/addClass", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token: user.getAuthResponse().id_token,
      classObj: classObj
    })
  }).then(res => res.json())
}

async function userChanged(user) {
  if (auth2.isSignedIn.get()) {
    await loadAround(async () => {
      const verified = await verify(user)
      if (verified.status) {
        if (verified.user.given_name) {
          username.innerText = verified.user.given_name
        }
        hide(loginContainer)
        show(app)
      }
    })
  }
}

async function loadAround(func) {
  console.log("loading")
  startLoad()
  await func()
  endLoad()
}

async function startLoad() {
  clearTimeout(resetLoadTimeout)
  loadingBar.style.width = "30%"
  loadingBar.style.opacity = 1
  loadingBar.style.height = "4px"
}

async function endLoad() {
  loadingBar.style.width = "100%"
  setTimeout(() => {
    loadingBar.style.height = 0
    loadingBar.style.opacity = 0
    resetLoadTimeout = setTimeout(() => {
      loadingBar.style.width = 0
      setTimeout(() => {
        loadingBar.style.opacity = 1
        loadingBar.style.height = "4px"
      }, 500)
    }, 500)
  }, 750)
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
  return res
}

signOutBtn.addEventListener("click", signOut)
addClass.addEventListener("change", uploadClass)
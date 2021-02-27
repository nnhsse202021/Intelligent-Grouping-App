// (() => {
// Elements \\
const loginContainer = document.getElementById("login-container")
const app = document.getElementById("app")
const loadingBar = document.getElementById("loading-bar")
const signOutBtn = document.getElementById("signout")
const username = document.getElementById("username")
const addClassBtn = document.getElementById("add-class-input")
const classListDiv = document.getElementById("class-list")

//-------\\

// User Data (local) \\
const classes = []
//-------\\

// Loading Bar \\
async function loadAround(func) {
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
let resetLoadTimeout

//-------\\

// Error Toast \\

function createError(errorText) {
  const errorElement = document.createElement("p")
  errorElement.classList = "error"
  errorElement.innerText = errorText
  document.body.appendChild(errorElement)
  errorElement.offsetHeight
  errorElement.style.bottom = "8%"
  setTimeout(() => {
    errorElement.style.bottom = "0%"
    setTimeout(() => {
      document.body.removeChild(errorElement)
    }, 600)
  }, 5000)
}

//-------\\

// Auth \\
let auth2

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

async function userChanged(user) {
  if (auth2.isSignedIn.get()) {
    await loadAround(async () => {
      const verification = await verify(user)
      if (verification.status) {
        if (verification.user.given_name) {
          console.log(verification.user)
          username.innerText = verification.user.given_name[0] + verification.user.family_name[0]
        }
        classes.push(...verification.classes)
        for (const classObj of classes) {
          addClassToUI(classObj)
        }
        hide(loginContainer)
        show(app)
      }
    })
  }
}

async function verify(user) {
  const res = await fetch("/login", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token: user.getAuthResponse().id_token
    }
  }).then(res => res.json())
  return res
}

//-------\\

async function constructClasses(file) {
  const data = await file.text() //raw string data
  const classObjs = []
  //Derek Zhang assignment - 24 Feb 2021
  //1. set the input to accept csv files only
  //2. make sure file is valid format
  //3. transform data into a array of JSON objects (there are many classes) from the file in the following format (IF VALID):
  /*
    [
      {
        id: String,
        name: String,
        period: String,
        students: [
          {
            id: String,
            first: String,
            last: String,
            middle: String, (uppercase this)
            preferences: []
          }
        ],
        groups: []
      }
    ]
  */
  const placeholderClasses = [{
    id: "324",
    name: "Software Engineering",
    period: "2",
    students: [
      {
        id: "4324",
        first: "joe",
        last: "bob",
        middle: "z",
        preferences: []
      }
    ],
    groups: []
  },
  {
    id: "546",
    name: "Computer Programming",
    period: "3",
    students: [
      {
        id: "4324",
        first: "joe",
        last: "bob",
        middle: "z",
        preferences: []
      }
    ],
    groups: []
  }]
  return {valid: true, classObj: placeholderClass}
}

function saveClass(classObjs) {
  return fetch("/addClass", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: auth2.currentUser.get().getAuthResponse().id_token
    },
    body: JSON.stringify({
      classObjs: classObjs
    })
  }).then(res => res.json())
}

function addClassToUI(classObj) {
  const classElement = document.createElement("div")
  classElement.classList = "class selected"
  const classArrow = document.createElement("button")
  classArrow.classList = "class-arrow"
  const className = document.createElement("p")
  className.classList = "class-name"
  className.innerText = `${classObj.name} P${classObj.period}`
  classElement.appendChild(classArrow)
  classElement.appendChild(className)
  const classElements = Array.from(classListDiv.children)
  if (classElements.length) {
    for (let i = 0; i < classes.length; i++) {
      
    }
  } else {
    classListDiv.appendChild(classElement)
  }
}

async function addClass(e) {
  loadAround(async () => {
    if (addClassBtn.files[0]) {
      const classResult = await constructClasses(addClassBtn.files[0])
      addClassBtn.value = null
      if (classResult.valid) {
        const result = await saveClass(classResult.classObjs)
        if (result.status) {
          addClassToUI(classResult.classObj)
          classes.push(classResult.classObj)
        } else {
          createError(result.error)
        }
      }
    }
  })
}

// Event Listeners \\
signOutBtn.addEventListener("click", signOut)
addClassBtn.addEventListener("change", addClass)
// })()
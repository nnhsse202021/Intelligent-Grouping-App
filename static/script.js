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
  let data = await file.text()
  const classObjs = []
  data = data.split("\n").map(x => x.split(","))
  const required = ["Period","Course Number","Course Name","ID","Student Last Name","Student First Name","Student Middle Name"]

  for(const element of required) {
    if (!data[0].includes(element)) {
      createError("Error: Invalid File Format")
      return {valid: false}
    }
  }

  data = data.slice(1, data.length - 1)

  for (const row of data) {
    let existing
    for(const classObj of classObjs) {
      if (classObj.id == row[2] && classObj.period == row[1]) {
        existing = classObj
      }      
    }

    if (existing) {
      existing.students.push({
        id: row[4],
        first: row[6],
        last: row[5],
        middle: row[7][0],
        preferences: []
      })
    } else {
      classObjs.push({
        id: row[2],
        name: row[3],
        period: +row[1],
        students: [
          {
            id: row[4],
            first: row[6],
            last: row[5],
            middle: row[7] ? row[7][0] : "",
            preferences: []
          }
        ],
        groups: []
      })
    }   
  }
  
  return {valid: true, classObjs: classObjs}
}

function saveClasses(classObjs) {
  return fetch("/addClasses", {
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
  classElement.classList = "class"
  const classArrow = document.createElement("button")
  classArrow.classList = "class-arrow"
  const className = document.createElement("p")
  className.classList = "class-name"
  className.innerText = `${classObj.name} P${classObj.period}`
  classElement.appendChild(classArrow)
  classElement.appendChild(className)
  const classElements = Array.from(classListDiv.children)
  if (classElements.length) {
    for (var i = 0; i < classes.length; i++) {
      if (classObj.period < classes[i].period) {
        break
      }
    }
    classListDiv.insertBefore(classElement, classElement[i])
  } else {
    classListDiv.appendChild(classElement)
  }
}

async function addClass(e) {
  loadAround(async () => {
    if (addClassBtn.files[0]) {
      const classesResult = await constructClasses(addClassBtn.files[0])
      addClassBtn.value = null
      if (classesResult.valid) {
        const saveResult = await saveClasses(classesResult.classObjs)
        if (saveResult.status) {
          console.log()
          for (const classObj of saveResult.newClasses) {
            addClassToUI(classObj)
            for (var i = 0; i < classes.length; i++) {
              if (classObj.period < classes[i].period) {
                break
              }
            }
            classes.splice(i, 0, classObj)
            classes.push(classObj)
          }
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
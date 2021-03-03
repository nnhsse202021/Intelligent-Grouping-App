// (() => {
// Elements \\
const loginContainer = document.getElementById("login-container")
const app = document.getElementById("app")
const loadingBar = document.getElementById("loading-bar")
const signOutBtn = document.getElementById("signout")
const username = document.getElementById("username")
const addClassBtn = document.getElementById("add-class")
const classListDiv = document.getElementById("class-list")
const uploadClassInput = document.getElementById("upload-class-input")
const editClassSection = document.getElementById("edit-class-sec")
const classNameInput = document.getElementById("class-name-input")
const periodInput = document.getElementById("period-input")
//-------\\

// User Data (local) \\
let classes = {}
//-------\\

startLoad()

async function constructClasses(file) {
  let data = await file.text()
  const classObjs = []
  data = data.split("\n").map(x => x.split(","))
  const required = ["Period","Course Name","ID","Student Last Name","Student First Name","Student Middle Name"]

  for(const element of required) {
    if (!data[0].includes(element)) {
      createError("Invalid Format")
      return {valid: false}
    }
  }

  data = data.slice(1, data.length - 1)

  for (const row of data) {
    let existing
    const hashedId = md5(row[3] + +row[1])
    for(const classObj of classObjs) {
      if (classObj.id == hashedId) {
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
        id: hashedId,
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
  classElement.setAttribute("class-id", classObj.id)
  className.innerText = `${classObj.name} P${classObj.period}`
  classElement.appendChild(classArrow)
  classElement.appendChild(className)
  setUpClassEvents(classElement)
  const classElements = Array.from(classListDiv.children)
  addList(classElement, classListDiv)
  return classElement
}

function setUpClassEvents(classElement) {
  classElement.addEventListener("click", () => {
    removeList(classElement)
  })
}

async function addClass(classObj) {
  classes[classObj.id] = {obj: classObj, element: addClassToUI(classObj)}
}

async function uploadClass() {
  loadAround(async () => {
    if (uploadClassInput.files[0]) {
      const classesResult = await constructClasses(uploadClassInput.files[0])
      uploadClassInput.value = null
      if (classesResult.valid) {
        const saveResult = await saveClasses(classesResult.classObjs)
        if (saveResult.status) {
          for (const classObj of saveResult.newClasses) {
            addClass(classObj)
          }
          modalExit()
        } else {
          createError(saveResult.error)
        }
      }
    }
  })
}

function showAddClassModal() {
  createModal("small", (modal, exit) => {
    modal.classList.add("add-class-modal")
    const upload = document.createElement("button")
    upload.classList = "button"
    upload.innerText = "Upload Class"
    const uploadIcon = document.createElement("i")
    uploadIcon.classList = "fa fa-file-upload fa-3x"
    upload.appendChild(uploadIcon)
    upload.addEventListener("click", () => {uploadClassInput.click()})
    const manual = document.createElement("button")
    manual.classList = "button"
    manual.innerText = "Manually Add Class"
    const manualIcon = document.createElement("i")
    manualIcon.classList = "fa fa-pen-square fa-3x"
    manual.addEventListener("click", () => {
      exit()
      editClass()
    })
    manual.appendChild(manualIcon)
    modal.appendChild(upload)
    modal.appendChild(manual)
  })
}

function editClass(classObj) {
  switchSection(editClassSection)
  if (classObj) {
    
  } else {
    classNameInput.value = ""
    periodInput.value = ""
  }
}

function resetApp() {
  username.innerText = ""
  clearDiv(classListDiv)
  classes = []
}

// Event Listeners \\
signOutBtn.addEventListener("click", signOut)
addClassBtn.addEventListener("click", showAddClassModal)
uploadClassInput.addEventListener("change", uploadClass)
// })()
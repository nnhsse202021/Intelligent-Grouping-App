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
const welcomeSection = document.getElementById("welcome-sec")
const classInfoInputs = document.getElementById("class-info-inputs")
const classNameInput = document.getElementById("class-name-input")
const periodInput = document.getElementById("period-input")
const statusTitle = document.getElementById("status-title")
const studentInfoInputs = document.getElementById("student-info-inputs")
const addStudentBtn = document.getElementById("add-student")
const saveClassBtn = document.getElementById("save-class")
const cancelClassBtn = document.getElementById("cancel-class")
const viewClassSection = document.getElementById("view-class-sec")
const infoPanelClassName = document.getElementById("info-panel-class")
const infoPanelNumStudents = document.getElementById("info-panel-num-students")
const infoPanelNumGroups = document.getElementById("info-panel-num-groups")
const editClassBtn = document.getElementById("edit-class")
//-------\\

// Data (local) \\
let classes = {}
let state = {mode: 0, info: {}}
/*
0 = logged out
1 = dashboard
2 = adding class manually
3 = editing class manually
4 = class view
*/
//-------\\

startLoad()

function setState(mode, info={}) {
  state.mode = mode
  state.info = info
}

function constructClassFromManual() {
  const classObj = {}

  classObj.name = classNameInput.value;
  
  classObj.id = md5(classNameInput.value + +periodInput.value)
  classObj.period = periodInput.value
  classObj.students = []
  
  for (const inputGroup of Array.from(studentInfoInputs.children)) {
    if (!inputGroup.classList.contains("sizeholder")) {
      const student = {}
      for (let input of Array.from(inputGroup.children).slice(0,-1)) {
        input = input.children[0]
        if (input.classList.contains("first-name-input")) {
          student.firstName = input.value
        } else if (input.classList.contains("last-name-input")) {
          student.lastName = input.value
        } else if (input.classList.contains("middle-initial-input")) {
          student.middleInitial = input.value ? input.value : null
        } else if (input.classList.contains("student-id-input")) {
          student.id = input.value
        }
      }
      classObj.students.push(student)
    }
  }
  return classObj
}



async function constructClassesFromFile(file) {
  let data = await file.text()
  const classObjs = []
  data = data.split("\n").map(r => r.split(","))
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

function saveNewClasses(classObjs) {
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

function saveEditedClass(classObj) {
  return fetch("/editClasses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: auth2.currentUser.get().getAuthResponse().id_token
    },
    body: JSON.stringify({
      classObj: classObj
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
  classElement.setAttribute("id", classObj.id)
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
    for (const element of Array.from(classListDiv.children)) {
      if (element != classElement) {
        element.classList.remove("selected")
      } else {
        element.classList.add("selected")
      }
    }
    switchSection(viewClassSection)
    let selectedClass = classes[classElement.id].obj
    statusTitle.innerText = "View Class"
    setState(4, selectedClass.id)
    infoPanelClassName.innerText = `${selectedClass.name}  P${selectedClass.period}`
    infoPanelNumStudents.innerText = `${selectedClass.students.length} Students`
    infoPanelNumGroups.innerText = `${selectedClass.groups.length} Groups`
  })
}

async function addClass(classObj) {
  classes[classObj.id] = {obj: classObj}
  classes[classObj.id].element = addClassToUI(classObj)
}

async function uploadClass() {
  loadAround(async () => {
    if (uploadClassInput.files[0]) {
      const classesResult = await constructClassesFromFile(uploadClassInput.files[0])
      uploadClassInput.value = null
      if (classesResult.valid) {
        const saveResult = await saveNewClasses(classesResult.classObjs)
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
  if (classObj) {
    statusTitle.innerText = "Edit Class"
    setState(3, classObj.id)
  } else {
    statusTitle.innerText = "Create Class"
    classNameInput.value = ""
    periodInput.value = ""
    classNameInput.classList.remove("invalid")
    periodInput.classList.remove("invalid")
    clearDiv(studentInfoInputs)
    setState(2)
  }
  switchSection(editClassSection)
}

function addStudentInputs() {
  const studentInfoContainer = document.createElement("div")
  studentInfoContainer.classList = "student-info-container"
  studentInfoContainer.appendChild(createPlaceholderInput("First Name", "first-name-input"))
  studentInfoContainer.appendChild(createPlaceholderInput("Last Name", "last-name-input"))
  studentInfoContainer.appendChild(createPlaceholderInput("Middle Initial", "middle-initial-input"))
  studentInfoContainer.appendChild(createPlaceholderInput("ID", "student-id-input"))
  const removeStudent = document.createElement("i")
  removeStudent.classList = "fas fa-times-circle fa-2x remove-student"
  removeStudent.addEventListener("click", () => {
    removeList(studentInfoContainer)
  })
  studentInfoContainer.appendChild(removeStudent)
  addList(studentInfoContainer, studentInfoInputs)
}

function validateClassInputs() {
  let status = {valid: true}
  for (const input of Array.from(classInfoInputs.children)) {
    if (input.children[0].value == "") {
      input.children[0].classList.add("invalid")
      status = {valid: false, error: "Please fill out all fields"}
    } else {
      input.children[0].classList.remove("invalid")
    }
  }

  if (!status.valid) return status

  if (Array.from(studentInfoInputs.children).length == 1) {
    return {valid: false, error: "Please add at least one student"}
  }

  for (const inputGroup of Array.from(studentInfoInputs.children)) {
    if (!inputGroup.classList.contains("sizeholder")) {
      for (let input of Array.from(inputGroup.children).slice(0,-1)) {
        input = input.children[0]
        if (!input.classList.contains("middle-initial-input") && input.value == "") {
          input.classList.add("invalid")
          status = {valid: false, error: "Please fill out all fields"}
        } else {
          input.classList.remove("invalid")
        }
      }
    }
  }

  if (!status.valid) return status

  if (Object.keys(classes).includes(md5(classNameInput.value + periodInput.value))) {
    classNameInput.classList.add("invalid")
    return {valid: false, error: "Duplicate Class"}
  } else {
    classNameInput.classList.remove("invalid")
  }

  const studentIds = []
  for (const inputGroup of Array.from(studentInfoInputs.children)) {
    for (let input of Array.from(inputGroup.children).slice(0,-1)) {
      input = input.children[0]
      if (input.classList.contains("student-id-input")) {
        if (studentIds.includes(input.value)) {
          input.classList.add("invalid")
          status = {valid: false, error: "Duplicate Student IDs"}
        } else {
          studentIds.push(input.value)
          input.classList.remove("invalid")
        }
      }
    }
  }
  
  return status
}

function exitEdit() {
  switchSection(welcomeSection)
  statusTitle.innerText = "Dashboard"
  setState(1)
}

function saveClassAdd() {
  const status = validateClassInputs()
  if (status.valid) {
    const classObj = constructClassFromManual()
    saveNewClasses([classObj])
    addClass(classObj)
    exitEdit()
    switchSection(welcomeSection)
  } else {
    createError(status.error)
  }
}

function saveClassEdit() {

}

function createPlaceholderInput(text, inputClassName) {
  const labelContainer = document.createElement("label")
  labelContainer.classList = "label"
  const input = document.createElement("input")
  input.classList.add("input")
  input.classList.add(inputClassName)
  input.required = true
  const span = document.createElement("span")
  span.innerText = text
  labelContainer.appendChild(input)
  labelContainer.appendChild(span)
  return labelContainer
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
addStudentBtn.addEventListener("click", addStudentInputs)
saveClassBtn.addEventListener("click", () => {
  if (state.mode == 2) {
    saveClassAdd()
  } else if (state.mode == 3) {
    saveClassEdit()
  }
})
cancelClassBtn.addEventListener("click", exitEdit)
// })()
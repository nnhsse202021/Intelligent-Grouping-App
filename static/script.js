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
const deleteClassBtn = document.getElementById("delete-class")
const createGroupBtn = document.getElementById("create-group")
const editGroupSection = document.getElementById("edit-group-sec")
const arrangeStudentsBtn = document.getElementById("arrange-students")
const ungroupedStudentsListDiv = document.getElementById("ungrouped-students-list")
const groupScatter = document.getElementById("group-scatter")
const saveGroupBtn = document.getElementById("save-group")
const addGroupBtn = document.getElementById("add-group")
const groupNameInput = document.getElementById("group-name-input")
const groupingsList = document.getElementById("groupings-list")
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
5 = create group
6 = edit group
*/
//-------\\

startLoad()

function setState(mode, info={}) {
  state.mode = mode
  state.info = info
}

function constructClassFromManual() {
  const classObj = {groupings: []}

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
          student.first = input.value
        } else if (input.classList.contains("last-name-input")) {
          student.last = input.value
        } else if (input.classList.contains("middle-initial-input")) {
          student.middle = input.value
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
    const hashedId = md5(row[3] + row[1])
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
        groupings: []
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
  return fetch("/editClass", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: auth2.currentUser.get().getAuthResponse().id_token
    },
    body: JSON.stringify({
      classObj: classObj,
      oldId: state.info.id
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
  className.innerText = `${classObj.name} ${+classObj.period == classObj.period ? "P" + +classObj.period : classObj.period}`
  classElement.appendChild(classArrow)
  classElement.appendChild(className)
  setUpClassEvents(classElement)
  classListDiv.appendChild(classElement)
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
      showClass(classElement.id)
    }
  })
}

function showClass(id) {
  switchSection(viewClassSection)
  let selectedClass = classes[id].obj
  statusTitle.innerText = "View Class"
  setState(4, {id: id})
  infoPanelClassName.innerText = `${selectedClass.name} ${+selectedClass.period == selectedClass.period ? "P" + +selectedClass.period : selectedClass.period}`
  infoPanelNumStudents.innerText = `${selectedClass.students.length} Students`
  infoPanelNumGroups.innerText = `${selectedClass.groupings.length} Groups`
  clearDiv(groupingsList)
  for (const grouping of selectedClass.groupings) {
    addGroupingToList(grouping)
  }
}

function addGroupingToList(grouping) {
  const groupingContainer = document.createElement("div")
  groupingContainer.classList.add("grouping-container")
  groupingContainer.id = grouping.id
  const groupingName = document.createElement("p")
  groupingName.innerText = `${grouping.name} (${grouping.groups.length})`
  const deleteGroup = document.createElement("i")
  deleteGroup.classList = "fa fa-times fa-2x"

  groupingContainer.addEventListener("click", () => {
    editGrouping(grouping)
  })

  deleteGroup.addEventListener("click", async (e) => {
    e.stopPropagation()
    const deleteResult = await deleteGroupFromDB(state.info.id, grouping.id)
    console.log(deleteResult)
    if (deleteResult.status) {
      groupingsList.removeChild(groupingContainer)
    } else {
      createError(deleteResult.error)
    }
  })

  groupingContainer.appendChild(groupingName)
  groupingContainer.appendChild(deleteGroup)
  groupingsList.appendChild(groupingContainer)
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
      } else {
        createError("Invalid File")
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

function getRandomGroups(type, num, classId) {
  return fetch("/randomGroups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: auth2.currentUser.get().getAuthResponse().id_token
    },
    body: JSON.stringify({
      id: classId,
      type: type,
      num: num
    })
  }).then(res => res.json())
}

function showArrangeStudentsModal() {
  createModal("tall", (modal, exit) => {
    modal.classList.add("arrange-options-modal")
    const title = document.createElement("h1")
    title.classList = "medium"
    title.innerText = "Choose an Arrangement"
    const optionsDiv = document.createElement("div")
    const random = document.createElement("button")
    random.classList = "button"
    random.innerText = "Random"
    random.addEventListener("click", () => {
      exit()
      createModal("tall", (m, e) => {
        m.classList.add("random-options-modal")
        const groupNumForm = document.createElement("form")
        groupNumForm.innerHTML += "<p>Create</p>"
        const groupNum = document.createElement("input")
        groupNum.required = true
        groupNum.id = "group-num-input"
        groupNumForm.appendChild(groupNum)
        groupNumForm.innerHTML += "<p>groups</p>"

        const or = document.createElement("h1")
        or.classList = "medium"
        or.innerText = "OR"

        const studentNumForm = document.createElement("form")
        studentNumForm.innerHTML += "<p>Create groups of</p>"
        const studentNum = document.createElement("input")
        studentNum.required = true
        studentNum.id = "student-num-input"
        studentNumForm.appendChild(studentNum)
        studentNumForm.innerHTML += "<p>students</p>"

        const submit = document.createElement("button")
        submit.classList = "button"
        submit.innerText = "Submit"
        const singleInput = (e) => {
          let gNum = document.getElementById("group-num-input")
          let sNum = document.getElementById("student-num-input")
          if ((e.target == gNum && gNum.value) || sNum.value != +sNum.value || sNum.value < 1) {
            sNum.value = ""
          }
          if ((e.target == sNum && sNum.value) || gNum.value != +gNum.value || gNum.value < 1) {
            gNum.value = ""
          }
        }
        submit.addEventListener("click", async () => {
          let gNum = document.getElementById("group-num-input")
          let sNum = document.getElementById("student-num-input")
          const groupsResult = await getRandomGroups(gNum.value ? 0 : 1, gNum.value ? +gNum.value : +sNum.value, state.info.id)
          setGroups(groupsResult.groups)
          document.removeEventListener("input", singleInput)
          e()
        })

        m.appendChild(groupNumForm)
        m.appendChild(or)
        m.appendChild(studentNumForm)
        m.appendChild(submit)
        
        document.addEventListener("input", singleInput)
      })
    })
    modal.appendChild(title)
    optionsDiv.appendChild(random)
    modal.appendChild(optionsDiv)
  })
}

function addGroup() {
  const groupContainer = document.createElement("div")
  groupContainer.classList.add("group-container")
  const groupName = document.createElement("h1")
  groupName.classList = "medium"
  groupName.innerText = `Group ${Array.from(groupScatter.children).length}`
  const closeGroup = document.createElement("i")
  closeGroup.classList = "fa fa-times close-group"
  const studentList = document.createElement("div")
  studentList.classList = "group-student-list"
  closeGroup.addEventListener("click", () => {
    for (const student of Array.from(studentList.children)) {
      addList(student, ungroupedStudentsListDiv)
    }
    groupScatter.removeChild(groupContainer)
    normalizeGroupTitles()
  })
  groupContainer.appendChild(groupName)
  groupContainer.appendChild(closeGroup)
  groupContainer.appendChild(studentList)
  groupScatter.insertBefore(groupContainer, addGroupBtn)
  return groupContainer
}

function setGroups(groups) {
  for (const group of Array.from(groupScatter.children)) {
    if (group.id != "add-group") {
      for (const student of Array.from(group.children[2].children)) {
        ungroupedStudentsListDiv.appendChild(student)
      }
    }
  }
  clearDiv(groupScatter)
  for (let i = 0; i < groups.length; i++) {
    const groupContainer = addGroup()
    for (const student of groups[i]) {
      groupContainer.children[2].appendChild(Array.from(ungroupedStudentsListDiv.children).find(e => e.id == student))
    }
  }
}

function normalizeGroupTitles() {
  const groups = Array.from(groupScatter.children)
  for (let i = 0; i < groups.length-1; i++) {
    if (groups[i].id != "add-group") {
      groups[i].children[0].innerText = `Group ${i+1}`
    }
  }
}

function constructGroupingFromUI() {
  return {
    id: md5(groupNameInput.value),
    name: groupNameInput.value,
    groups: Array.from(groupScatter.children).filter(e => e.id != "add-group").map(e => Array.from(e.children[2].children).map(s => s.id))
  }
}

function validateGroups() {
  if (groupNameInput.value) {
    groupNameInput.classList.remove("invalid")
  } else {
    groupNameInput.classList.add("invalid")
    return {valid: false, error: "Please fill out all fields"}
  }

  if (Object.values(classes).map(c => c.obj.groupings).flat().includes(groupNameInput.value)) {
    return {valid: false, error: "Duplicate Grouping Name"}
  }

  if (Array.from(groupScatter.children).length == 1) {
    return {valid: false, error: "Please add at least one group"}
  }

  return {valid: true}
}

function openAcceptStudent(student) {
  student.classList.add("selected")
  state.info.student = student
  for (const group of Array.from(groupScatter.children)) {
    if (group.id != "add-group" && student.parentNode != group.children[2]) {
      group.children[2].classList.add("accepting")
      group.children[2].addEventListener("click", acceptStudent)
    }
  }
  if (student.parentNode != ungroupedStudentsListDiv) {
    ungroupedStudentsListDiv.classList.add("accepting")
    ungroupedStudentsListDiv.addEventListener("click", acceptStudent)
  }
  document.addEventListener("click", closeOutsideClick)
} 

function closeOutsideClick(e) {
  let close = true
  for (const group of Array.from(groupScatter.children)) {
    if (group.id != "add-group" && group.children[2].contains(e.target)) {
      close = false
    }
  }
  if (ungroupedStudentsListDiv.contains(e.target)) {
    close = false
  }

  if (close) {
    closeAcceptStudent()
  }
}

function closeAcceptStudent(e) {
  for (const group of Array.from(groupScatter.children)) {
    if (group.id != "add-group") {
      group.children[2].classList.remove("accepting")
      group.children[2].removeEventListener("click", acceptStudent)
    }
  }
  ungroupedStudentsListDiv.classList.remove("accepting")
  ungroupedStudentsListDiv.removeEventListener("click", acceptStudent)
  setTimeout(() => {
    state.info.student.classList.remove("selected")
    state.info.student = null
  }, 500)
  document.removeEventListener("click", closeOutsideClick)
}

function acceptStudent(e) {
  addList(state.info.student, e.currentTarget)
  closeAcceptStudent()
}

function editClass(classObj) {
  if (classObj) {
    statusTitle.innerText = "Edit Class"
    classNameInput.value = classObj.obj.name
    periodInput.value = classObj.obj.period
    classNameInput.classList.remove("invalid")
    periodInput.classList.remove("invalid")
    clearDiv(studentInfoInputs)
    for (const student of classObj.obj.students) {
      addStudentInputs(student)
    }
    setState(3, {id: classObj.obj.id})
  } else {
    statusTitle.innerText = "Create Class"
    classNameInput.value = ""
    periodInput.value = ""
    classNameInput.classList.remove("invalid")
    periodInput.classList.remove("invalid")
    deselectAllClasses()
    clearDiv(studentInfoInputs)
    setState(2)
  }
  switchSection(editClassSection)
}

function editGrouping(grouping) {
  if (grouping) {
    statusTitle.innerText = "Edit Group"
    clearDiv(ungroupedStudentsListDiv)
    clearDiv(groupScatter)
    console.log(state.info.id)
    for (const student of classes[state.info.id].obj.students) {
      const studentContainer = document.createElement("div")
      studentContainer.classList = "student-name-container"
      studentContainer.innerText = `${student.first} ${student.middle ? `${student.middle}. ` : ""}${student.last}`
      studentContainer.id = student.id
      studentContainer.addEventListener("click", () => {
        if (!state.info.student) {
          openAcceptStudent(studentContainer)
        }
      })
      ungroupedStudentsListDiv.appendChild(studentContainer)
    }
    setGroups(grouping.groups)
    groupNameInput.value = grouping.name
    switchSection(editGroupSection)
    setState(6, {id: state.info.id, groupingId: grouping.id})
  } else {
    statusTitle.innerText = "Create Group"
    clearDiv(ungroupedStudentsListDiv)
    clearDiv(groupScatter)
    for (const student of classes[state.info.id].obj.students) {
      const studentContainer = document.createElement("div")
      studentContainer.classList = "student-name-container"
      studentContainer.innerText = `${student.first} ${student.middle ? `${student.middle}. ` : ""}${student.last}`
      studentContainer.id = student.id
      studentContainer.addEventListener("click", () => {
        if (!state.info.student) {
          openAcceptStudent(studentContainer)
        }
      })
      ungroupedStudentsListDiv.appendChild(studentContainer)
    }
    groupNameInput.classList.remove("invalid")
    switchSection(editGroupSection)
    setState(5, {id: state.info.id})
  }
}

function addStudentInputs(student) {
  const studentInfoContainer = document.createElement("div")
  studentInfoContainer.classList = "student-info-container"
  studentInfoContainer.appendChild(createPlaceholderInput("First Name", "first-name-input", student ? student.first : ""))
  studentInfoContainer.appendChild(createPlaceholderInput("Last Name", "last-name-input", student ? student.last : ""))
  studentInfoContainer.appendChild(createPlaceholderInput("Middle Initial", "middle-initial-input", student ? student.middle : ""))
  studentInfoContainer.appendChild(createPlaceholderInput("ID", "student-id-input", student ? student.id : ""))
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

  if (state.mode == 2 && Object.keys(classes).includes(md5(classNameInput.value + periodInput.value))) {
    classNameInput.classList.add("invalid")
    periodInput.classList.add("invalid")
    return {valid: false, error: "Duplicate Class"}
  } else {
    classNameInput.classList.remove("invalid")
    periodInput.classList.remove("invalid")
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

function deleteClassFromDB(id) {
  return fetch("/deleteClass", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: auth2.currentUser.get().getAuthResponse().id_token
    },
    body: JSON.stringify({
      id: id
    })
  }).then(res => res.json())
}

async function deleteClass(id) {
  const deleteResult = await deleteClassFromDB(id)
  if (deleteResult.status) {
    classListDiv.removeChild(classes[id].element)
    delete classes[id]
    statusTitle.innerText = "Dashboard"
    switchSection(welcomeSection)
  } else {
    createError(deleteResult.error)
  }
}

function exitEditClass() {
  if (state.mode == 3) {
    showClass(state.info.id)
  } else {
    switchSection(welcomeSection)
    statusTitle.innerText = "Dashboard"
    setState(1)
  }
}

async function completeClassAdd() {
  const status = validateClassInputs()
  if (status.valid) {
    const classObj = constructClassFromManual()
    const saveResult = await saveNewClasses([classObj])
    if (saveResult.status) {
      for (const classObj of saveResult.newClasses) {
        addClass(classObj)
        exitEditClass()
      }
    } else {
      createError(saveResult.error)
    }
  } else {
    createError(status.error)
  }
}

async function completeClassEdit() {
  const status = validateClassInputs()
  if (status.valid) {
    const classObj = constructClassFromManual()
    const saveResult = await saveEditedClass(classObj)
    if (saveResult.status) {
      const oldClassElement = classes[state.info.id].element
      oldClassElement.children[1].innerText = `${saveResult.updatedClass.name} P${saveResult.updatedClass.period}`
      oldClassElement.id = saveResult.updatedClass.id
      delete classes[state.info.id]
      classes[saveResult.updatedClass.id] = {element: oldClassElement, obj: saveResult.updatedClass}
      exitEditClass()
      switchSection(welcomeSection)
    } else {
      createError(saveResult.error)
    }
  } else {
    createError(status.error)
  }
}

function deleteGroupFromDB(id, groupingId) {
  return fetch("/deleteGroup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: auth2.currentUser.get().getAuthResponse().id_token
    },
    body: JSON.stringify({
      id: id,
      groupingId: groupingId
    })
  }).then(res => res.json())
}

function saveNewGrouping(grouping, id) {
  return fetch("/addGrouping", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: auth2.currentUser.get().getAuthResponse().id_token
    },
    body: JSON.stringify({
      id: id,
      grouping: grouping
    })
  }).then(res => res.json())
}

async function completeGroupAdd() {
  const validateResult = validateGroups()
  if (validateResult.valid) {
    const grouping = constructGroupingFromUI()
    const saveResult = await saveNewGrouping(grouping, state.info.id)
    if (saveResult.status) {
      classes[state.info.id].obj.groupings.push(grouping)
      showClass(state.info.id)
      setState(4, {id: state.info.id})
    }
  } else {
    createError(validateResult.error)
  }
}


function saveEditedGrouping(grouping, oldId, id) {
  return fetch("/editGrouping", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: auth2.currentUser.get().getAuthResponse().id_token
    },
    body: JSON.stringify({
      id: id,
      oldId: id,
      grouping: grouping
    })
  }).then(res => res.json())
}

async function completeGroupEdit() {
  const validateResult = validateGroups()
  if (validateResult.valid) {
    const grouping = constructGroupingFromUI()
    const saveResult = await saveEditedGrouping(grouping, state.info.groupingId, state.info.id)
    if (saveResult.status) {
      addGroupingToList(grouping)
      classes[state.info.id].obj.groupings = classes[state.info.id].obj.groupings.filter(grouping => grouping.id != state.info.groupingId)
      classes[state.info.id].obj.groupings.push(grouping)
      showClass(state.info.id)
      setState(4, {id: state.info.id})
    }
  } else {
    createError(validateResult.error)
  }
}

function createPlaceholderInput(text, inputClassName, value="") {
  const labelContainer = document.createElement("label")
  labelContainer.classList = "label"
  const input = document.createElement("input")
  input.classList.add("input")
  input.classList.add(inputClassName)
  input.required = true
  input.value = value
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
saveClassBtn.addEventListener("click", async () => {
  if (state.mode == 2) {
    await completeClassAdd()
  } else if (state.mode == 3) {
    await completeClassEdit()
  }
})

editClassBtn.addEventListener("click", () => {
  editClass(classes[state.info.id])
})

deleteClassBtn.addEventListener("click", () => {
  deleteClass(state.info.id)
})

createGroupBtn.addEventListener("click", () => {editGrouping()})

saveGroupBtn.addEventListener("click", async () => {
  if (state.mode == 5) {
    await completeGroupAdd()
  } else if (state.mode == 6) {
    await completeGroupEdit()
  }
})

arrangeStudentsBtn.addEventListener("click", showArrangeStudentsModal)

addGroupBtn.addEventListener("click", addGroup)

cancelClassBtn.addEventListener("click", exitEditClass)
// })()
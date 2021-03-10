// Imports \\
const app = require('express')();
const http = require('http').createServer(app)
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const dotenv = require('dotenv').config()
const {OAuth2Client} = require('google-auth-library');
const oAuth2Client = new OAuth2Client(process.env.CLIENT_ID);
const crypto = require("crypto")

// Constants \\
const DBName = "data"

// Database \\
mongoose.connect(`mongodb+srv://GroupingApp:${process.env.DBPASS}@groupingapp.iz1de.mongodb.net/${DBName}?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection Error:'))
db.once('open', function() {
  console.log("Connected to Database")
})

//Schema
const userSchema = new mongoose.Schema({
  id: String,
  classes: [
    {
      id: String,
      name: String,
      period: Number,
      students: [
        {
          id: String,
          first: String,
          last: String,
          middle: String,
          preferences: [
            {
              name: String,
              type: Number,
              value: String
            }
          ]
        }
      ],
      groups: [
        {
          type: Number,
          groupings: [String]
        }
      ]
    }
  ]
})



const User = mongoose.model("User", userSchema)

// Express \\

app.use(bodyParser.json())

//Routing
app.get('/', async (req, res) => {
  res.sendFile(__dirname + '/static/index.html')
})

app.get("/login", async (req, res) => {
  const verification = await verifyUser(req.header("token"))
  const user = await User.findOne({id: verification.user.sub}).exec()
  if (verification.status && !user) {
    new User({id: verification.user.sub}).save((e) => {
      if (e) return console.log(e)
    })
    res.json({...verification, classes: []})
  } else {
    res.json({...verification, classes: user.classes})
  }
})

app.post("/addClasses", async (req, res) => {
  const verification = await verifyUser(req.header("token"))
  if (verification.status) {
    const newClasses = []
    for (const classObj of req.body.classObjs) {
      if (!await User.findOne({id: verification.user.sub, classes: {$elemMatch: {id: classObj.id}}}).exec()) {
        await User.updateOne({id: verification.user.sub}, {$push: {classes: classObj}})
        newClasses.push(classObj)
      }
    }
    if (newClasses.length) {
      res.json({status: true, newClasses: newClasses})
    } else {
      res.json({status: false, error: "All Duplicate Classes - Make sure you are uploading new classes"})
    }
  }
})

app.post("/editClass", async (req, res) => {
  const verification = await verifyUser(req.header("token"))
  if (verification.status) {
    const classObj = req.body.classObj
    const user = await User.findOne({id: verification.user.sub, classes: {$elemMatch: {id: req.body.oldId}}}).exec()
    if (user) {
      const existingClassObj = user.classes.find(c => c.id == req.body.oldId)
      existingClassObj.id = classObj.id
      existingClassObj.name = classObj.name
      existingClassObj.period = classObj.period
      existingClassObj.students = classObj.students
      await user.save()
      res.json({status: true, updatedClass: existingClassObj})
    } else {
      res.json({status: false, error: "The class you are editing does not exist - Please reload"})
    }
  }
})

app.post("/deleteClass", async (req, res) => {
  const verification = await verifyUser(req.header("token"))
  if (verification.status) {
    const user = await User.findOne({id: verification.user.sub, classes: {$elemMatch: {id: req.body.id}}}).exec()
    if (user) {
      user.classes.splice(user.classes.indexOf(user.classes.find(c => c.id == req.body.id)), 1)
      await user.save()
      res.json({status: true})
    } else {
      res.json({status: false, error: "No Class Found"})
    }
  }
})

app.use((req, res) => {
  res.sendFile(__dirname + req.url)
})

//Listen
http.listen(process.env.PORT, function(){
	console.log(`Server listening on *:${process.env.PORT}`)
})


async function verifyUser(token) {
  const ticket = await oAuth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID
  }).catch(e => {
    return {status: false}
  })
  return {status: true, user: ticket.getPayload()}
}


function makeGroupsByNumGroups(students, numGroups) {
  students = [...students]
  let groups = []
  for (let i = 0; i < numGroups; i++) {
    groups.push([])
  }

  let counter = 0
  while (students.length) {
    const randomIndex = Math.floor(Math.random() * students.length)
    groups[counter].push(students[randomIndex])
    students.splice(randomIndex, 1)
    counter = (counter+1) % groups.length
  }
  return groups
}

function makeGroupsByNumStudents(students, numStudents) {
  students = [...students]
  let groups = []
  let numGroups = Math.floor(students.length/numStudents)
  if ((students.length % numStudents > numStudents / 2 || students % numStudents > numGroups / 2)) {
    numGroups += 1
  }
  
  for (let i = 0; i < numGroups; i++) {
    groups.push([])
  }

  let counter = 0
  
  while (students.length) {
    const randomIndex = Math.floor(Math.random() * students.length)
    groups[counter].push(students[randomIndex])
    students.splice(randomIndex, 1)
    counter = (counter+1) % groups.length
  }
  
  const avg = groups.reduce((a, b) => a + b.length, 0) / groups.length
  console.log(avg)

  // if (avg > numStudents + 0.5 || avg < numStudents - 0.5) {
  //   console.log("weird")
  // }

  return groups
}




// mean the #s group > groups of x => warning

// greater > x => Warning


// < Half > Merge last group




/*
User Schema
{
  id: "user id",
  classes: [
    {
      name: "class name",
      period: "period number (as a string)",
      students: [
        {
          id: "student id",
          first: "first name",
          middle: "middle initial",
          last: "last name",
          preferences: [
            {
              name: "name of preference"
              type: integer representing type of preference (categorical, discrete, continuous),
              value: "value of preference" //may change because may not always be a string (ex. rate 1-5)
            }
          ]
        }
      ]
      groups: [
        {
          type: integer representing type of group (random etc),
          groupings: [["student id"]]
        }
      ]
    }
  ]
}
*/
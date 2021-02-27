// Imports \\
const app = require('express')();
const http = require('http').createServer(app)
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const dotenv = require('dotenv').config()
const {OAuth2Client} = require('google-auth-library');
const oAuth2Client = new OAuth2Client(process.env.CLIENT_ID);

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
      period: String,
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

app.post("/addClass", async (req, res) => {
  const verification = await verifyUser(req.header("token"))
  if (verification.status) {
    for (const classObj of classObjs)
    if (!await User.findOne({id: verification.user.sub, classes: {$elemMatch: {id: req.body.classObj.id, period: req.body.classObj.period}}}).exec()) {
      await User.updateOne({id: verification.user.sub}, {$push: {classes: req.body.classObj}})
      res.json({status: true})
    } else {
      res.json({status: false, error: "Error: Duplicate Class"})
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
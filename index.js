// Imports \\
const app = require('express')();
const http = require('http').createServer(app)
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const dotenv = require('dotenv').config()

// Constants \\
const DBName = "GroupingDB"
const URI = `mongodb+srv://GroupingApp:${process.env.DBPASS}@groupingapp.iz1de.mongodb.net/GroupingDB?retryWrites=true&w=majority`

// Express \\
app.use(bodyParser.json())

// '/' endpoint handling
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/index.html')
})

//serving files
app.use((req, res) => {
  res.sendFile(__dirname + req.url)
})

http.listen(3000, function(){
	console.log('listening on *:3000')
})


// Database \\


const client = new MongoClient(URI, { useNewUrlParser: true, useUnifiedTopology: true })
client.connect(err => {
  if (err) console.log(err)
  const collection = client.db("GroupingDB").collection("userData")
  collection.insertOne({id: 1, count: 5}, (err, res) => {
    if (err) console.log(err)
    else console.log(res)
  })
})
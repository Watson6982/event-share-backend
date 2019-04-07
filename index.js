const express = require('express')
const cors = require('cors')
const cookieSession = require('cookie-session')  
const bodyParser = require('body-parser')
const mongodb = require('mongodb')
const dotenv = require('dotenv')
const port = process.env.PORT || 3000

// Run before other code to make sure variables from .env are available
dotenv.config()

// creating an express instance
const app = express()

app.use(bodyParser.json())
app.use(cors())

// get events
app.get('/api', async (req, res) => {
    const events = await loadPostsCollection()
    res.send(await events.find({}).toArray())
})

//add event
app.post('/api', async (req, res) => {
    const events = await loadPostsCollection()
    await events.insertOne({
        text: req.body.text,
        createdAt: new Date()
    })
    res.status(201).send() // successful
})

//delete event
app.delete('/api/:id', async (req,res) => {
    const events = await loadPostsCollection()
    await events.deleteOne({_id: new mongodb.ObjectId(req.params.id)})
    res.status(200).send() // successful
})

async function loadPostsCollection() {
    const client = await mongodb.MongoClient.connect(process.env.MONGO_DB_URL, {
        useNewUrlParser: true
    })
    return client.db('note_app').collection('events')
}

// run the server
app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`)
})
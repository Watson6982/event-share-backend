const express = require('express')
const cors = require('cors')
const cookieSession = require('cookie-session')  
const bodyParser = require('body-parser')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const mongodb = require('mongodb')
const dotenv = require('dotenv')
const port = process.env.PORT || 3000

// Run before other code to make sure variables from .env are available
dotenv.config()

// creating an express instance
const app = express()

app.use(passport.initialize())
app.use(passport.session())
app.use(bodyParser.json())
app.use(cors())

// Divert http traffic to https
if(process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https')
      res.redirect(`https://${req.header('host')}${req.url}`)
    else
      next()
  })
}

// get events
app.get('/api', async (req, res) => {
    const events = await loadCollection('events')
    res.send(await events.find({}).toArray())
})

//add event
app.post('/api', async (req, res) => {
    const events = await loadCollection('events')
    await events.insertOne({
        text: req.body.text,
        createdAt: new Date()
    })
    res.status(201).send() // successful
})

//delete event
app.delete('/api/:id', async (req,res) => {
    const events = await loadCollection('events')
    await events.deleteOne({_id: new mongodb.ObjectId(req.params.id)})
    res.status(200).send() // successful
})

// load events
async function loadCollection(collection) {
    const client = await mongodb.MongoClient.connect(process.env.MONGO_DB_URL, {
        useNewUrlParser: true
    })
    return client.db('note_app').collection(collection)
}

// login
app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err)
        }
        if (!user) {
            return res.status(400).send([user, 'Cannot log in', info])
        }
        req.login(user, err => {
            res.send('Logged in')
        })
    })(req, res, next)
})

//logout
app.get('/api/logout', function(req, res) {  
    req.logout()
    console.log('logged out')
    return res.send();
})

// middleware
const authMiddleware = (req, res, next) => { 
  if (!req.isAuthenticated()) {
    res.status(401).send('You are not authenticated')
  } else {
    return next()
  }
}

// get user
app.get('/api/user', authMiddleware, (req, res) => {
    let user = users.find(user => {
      return user._id == req.session.passport.user
    })
    console.log([user, req.session])
    res.send({ user: user })
})

// passport configuration
passport.use( new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  async (username, password, done) => {
    var x = await loadCollection('app_user')
    users = await x.find({}).toArray()
    let user = await users.find((user) => {
      return user.email === username && user.password === password
    })
    if (user) {
      done(null, user)
    } else {
      done(null, false, { message: 'Incorrect username or password'})
    }
  }
))

passport.serializeUser((user, done) => {  
    console.log('serializing user')
    done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
    var x = await loadCollection('app_user')
    users = await x.find({}).toArray()
    console.log('deserializing user') 
    let user = await users.find((user) => {
      console.log(user._id)
      console.log(id)
      console.log(user._id == id)
      return user._id == id
    })
    done(null, user)
})

// run the server
app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`)
})
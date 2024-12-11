const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const userSchema = new mongoose.Schema({
  username: String
})
const exerciseSchema = new mongoose.Schema({
  userId: String,
  username: String,
  description: String,
  duration: Number,
  date: String
})
const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)

app.get('/api/users', async (req, res) => {
  User.find({}).exec().then(data => {
    res.json(data)
  })
})

app.post('/api/users', (req, res) => {
  const newUser = new User({ username: req.body.username })
  newUser.save().then(() => {
    res.json(newUser)
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const userid = req.params._id
  const description = req.body.description
  const duration = +req.body.duration
  const date = req.body.date || new Date().toISOString().substring(0, 10)
  User.findById(userid).then((user) => {
    const newExercise = new Exercise({
      userId: user._id,
      username: user.username,
      duration, description, date
    })
    newExercise.save().then(() => {
      res.json({
        username: user.username,
        _id: user._id,
        description: newExercise.description,
        duration: newExercise.duration,
        date: new Date(newExercise.date).toDateString()
      })
    })
  })
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const userid = req.params._id;
  const from = req.query.from || new Date(0).toISOString().substring(0, 10);
  const to = req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
  const limit = Number(req.query.limit) || 0;

  const user = await User.findById(userid).exec();
  const exercises = await Exercise.find({
    userId: userid,
    // date: { $gte: from, $lte: to },
  }).select('description duration date')
    .limit(limit)
    .exec()
  const formatExercises = exercises.map(exer => ({
    description: exer.description,
    duration: exer.duration,
    date: new Date(exer.date).toDateString()
  }))

  res.json({
    _id: user._id,
    username: user.username,
    count: formatExercises.length,
    log: formatExercises
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

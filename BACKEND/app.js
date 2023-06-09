const https = require("https");
const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors')

//for cookies
const cookieParser = require("cookie-parser");

//for session
const session = require("express-session");
const MongoDBSession = require("connect-mongodb-session")(session); //to store session info in mongo db

//for env
require("dotenv").config();

const store = new MongoDBSession({
  uri: "mongodb://localhost:27017/quiz",
  collection: "session",
});

//router
const userRouter = require("./routes/users");
const quizRouter = require("./routes/quiz");
const uploadRouter = require("./routes/upload");

//Middlewares
const logger = require("./middlewares/logger");

const PORT = process.env.PORT;
const app = express();

//enabling ssl
var options = {
  key: fs.readFileSync(__dirname + "/private.key"),
  cert: fs.readFileSync(__dirname + "/certificate.pem"),
};
const server = https.createServer(options, app);

//enabling cors
app.use(cors({
  origin: ['https://localhost:3000','https://www.example.com'],
  methods: ['GET','POST','PUT','PATCH','DELETE']
}))

//Connecting database
mongoose
  .connect("mongodb://localhost:27017/quiz")
  .then(() => {
    server.listen(PORT, () =>
      console.log(`Express app runniing on https://localhost:${PORT}`)
    );
  })
  .catch((err) => console.log("Err: ", err.message));

app.use(express.urlencoded({ extended: true })); // Middleware required to submit form data

app.use(express.json()); //Middleware to parse json body received in request.

// app.use(cookieParser("1234-5678")); //Middleware to parse cookie (cookie is singned user provided key)

app.use(
  session({
    secret: process.env.SESSION_SECRET, //for signing cookie
    resave: false, // if there is no change in session it will not resave in database
    saveUninitialized: false, //Doesn't save set bu uninitialized session
    store: store, //defined above (This is where session info stores in db)
  })
);
app.use(express.static("public")); //Middleware to make public folder to serve static content

//Custom middleware

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

//External custom middleware that runs only in development environment
if (app.get("env") == "development") {
  app.use(logger);
}

app.get("/", (req, res) => {
  res.status(200).send({ status: "Server is running" });
});
app.options('/',(req,res)=>{
  res.sendStatus(204)
})

app.use("/api/users", userRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/upload", uploadRouter);

// app.get('/api/greet', (req,res)=>{
//     res.send({msg:'Hello Everyone'})
// })

// app.get('api/greet/:name',(req,res)=>{
//     const name = req.params.name;
//     res.send({msg:`Hello ${name}! Good Morning`})
// })

// app.post('api/courses',(req,res)=>{
//     const course =req.body;
//     res.send(course);
// })

// app.get('api/search',(req,res)=>{
//     const query =request.query
//     console.log(query.id)
// })

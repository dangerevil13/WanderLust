if(process.env.NODE_ENV !="production"){
  require('dotenv').config()
  
}
// console.log(process.env.CLOUD_API_KEY);
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate =require("ejs-mate");
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const listingsRouter = require("./routes/listing.js");
const reviewsRouter =require("./routes/review.js");
const userRouter =require("./routes/user.js");
const session =  require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport =require("passport");
const LocalStrategy = require("passport-local");
const User =require("./models/user.js")
const ExpressError = require('./utils/ExpressError.js');
const wrapAsync =require('./utils/wrapAsync.js');
const { error } = require('console');

const dbURL = process.env.ATLASTDB_URL

const store = MongoStore.create({
  mongoUrl:dbURL,
  crypto:{
    secret:process.env.secret
  },
  touchAfter: 24*3600,
});

store.on("error",()=>{
 console.log("err in mongo store",err);
})
const sessionOptions = {
store,
secret:process.env.secret,
resave : false,
saveUninitialized:true,
cookie :{
  expires : Date.now()+1000*60*60*24*3,
  maxAge : 1000*60*60*24*7,
  httpOnly : true
},
};

app.use(express.static(path.join(__dirname, "/public")));

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbURL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) =>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser =req.user;
  next();
})
app.get("/demouser",async(req,res) =>{
  let fakeUser = new User({
email:"abc@gmail.com",
username:"abc"
  });
  let registeredUser = await User.register(fakeUser,"helloworld");
  res.send(registeredUser);
})

// Body parser to handle form data
app.use(express.urlencoded({ extended: true }));


app.use('/listings', listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);


// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute, Goa",
//     country: "India",
//   });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
    let {statusCode=505, message="Something went wrong!"} = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("Error.ejs",{message});
});


app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
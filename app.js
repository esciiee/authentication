//jshint esversion:6s
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate =  require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded( {extended : true} ));
app.use(express.static("public"));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    active: Boolean,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
}))

app.get('/', function(req, res) {
    res.render("home"); 
});

app.get('/auth/google', passport.authenticate('google', { scope : ["profile"] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.render('secrets');
});

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
})


app.get('/register', function(req, res) {
    res.render("register"); 
});

app.get('/login', function(req, res) {
    res.render("login"); 
});

app.get('/logout', function(req, res){
    req.logout(function(err){
        if (err){
            res.send(err);
        }else{
            res.redirect('/');
        }
    });
});

app.get('/secrets', function(req, res){
    User.find({ secret: { $ne: null}}).then(function(foundUsers){
        res.render("secrets", {foundUsers: foundUsers});
    }).catch(function(err) {
        console.log(err);
        res.redirect('/login'); // Handle error by redirecting to the login page
      });
  
});

app.get('/submit', function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})

app.post('/register', function(req, res){

    User.register({username : req.body.username}, req.body.password, function(err, user) {
        if (err) { 
            res.redirect("/");
         }
      
        const authenticate = User.authenticate();
        authenticate(req.body.username, req.body.password, function(err, result) {
          if (err) { 
            res.send("error, try again");
           }else{
            res.redirect("/secrets");
           }
      
          // Value 'result' is set to false. The user could not be authenticated since the user is not active
        });
      });
    
});

app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect("/secrets");
  });

app.post('/submit', function(req, res){
    User.findByIdAndUpdate({_id: req.user.id}, {secret: req.body.secret}).then(function(){
        res.redirect('/secrets');
    });
});

app.listen(3000, function() {
    console.log('the server has started running on port 3000');
});



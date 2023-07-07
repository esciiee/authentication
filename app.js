//jshint esversion:6s
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded( {extended : true} ));
app.use(express.static("public"));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true }
  }))
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    active: Boolean
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', function(req, res) {
    res.render("home"); 
});

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
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

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
            res.render("secrets");
           }
      
          // Value 'result' is set to false. The user could not be authenticated since the user is not active
        });
      });
    
});

app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.render("secrets");
  });



app.listen(3000, function() {
    console.log('the server has started running on port 3000');
});
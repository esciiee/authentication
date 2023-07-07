//jshint esversion:6s
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");
const md5 = require("md5");

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded( {extended : true} ));
app.use(express.static("public"));

app.get('/', function(req, res) {
    res.render("home"); 
});

app.get('/register', function(req, res) {
    res.render("register"); 
});

app.get('/login', function(req, res) {
    res.render("login"); 
});

app.post('/register', function(req, res){
    const userEmail = req.body.username;
    const userPassword = md5(req.body.password);
    const newUser = new User({
        email: userEmail,
        password: userPassword
    });
    newUser.save();
    res.render("secrets");
});

app.post('/login', function(req, res){
    const userEmail = req.body.username;
    const userPassword = md5(req.body.password);
    User.findOne({ email: userEmail}).then(function(foundUser){
        if (foundUser){
            if (foundUser.password === userPassword){
                res.render("secrets")
            }else{
                res.send("wrong password, Tap here to change password");
            }
        }else{
            res.send("User does not exits, Tap here to register");
        }
    });
});

app.listen(3000, function() {
    console.log('the server has started running on port 3000');
});
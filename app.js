//jshint esversion:6s
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");
const bcrypt = require('bcrypt');
const saltRounds = 10;

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
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if (err){
            res.send(err);
        }else{
        const userEmail = req.body.username;
        const userPassword = hash;
        const newUser = new User({
            email: userEmail,
            password: userPassword
    });
    newUser.save();
    res.render("secrets");
        }
    });
});

app.post('/login', function(req, res){
    const userEmail = req.body.username;
    const userPassword = req.body.password;
    User.findOne({ email: userEmail}).then(function(foundUser){
        bcrypt.compare(userPassword, foundUser.userPassword, function(err, result) {
            if(result){
                res.render("secrets");
            }else{
                res.send("wrong password, tap here to change password");
            }
        });
    });
});

app.listen(3000, function() {
    console.log('the server has started running on port 3000');
});
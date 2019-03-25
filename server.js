var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./authjwt');
var jwt = require('jsonwebtoken');

const MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');

var User = require('./Users');
var Movie = require('./movies');

var app = express();

let mdb;

const port = process.env.PORT || 8080;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

router.route('/movies')
    .post(authJwtController.isAuthenticated, function (req, res) {

        Movie.find({Title: req.body.Title}, function(err, data){
            if(err){
                res.status(400).json({message: "Invalid query"});
            }else if(data.length == 0) {
                let mov = new Movie({
                    Title: req.body.Title,
                    Year: req.body.Year,
                    Genre: req.body.Genre,
                    Actors: req.body.Actors
                });

                console.log(req.body);


                mov.save(function(err){
                    if(err) {
                        res.json({message: err});
                    }else{
                        res.json({msg: "Successfully saved"});
                    }

                });
            }else{
                res.json({message: "Movie already exists"});
            }

        });
        }
    )
    .get(authJwtController.isAuthenticated, function (req, res) {
            Movie.find({Title: req.body.Title}, function(err, data){
                if(err){
                    res.status(400).json({message: "Invalid query"});
                }else if(data.length == 0) {
                    res.status(400).json({message: "No entry found"});
                }else{
                    res.json({data: data, message: "Movie Found"});
                }

            });
        }
    )
    .put(authJwtController.isAuthenticated, function(req,res) {
        console.log(req);

        Movie.findOneAndUpdate({Title:req.body.Search},
            {
                Title: req.body.Title,
                Year: req.body.Year,
                Genre: req.body.Genre,
                Actors: req.body.Actors

            },function(err, doc){
                if(err){
                    res.json({message: err});
                }
                else if (doc == null){
                    res.json({message:"Movie Not Found"})
                }else{
                    res.json({data: doc, message:"Movie Updated"})
                }
            });
    })
    .delete(authJwtController.isAuthenticated, function(req,res){
            Movie.findOneAndDelete({Title: req.body.Title}, function(err, doc){
                if(err){
                    res.status(400).json({message:err});
                }
                else if (doc == null){
                    res.json({message: "Movie not found"});
                }
                else{
                    res.json({message: "Movie deleted"});
                }

            });
    });

/*
router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please pass username and password.'});
    } else {

        if (db.findOne(req.body.username)){
            res.status(400).json({success: false, msg: "Username already exists"});
        }

        var newUser = {
            username: req.body.username,
            password: req.body.password
        };
        // save the user
        db.save(newUser); //no duplicate checking
        res.json({success: true, msg: 'Successful created new user.'});
    }
});

router.post('/signin', function(req, res) {
    var user = db.findOne(req.body.username);

    if (!user) {
        res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
    }
    else {
        // check if password matches
        if (req.body.password == user.password)  {
            var userToken = { id : user.id, username: user.username };
            var token = jwt.sign(userToken, process.env.SECRET_KEY);
            res.json({success: true, token: 'JWT ' + token});
        }
        else {
            res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
    }
});

*/

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });


    });
});


router.all('*', function(req, res) {
    res.json({error: 'Not supported HTTP method'});
});

app.use('/', router);
app.listen(port);
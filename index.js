var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require('body-parser');
var session = require('express-session')
var flash = require('connect-flash');

app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use(express.static(__dirname + "/public"));

//body parser
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

//flash messages
app.use(require("express-session")({
    secret: "Secret secret ding dong pong?",
    resave:false,
    saveUninitialized: false
}));
app.use(flash());
app.use(function(req,res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
app.set("view engine", "ejs");

//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
mongoose.connect('mongodb://localhost:27017/exercise', {useNewUrlParser: true});
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var Schema = mongoose.Schema;

var exerciseSchema = new Schema({
    description: String,
    duration: String,
    date: String
})
var Exercise = mongoose.model("Exercise", exerciseSchema);

var usersSchema=new Schema({
    username: String,
    password: String,
    exercise: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exercise"
        }
    ]
})
//define the model:

var User = mongoose.model('User', usersSchema);



app.get("/", function(req, res){
    res.render("landing");
})

app.post("/api/exercise/new-user", function(req, res){

    User.findOne({username:req.body.username},function(err, found){
        if(err) return handleError(err);
        if(found!=null){
            res.json({"error":"username taken"});
        } else{

    User.create({username: req.body.username, password: req.body.password}, function(err, newUser){
        if(err){ console.log(err)}else{
            res.json({"_id": newUser._id, "username": newUser.username})
        }
    })
}
    })
    
})

app.get("/api/exercise/users",function(req, res){

    User.find(function(req,found){
        res.json(found)
    })
})

app.post("/api/exercise/add", function(req, res){
    if(req.body.date==""){
        var d = new Date();
    }else{ var d= new Date(req.body.date)}
    var date = d.getDate();
    var month = d.getMonth() + 1; // Since getMonth() returns month from 0-11 not 1-12
    var year = d.getFullYear();
    var dateStr = date + "-" + month + "-" + year;
    

    User.findOne({_id:req.body.userID}, function(err, found){
        if(err){ return handleError(err)}
        else{
            Exercise.create({ description: req.body.description,
                duration: req.body.duration, date: dateStr}, function(err, newExercise){
                    if(err){ return handleError(err)}
                    else{
                        found.exercise.push(newExercise)
                        found.save();
                        res.json(found)
                    }
                })
        }
    })
})

/*User.create({username:'alex', password:'l'}, function(err, user){
    if(err){ console.log(err)}
    else{
        Exercise.create({
            description:'running', duration:'30',
            reps:3, date:'11-11-2020'
        }, function(err, exercise){
            if(err){ console.log(err)}
            else{
                user.exercise.push(exercise);
                user.exercise.push(exercise);
                user.save();
            }
        })
    }
})*/

app.listen(process.env.PORT || 3000, function(req, res){
    console.log("Server started!");
})
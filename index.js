var express = require("express");
var app = express();
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
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
    reps: Number,
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

usersSchema.plugin(passportLocalMongoose)
var User = mongoose.model('User', usersSchema);
//passport config
app.use(require("express-session")({
    secret: "Garfielddd!",
    resave: false,
    saveUnitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

app.get("/", function(req,res){
    res.render("landing.ejs",{message: req.flash("error")})
})

app.get("/signup", function(req, res){
    res.render("signup",{message: req.flash("error")});
})

app.post("/api/exercise/new-user", function(req,res){
    //req.body.username .password

    User.findOne({username:req.body.username},function(err, found){
        /*if(err) return handleError(err);
        console.log("i am here!: "+ found)
        if(found!=null){
            res.render("signup", {message: "username taken"},);
        } else{*/
           /* User.create({username: req.body.username, password: req.body.password}, function(err, newCreated){
                if(err) return handleError(err);
                console.log(req.body.username)
                res.render("landing", {message: "account created! please login"},);
            })*/
            var newUser = new User({username: req.body.username})
            User.register(newUser, req.body.password, function(err, user){
                if(err){
                    console.log(err);
                    res.render("signup", {message: "username taken"},)
                }
                passport.authenticate("local")(req, res, function(){
                    res.render("landing.ejs",{message: "account created! please login"})
                })
            })
            
        
    })
   
    console.log("hit the post route")
    
})

app.get("/api/exercise/users", function(req, res){
    User.find(function(req, found){
        res.render("users", {user:found});
    })
})

app.get("/testing", function(req, res){
    User.find().populate("exercise").exec(function(err, foundUsers){
        if(err){ console.log(err)}
        else{
            res.render("this", {user: foundUsers})
        }
    })
})

app.post("/api/exercise/log",passport.authenticate("local",
{
    successRedirect: "/api/exercise/log",
    failureRedirect:"/"
}), function(req, res){
    
    /*User.find({username:req.body.username},function(err, found){
        if(err) return handleError(err);
        console.log("here found: "+found)
        if(found==null || found[0]==null){
            res.render("landing", {message: "wrong username or password"},);
        }else if(req.body.username==found[0].username && req.body.password==found[0].password)
        {
            res.render("workout.ejs", {user:found});
        }  else{
            res.render("landing", {message: "wrong username or password"},);
        }
    })
    console.log("hit the post route")*/


})

//logout route
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
})

app.get("/api/exercise/add", function(req, res){

    res.render("landing")
 })


/*app.get("/api/exercise/log", function(req, res){

    //get the username and reupdate the page with the newest data.
    var passedVariable = req.query.valid;

    User.find({username: passedVariable},function(err, found){
        if(err) return handleError(err);
        res.render("workout.ejs", {user:found});
    })
   
})*/

app.post("/api/exercise/add", (req, res)=>{

    if(req.body.date==""){
        var d = new Date();
    }else{ var d= new Date(req.body.date)}
    var date = d.getDate();
    var month = d.getMonth() + 1; // Since getMonth() returns month from 0-11 not 1-12
    var year = d.getFullYear();
    var dateStr = date + "-" + month + "-" + year;
    
   User.find({username: req.body.username}, function(err, allNew){
       User.create({username: req.body.username, password: req.body.password,
            description: req.body.description, duration: req.body.duration, date: dateStr, reps:req.body.reps},
             function (err, newCreated){
                if(err) return handleError(err);
                console.log(req.body.username)
                
            })
          res.redirect("/api/exercise/log?valid="+req.body.username)  //pass the username
    })
   
})

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/");
}

app.listen(process.env.PORT || 3000, function(req, res){
    console.log("Server started!");
})
var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require('body-parser');
var session = require('express-session')

app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use(express.static(__dirname + "/public"));


const uri = "mongodb+srv://alex:1234@cluster0-ojxlg.mongodb.net/<dbname>?retryWrites=true&w=majority"
mongoose.connect(uri, {  useNewUrlParser: true,  useUnifiedTopology: true})
.then(() => {  console.log("mongoDB connected...")})
.catch(err => console.log(err))


//body parser
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

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
    date: Date
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
    res.render("landing",{usid:req.params.usid});
})

app.post("/api/exercise/new-user", function(req, res){

    let { username } = req.body;

    User.findOne({username:req.body.username},function(err, found){
        if(err) return handleError(err);
        if(found!=null){
            res.json({"error":"username taken"});
        } else{

    User.create({username: req.body.username}, function(err, newUser){
        if(err){ console.log(err)}else{
            const { _id, username } = newUser
            res.json({username, _id})
        }
    })
}
    })
    
})

app.get("/api/exercise/users",function(req, res){

    User.find({})
    .select("_id username")
    .exec((err, users) => {
        res.json(users)})
})

app.post("/api/exercise/add", function(req, res){
    if(req.body.date==""){
        var d = new Date();
    }else{ var d= new Date(req.body.date)}
    User.findOne({_id:req.body.userID}, function(err, found){
        if(err){ return handleError(err)}
        else{
            Exercise.create({ description: req.body.description,
                duration: req.body.duration, date: d}, function(err, newExercise){
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

app.get("/api/exercise/log/:userID/:from?/:to?/:limit?", function(req, res){
    console.log(req.params.userID)
    var count = 0;
    var arr =[]
    if(req.params.from!=null  && req.params.to!=null & req.params.limit!=null){
        console.log("not null")

        User.findOne({_id: req.params.userID}, function(err, found){
            if(err){ handleError(err)}
            else{
                let results = found.exercise;
                console.log("FOUND.EXERCISES !!! :  " + results)
                let fromDate = new Date(req.params.from);
                let toDate = new Date(req.params.to);
                let limit = Number(req.params.limit);
                    Exercise.find({_id: {$in: results}}, function(err, foundEx){
                        if(err){ handleError(err)}
                        else{
                        console.log(foundEx)
                       var final= foundEx.filter(function(ex){
                           return ex.date< toDate && ex.date>=fromDate
                       })
                       res.send({"exercise":final});
                        }
                        console.log("here is filtered: " + final);
                    })
                
                }
            })
        } else{
        console.log("is null")
    }
   
})

app.post("/getid", function(req, res){
    User.findOne({username:req.body.usid}, function(err, found){
        if(err) {handleError(err)} else{
            console.log(found)
            if(found==null){
                res.json({"error":"username not in database"});
            }else{
                res.json({"username": found.username, "id": found._id})
            }
        }
    })
})

app.listen(process.env.PORT || 3000, function(req, res){
    console.log("Server started!");
})
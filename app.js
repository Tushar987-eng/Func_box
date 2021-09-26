require('dotenv').config();
const express= require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose = require("mongoose");
const session=require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/funcDB",{useNewUrlParser:true});

const funcSchema=new mongoose.Schema({
    email:String,
    password:String,
    bucket:String,
    secrets:[String]
});

funcSchema.plugin(passportLocalMongoose);

const Func=new mongoose.model("Func",funcSchema);

passport.use(Func.createStrategy());

passport.serializeUser(Func.serializeUser());
passport.deserializeUser(Func.deserializeUser());

app.get("/",function(req,res){
    res.render("home");
});
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});

app.get("/list",function(req,res){
    Func.findById(req.user.id,function(err,foundUsers){
        if(err){
            console.log(err);
        }
        else{
            if(foundUsers){
                res.render("list",{userwithSecrets:foundUsers});
            }
        }
    })
});

app.post("/login",function(req,res){
    const func=new Func({
        username:req.body.username,
        password:req.body.password
    });
    req.login(func,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});
app.post("/register",function(req,res){
    Func.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/submit",function(req,res){
    const id=req.user.id;
    Func.findById(id,function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.bucket=req.body.bucket;
                foundUser.secrets.push(req.body.secret);
                foundUser.save(function(){
                    res.redirect("/list");
                });
            }
        }
    });
});
app.listen(3000,function(){
    console.log("Server Started on port 3000");
});
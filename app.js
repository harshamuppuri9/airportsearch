//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const Grid = require('gridfs-stream');
const mime = require('mime');
const mongoose = require("mongoose");
const app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var path1 = require("path");

var posts = require('./views/posts');
var comments = require('./views/comments');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

var mongo = require('mongodb');
var filesrc = path1.join(__dirname, "./images");

//database
const path = "mongodb://localhost:27017/main";
mongoose.connect("mongodb://localhost:27017/main", {
  useNewUrlParser: true
});
const conn = mongoose.createConnection("mongodb://localhost:27017/main");
let gfs;
conn.once('open',() => {
  gfs = Grid(conn.db,mongoose.mongo);
});

//Airport Schema
const airportsSchema = {

  loc: {
    type: {
      type: String
    },
    coordinates: {
      type: Array
    }
  },
  Data: String,
  airport: String,
  city: String,
  state: String,
  country: String,
  lat: String,
  long: String,

};

var airport = mongoose.model("airports", airportsSchema);

let locationsList=[];
let images=[];
var image;
var imgId = 0;
var post = [];
var docID;
const item2 = "test";
var l1 = [];
var temp = [];
var ll1 = 0,ll2 = 0;
let distance = 10000;
const min = 1;
const max=26;
var details=[];


//Get home page
app.get("/", function(req, res) {

  console.log("length after " +locationsList.length);
  res.render("list", {listTitle: "Nearest Airport Search",newListItems: locationsList});

});


//Post from home page
app.post("/", function(req, res) {

  var cityName = req.body.newItem;
  var stateName = req.body.newState;
  console.log(" ..." + cityName);
    console.log("state "+stateName);
  airport.findOne({
    $and: [{
      "city": cityName
    }, {
      "country": "USA"
    }, {
      "state": stateName
    }]
  }, {
    _id: 0,
    loc: 1,
    airport: 1
  }, function(error, result) {

   console.log("result"+result);

   console.log(result.loc.coordinates);
    temp = result.loc.coordinates;
    //console.log("temp", temp);
    const x=0,y=1;
    for (var l in temp) {
      console.log("l.." +l );
      l1.push(temp[l]);
      if (l == 0) {
        //ll1 = Number((temp[l].toFixed(1)));
        ll1 = temp[l];
      } else {
        //ll2 = Number((temp[l].toFixed(1)));
        ll2 = temp[l];
      }
    }
    console.log("cor : " + ll1+"..."+ll2);


  airport.find({
    loc: {
      $near: {
        $geometry: {
          type: "point",
          coordinates: [ll1, ll2]
        },
        $maxDistance: distance
      }
    }
  }, {
    _id: 1,
    loc: 1,
    airport: 1
  }, function(error, result) {

    if (error) {
    //  res.render("list", {listTitle: "Airport Search",newListItems: locationsList});
    } else {
    console.log("found : " +  result);

       var data = JSON.stringify(result);
      for (var myKey in result) {
        console.log("key:" + myKey + ", value:" + result[myKey]);

        value = result[myKey];


        locationsList.push(value);
        console.log("length after " +locationsList.length);
          }
         }
         res.render("list", {listTitle: "Airport Search",newListItems: locationsList});
        });
  });
});


//get Airport page
app.get("/airport/:ID",function(req,res){
//res.render("about",{image:image});
//console.log("test" + req.params.ID);
details=[];
docID = req.params.ID;
console.log("test" + typeof docID);
airport.find({_id:docID},function(err,results){
    if(err){
        console.log(err);
    }else{
    //  console.log(results);

     for (var myKey in results) {
      // console.log("key:" + myKey + ", value:" + posts[myKey]);

       value = results[myKey];

       details.push(value);
       console.log( "valuessss:"+ value);
    }

    //res.render('about',{image:image,posts:post});
  // res.redirect("/comment");
  }
});
 res.redirect("/comment");
});


//post from airport page
app.post("/airport/:ID",function(req,res){

console.log("params :"+req.params.ID);
imgId = Math.round(Math.random() * (max - min) + min);
console.log("random :"+imgId );

gfs.files.find({filename:"p"+imgId+".JPEG"}).sort({n:1}).toArray((error,file) =>{
    if(!file || file.length===0){
      console.log("No files");
    }else{
    console.log(JSON.stringify(file));
      var text = JSON.stringify(file);
  var json = JSON.parse(text);
  //console.log("...."+json[0]._id);
  var id =json[0]._id;
  //console.log("id" + id);
var o_id = new mongo.ObjectID(json[0]._id);
  console.log("id: "+ json[0].filename);

    let data = [];

    let readStream = gfs.createReadStream({
        filename:json[0].filename
    });


    readStream.on('data',function(chunk){
          data.push(chunk);
    });

    readStream.on('end', function(){
        data = Buffer.concat(data);
       img = 'data:image/png;base64,'+Buffer(data).toString('base64');
        //res.end(img);

        image= img;
        //  console.log(image);
        images.push(img);
          res.redirect("/airport/"+req.params.ID);
    });

    readStream.on('error', function(err){
        console.log('An error occurred',err);
        throw err;
    });
//res.redirect("/airport");
    }
});
});

//Get comments
app.get("/comment",function(req,res){
    console.log("ID..." +docID);
    post=[];
  posts.find({"Comment_ID":docID},function(err,posts){
      if(err){
          console.log(err);
          console.log("Nothing found");
      }else{
        //console.log(posts);

       for (var myKey in posts) {
        // console.log("key:" + myKey + ", value:" + posts[myKey]);

         value = posts[myKey];

         post.push(value);
         console.log( "value in /comment:"+ value);
      }

       res.render('about',{image:image,details:details,posts:post});
    }
  },{
    _id: 1,
    Comment_ID: 1,
    Comments: 1
  });
});

//post from airport page(comments)
app.post("/comment",function(req,res){

var ids=docID;

var text2 = req.body.newComment;
  console.log("ids"+ ids);
  console.log("text"+ text2);

  var newComment = new posts({
      Comment_ID:ids,
      Comments:text2
  });

  newComment.save(function(error,result){
      if(error){
          console.log("Couldnt insert");
      }else{
        console.log("Success");

      }
  });
  // post=[];
  // posts.find({"comment_id":docID},function(err,posts){
  //     if(err){
  //         console.log(err);
  //         console.log("Nothing found");
  //     }else{
  //       //console.log(posts);
  //
  //      for (var myKey in posts) {
  //       // console.log("key:" + myKey + ", value:" + posts[myKey]);
  //
  //        value = posts[myKey];
  //
  //        post.push(value);
  //        console.log( "comments values"+ value);
  //     }
  //
  //      res.render('about',{image:image,posts:post});
  //   }
  // });
  res.redirect("/comment");
 });

app.listen(3000, function() {
  console.log("Server started on port 3000");
});






//Notes:
// db.posts.insertOne({"comment_id":docID,"text":req.body.newComment});
//db queries:
//db.airports.findOne({$and:[{"city":"Rochester"},{"country":"USA"},{"state":"NY"}]},{_id:0,loc:1,airport:1});
//
// db.airports.find({
//   loc:
//   {$near:
//     {
//     $geometry: {
//         coordinates: [-70.92925472,43.28406194]
//           },
//
//         }}},
// {_id:1,loc:1,airport:1});

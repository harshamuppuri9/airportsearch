var mongoose = require('mongoose');
var Schema = mongoose.Schema,
ObjectId = Schema.Schema;
var Posts = new Schema({

  Comment_ID : String,
  Comments:String
});
module.exports = mongoose.model("Posts",Posts);

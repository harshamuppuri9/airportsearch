var mongoose = require('mongoose');
var Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;
var Comments = new Schema({
  Comments : String,
  PostId : String
});
module.exports = mongoose.model("Comments",Comments);

/**
 * Created by zhengyuan on 2017/4/18.
 */
var mongoose = require('mongoose');
var CommentSchema = new mongoose.Schema({
    body:String,
    author:String,
    upvotes:{type:Number,default:0},
    date: String,
    authorNick:String,
    authorImage:String,
    post:{type:mongoose.Schema.Types.ObjectId, ref:'Post'}
});

CommentSchema.methods.upvote = function (cb) {
    this.upvotes += 1;
    this.save(cb);
};

mongoose.model('Comment',CommentSchema);
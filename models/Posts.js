/**
 * Created by zhengyuan on 2017/4/18.
 */

var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var PostSchema = new mongoose.Schema({
    title:String,
    link:String,
    body:String,
    author:String,
    authorNick:String,
    authorImage:String,
    date:String,
    upvotes:{type: Number, default:0},
    comments:[{ type: mongoose.Schema.Types.ObjectId, ref:'Comment'}]
});

PostSchema.methods.upvote = function (cb) {
    this.upvotes += 1;
    this.save(cb);
};



mongoose.model('Post',PostSchema);

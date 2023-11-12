const mongoose = require("mongoose");
// change the mongodb path
mongoose.connect("mongodb://0.0.0.0:27017/virtual-reality", { useNewUrlParser: true });
var schema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    password: String,
})
var model = mongoose.model('login-info', schema);
module.exports = model;
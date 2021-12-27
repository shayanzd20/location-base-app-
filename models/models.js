const mongoose = require('mongoose');

// set Schemas
const usersSchema = new mongoose.Schema({
    number : String,
    verif_code : Number,
    city : String,
    email : String,
    family : String,
    name : String,
    password : String,
    avatar : String,
    latitude : String,
    longitude : String,
    notification : String,
    favorites : [String],
    lastUpdate : Date
});

const discountSchemaBase = new mongoose.Schema({
    image : String,
    link : String,
    title : String,
    discount_price : String,
    real_price : String,
    discount : String,
    address : String,
    city : String,
    bought : String,
    latitude : String,
    longitude : String,
    source : String,
    conditions : [ String ],
    description : String,
    full_address : String,
    pictures : [ String ],
    stars : String,
    remain : Number,
    date : { type: Date, default: Date.now },
    finish_date : Date
})

exports.Users = mongoose.model('Users',usersSchema,'users');
exports.art = mongoose.model('Arts',discountSchemaBase,'art');
exports.beauty = mongoose.model('Beauties',discountSchemaBase,'beauty');
exports.education = mongoose.model('Educations',discountSchemaBase,'education');
exports.entertainment = mongoose.model('Entertainments',discountSchemaBase,'entertainment');
exports.health = mongoose.model('Healths',discountSchemaBase,'health');
exports.restaurant = mongoose.model('Restaurants',discountSchemaBase,'restaurant');
exports.services = mongoose.model('Services',discountSchemaBase,'services');



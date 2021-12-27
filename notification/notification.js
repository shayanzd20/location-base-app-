const mongoose = require('mongoose');
const https = require('https');
const async = require('async');
const DateDiff = require('date-diff');
const geolib = require('geolib');
const mongo = require('mongodb');
const MongoClient = require('mongodb').MongoClient;



// models
const Users = require('../models/models').Users;
const art = require('../models/models').art;
const beauty = require('../models/models').beauty;
const education = require('../models/models').education;
const entertainment = require('../models/models').entertainment;
const health = require('../models/models').health;
const restaurant = require('../models/models').restaurant;
const services = require('../models/models').services;

mongoose.connect('mongodb://localhost:27017/discount_col')
    .then(() => console.log('Connected to MongoDB ...'))
.catch(err=> console.log('Could not connect to mongoDB',err));

MongoClient.connect("mongodb://localhost:27017/discount_col", function (err, db) {

    // db.collection("users").find({$and: [{notification: {$exists: true}},{lastUpdate: {$exists: true}},{favorites: {$exists: true}},{latitude: {$exists: true}},{longitude: {$exists: true}},{number: '09366360042'}]})
    // db.collection("users").find({$and: [{notification: {$exists: true}},{lastUpdate: {$exists: true}},{favorites: {$exists: true}},{latitude: {$exists: true}},{longitude: {$exists: true}},{number: '09396675507'}]})
    db.collection("users").find({$and: [{notification: {$exists: true}},{lastUpdate: {$exists: true}},{favorites: {$exists: true}},{latitude: {$exists: true}},{longitude: {$exists: true}}]})
        .toArray(function (err, resultUsersFind) {

            var i = 0;
            console.log("resultUsersFind:",resultUsersFind);
            async.map(resultUsersFind,function (item,callBackFinal) {
                // console.log('item:',item);

                // var diff = new DateDiff(item.lastUpdate, new Date);
                var diff = new DateDiff(new Date,item.lastUpdate);
                // console.log("diff:",diff);
                // console.log("diff.minutes():",diff.minutes());
                if(diff.minutes()<10)
                {
                    console.log("here:");
                    console.log("resultFind.favorites:",item.favorites);

                    // recent online user
                    // 1- find nearest position from favorites collection
                    const notifArray = [];
                    async.map(item.favorites,function (collectionName,callback) {

                        // console.log("collectionName:",collectionName);


                        let typeArray = [
                            "art",
                            "beauty",
                            "education",
                            "entertainment",
                            "health",
                            "restaurant",
                            "services"
                        ];
                        const resultType = typeArray.find(c => c === collectionName);

                        // console.log("resultType:",resultType);
                        j=0;

                        db.collection(resultType).find({ $and: [ { "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } } ] })
                        // .limit(2)
                            .toArray(function (err, resultMongoType) {
                                if (err) {console.log("resultMongoType err::",err)};

                                // console.log("resultMongoType:",resultMongoType);
                                var findNearest = geolib.findNearest({latitude: item.latitude,longitude: item.longitude},resultMongoType);

                                console.log("findNearest:",findNearest);
                                if(findNearest.distance < 1000)
                                // if(findNearest.distance < 100000)
                                {
                                    // send notification
                                    // console.log("res:",resultMongoType[findNearest.key])

                                    const discountItem = resultMongoType[findNearest.key];

                                    console.log("item.notification:",item.notification);
                                    sendPushNotification(item.notification,"تخفیف نزدیک",discountItem.title+" با "+discountItem.discount+" تخفیف")
                                        // .then(function (re,result) {
                                        //     console.log("re:",re)
                                        //     console.log("result:",result)
                                        // });
                                    // console.log("sendReult:",sendReult);
                                    j++;
                                }


                                console.log("findNearest",findNearest);
                                notifArray.push({distance: findNearest.distance, key: findNearest.key, type: resultType})
                                // console.log("notifArray2:",notifArray);
                                console.log("notifArray.length:",notifArray.length);
                                console.log("j:",j);
                                if(notifArray.length == j)
                                {
                                    callback(null,notifArray);
                                }

                            })


                    },function (err,finalResult) {

                        if(err) throw err;
                        // console.log("finalResult:",finalResult);
                        console.log("notifArray123123:",notifArray);

                        if(notifArray.length == j)
                        {
                            i++;
                        }
                        if(resultUsersFind.length == i)
                        {
                            callBackFinal("finished");
                        }

                    })
                }

                // i++;
                console.log("resultUsersFind.count::",resultUsersFind.length);
                console.log("i::",i);
                if(resultUsersFind.length == i)
                {
                    callBackFinal("finished");
                }

            },function (finalResult12) {

                console.log('finalResult:',finalResult12);
                if(finalResult12 && finalResult12=="finished")
                {

                    setTimeout(function(){
                        process.exit(1);

                    }, 1000 * 60 *4);
                    // }, 15000);
                }

            })
        })
})
// Users.find({},{notification:1,number:1,lastUpdate:1,_id:0})

/*
Users.find()
    .select('latitude longitude favorites notification number lastUpdate -_id')
    .and([{notification: {$exists: true}},{lastUpdate: {$exists: true}},{favorites: {$exists: true}},{latitude: {$exists: true}},{longitude: {$exists: true}}])
    .then(function (resultFind) {
        console.log("resultFind:",resultFind);

        async.map(resultFind,function (item) {
            console.log('item:',item);

            // var diff = new DateDiff(item.lastUpdate, new Date);
            var diff = new DateDiff(new Date,item.lastUpdate);
            console.log("diff:",diff);
            console.log("diff:",diff.minutes());
            console.log("diff:",diff.hours());
            // if(diff.minutes()<5)
            // if(diff.minutes()<305)
            if(diff.minutes()<2400)
            {
                console.log("here:");
                console.log("resultFind.favorites:",item.favorites);

                // recent online user
                // 1- find nearest position from favorites collection
                async.map(item.favorites,function (collectionName) {

                    console.log("collectionName:",collectionName);


                    let typeArray = [
                        {"db":"art", "model": art},
                        {"db":"beauty", "model": beauty},
                        {"db":"education", "model": education},
                        {"db":"entertainment", "model": entertainment},
                        {"db":"health", "model": health},
                        {"db":"restaurant", "model": restaurant},
                        {"db":"services", "model": services}
                    ];
                    const resultType = typeArray.find(c => c.db === collectionName);
/!*
                    resultType.model.find({ $and: [ { "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } } ] })
                        //.cursor()
                        .select('latitude longitude -_id')
                        .limit(2)
                        .then(function (resultColl) {

                            var arrayOfDist = [];
                            var newDistance = {latitude: "35.7412", longitude: "51.1756"}

                            var newDistance1 = {latitude: "35.7484", longitude: "51.3309"}
                            var newDistance2 = {latitude: "35.7777", longitude: "51.4042"}
                            var newDistance3 = {latitude: "35.7523", longitude: "51.0745"}

                            arrayOfDist.push(newDistance);
                            arrayOfDist.push(newDistance1);
                            // arrayOfDist.push(newDistance2);
                            // arrayOfDist.push(newDistance3);


                            // console.log("resultColl:",resultColl);
                            // console.log("arrayOfDist:",arrayOfDist);

                            // console.log("typeOf resultColl:",typeof resultColl.toString());
                            // console.log("typeof arrayOfDist:",typeof arrayOfDist.toString());

/!*                            resultColl.forEach(function (element) {
                                arrayOfDist.push({
                                    // _id : element._id,
                                    // image : element.image,
                                    // link : element.link,
                                    // title : element.title,
                                    // discount_price : element.discount_price,
                                    // real_price : element.real_price,
                                    // discount : element.discount,
                                    // address : element.address,
                                    // city : element.city,
                                    // bought : element.bought,
                                    latitude : element.latitude,
                                    longitude : element.longitude,
                                    // source : element.source,
                                    // conditions : element.conditions,
                                    // description : element.description,
                                    // full_address : element.full_address,
                                    // pictures : element.pictures,
                                    // stars : element.starts
                                })
                            })*!/
                             // console.log("resultFind.latitude:",item.latitude);
                             // console.log("resultFind.longitude:",item.longitude);
                            // console.log("resultColl:",resultColl);
                            console.log("arrayOfDist:",arrayOfDist);
                            // var findNearest = geolib.findNearest({latitude: item.latitude,longitude: item.longitude},resultColl);
                            var findNearest1 = geolib.findNearest({latitude: item.latitude,longitude: item.longitude},arrayOfDist);

                             // var findNearest = geolib.findNearest({latitude: item.latitude,longitude: item.longitude},resultColl.toString());
                             // var findNearest = geolib.findNearest({latitude: item.latitude,longitude: item.longitude},JSON.stringify(resultColl));
                             // var findNearest = geolib.findNearest({latitude: item.latitude,longitude: item.longitude},JSON.parse(resultColl));
                            // var findNearest1 = geolib.findNearest({latitude: item.latitude,longitude: item.longitude},arrayOfDist);

                            // console.log("findNearest:",findNearest);

                        }).catch(function (err) {
                        console.log("err:",err);

                    })*!/

/////////////////////////////////////////
/!*                    resultType.model.find({ $and: [ { "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } } ] }, function (err, resultColl) {
                        console.log("docs:",resultColl);
                        var findNearest = geolib.findNearest({latitude: item.latitude,longitude: item.longitude},resultColl);

                    })*!/

                    async function getNea() {
                        const getnea = await resultType.model
                            .find({ $and: [ { "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } } ] })

                        var findNearest = geolib.findNearest({latitude: item.latitude,longitude: item.longitude},getnea);

                        // return getnea;
                    }

                    getNea();



                },function (err,finalResult) {
                    
                })

            }


        },function (err,finalResult) {
            console.log('finalResult:',finalResult);

        })


    }).catch(function (err) {
    console.log("errorFind:",err)
})
*/



function sendPushNotification(push_id,title,msg) {


    console.log("push_id:",push_id);
    console.log("title:",title);
    console.log("msg:",msg);

    var post_data = JSON.stringify({

        "applications": ["com.takhfif"],
        "filter": {
            "pushe_id": [push_id]
        },
        "notification": {
            "title": title,
            "content": msg
        }
    });


    var post_options = {
        host: 'panel.pushe.co',
        // port: '443',
        path: '/api/v1/notifications',
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Token 9546ab863515f2b6b75b7b5d0778242fe99c3792",
            'Content-Length': Buffer.byteLength(post_data)
        }
    };

    // Set up the request
    var post_req = https.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response for pushe: ' + chunk);
            return chunk;
        });
    });
    // return https.request(post_options, function(res) {
    //     res.setEncoding('utf8');
    //     res.on('data', function (chunk) {
    //         console.log('Response for pushe: ' + chunk);
    //         // return chunk;
    //     });
    // });

    // post the data
    post_req.write(post_data);
    post_req.end();


}

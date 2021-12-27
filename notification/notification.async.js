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
    // db.collection("users").find({$and: [{notification: {$exists: true}},{lastUpdate: {$exists: true}},{favorites: {$exists: true}},{latitude: {$exists: true}},{longitude: {$exists: true}},{number: '09905594462'}]})
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
                if(diff.minutes()<30)
                {
                    console.log("here:");
                    console.log("resultFind.favorites:",item.favorites);

                    // get users log
                    db.collection('users_notification_logs').find({number: item.number}).toArray(function (err, userLogResult) {

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
                                    if(findNearest.distance < 3000)
                                    // if(findNearest.distance < 100000)
                                    {
                                        // send notification
                                        // console.log("res:",resultMongoType[findNearest.key])

                                        const discountItem = resultMongoType[findNearest.key];
                                        console.log("item.notification:",item.notification);

                                        // conditions for duplicate in notifications
                                        // console.log("userLogResult::::",userLogResult);

                                        const resultDuplicate = userLogResult.find(c => c.item_id.toString() === discountItem._id.toString());
                                        console.log("discountItem._id::::",discountItem._id);
                                        console.log("resultDuplicate::::",resultDuplicate);
                                        if(resultDuplicate)
                                        {
                                            // we have duplicate
                                            console.log("resultDuplicate:",resultDuplicate);
                                            var diffDuplicate = new DateDiff(new Date,resultDuplicate.date);


                                            console.log("diffDuplicate.minutes():",diffDuplicate.minutes());
                                            if(diffDuplicate.minutes()>59*48) {
                                                // DELETE duplicate
                                                db.collection('users_notification_logs').deleteOne({
                                                    number: item.number,
                                                    item_id: resultDuplicate.item_id
                                                },function (err, userLogResult) {
                                                    console.log("item deleted::::");
                                                    j++
                                                    notifArray.push({distance: findNearest.distance, key: findNearest.key, type: resultType})
                                                    if(notifArray.length == j)
                                                    {
                                                        callback(null,notifArray);
                                                    }
                                                });
                                            }else{

                                                j++
                                                notifArray.push({distance: findNearest.distance, key: findNearest.key, type: resultType})
                                                if(notifArray.length == j)
                                                {
                                                    console.log("this is callback in notifArray.length:::")
                                                    callback(null,notifArray);
                                                }
                                            }

                                        }else{
                                            console.log("we don't have duplicate")

                                            asyncSendPushNotification(item.notification,"تخفیف نزدیک",discountItem.title+" با "+discountItem.discount+" تخفیف")
                                                .then(function (resultSend) {
                                                    console.log("resultSend:",resultSend);

                                                    // log it
                                                    db.collection('users_notification_logs').insert({number: item.number, pushe_id: item.notification, category:resultType ,item_id: discountItem._id, date: new Date},function (err, result1212) {
                                                        if(err) throw err;
                                                        console.log("log inserted");
                                                        j++

                                                        console.log("notifArray.length:",notifArray.length);
                                                        console.log("j:",j);
                                                        notifArray.push({distance: findNearest.distance, key: findNearest.key, type: resultType})

                                                        if(notifArray.length == j)
                                                        {
                                                            callback(null,notifArray);
                                                        }
                                                    })
                                                    // console.log("findNearest",findNearest);
                                                    // // console.log("notifArray2:",notifArray);


                                                })
                                                .catch(function (errSend) {
                                                    console.log("errSend:",errSend);
                                                })
                                        }
                                    }else{

                                        j++
                                        notifArray.push({distance: findNearest.distance, key: findNearest.key, type: resultType})
                                        if(notifArray.length == j)
                                        {
                                            callback(null,notifArray);
                                        }
                                    }
                                })
                        },function (err,finalResult) {

                            // if(err) throw err;
                            if(err){console.log("err in finalResult:",finalResult)}
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
                    })
                }else{
                    i++;
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
                    process.exit(1);
                }

            })
        })
})
// Users.find({},{notification:1,number:1,lastUpdate:1,_id:0})



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

function asyncSendPushNotification(push_id,title,msg) {


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

    return new Promise((resolve, reject) => {

        var post_req = https.request(post_options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('Response for pushe: ' + chunk);
                resolve(chunk)
            });

        });


    post_req.write(post_data);
    post_req.end();
        //////////////////////////////

    //     const xhr = new XMLHttpRequest();
    // xhr.open("GET", url);
    // xhr.onload = () => resolve(xhr.responseText);
    // xhr.onerror = () => reject(xhr.statusText);
    // xhr.send();
});

}

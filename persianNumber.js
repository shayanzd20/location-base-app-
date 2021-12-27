const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const geolib = require('geolib');
const Joi = require('joi');
const mongo = require('mongodb');
const persianjs = require('persianjs');
const MongoClient = require('mongodb').MongoClient;
const CryptoJS = require("crypto-js");
const async = require("async");
const multer = require("multer");
const path = require("path");
const moment = require('jalali-moment');


// Init Upload
const upload = multer({dest: '/home/velgardi/domains/velgardi-game.ir/public_html/takhfifapp/tmp'}).single('fileToUpload');

const app = express();
const secretKey = 'discountSk';

// middlewares
app.use(express.static('./tmp'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.use(cors());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST');
// res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
next();
});
//app.use(express.json());

// connect to mongodb on socket connection
MongoClient.connect("mongodb://localhost:27017/discount_col", function (err, db) {

    app.post('/api/upload', upload,(req, res) => {

        console.log('/------------------------- /api/upload/ Start ----------------------------/')
    let token = req.headers.authorization.split(' ')[1];

    jwt.verify(token,secretKey, (error,authData) => {
        if(error)
        {
            console.log('verify token error:',error);
            res.status(400).json({error: 'token is invalid'})

        }else{
            console.log('authData', authData.tokenData.user_id);
    const number = authData.tokenData.number;
    const deviceId = authData.tokenData.deviceId;

    console.log('req.file:',req.file);
    upload(req, res, (err) => {
        if(err){
            res.send({
                msg: err
            });
        } else {
            if(req.file == undefined){
        res.status(400).send({
            msg: 'Error: No File Selected!'
        });
    } else {

        // add to database
        db.collection("users").update({number: number},{$set: {avatar: req.file.filename}},function (err,resu) {
            if(err) throw err;
            console.log('resu:',resu);
            db.collection("users").findOne({number: number},{_id:0,password:0,verif_code:0},function (err,status) {
                if(err) throw err;
                console.log('status:',status);
                status.avatar = 'http://takhfifapp.velgardi-game.ir/tmp/'+status.avatar;
                res.send({status});
            })
        });
        console.log({
            msg: 'File Uploaded!',
            file: `tmp/${req.file.filename}`
        });
    }
}
});

}})

    console.log('/------------------------- /api/upload/ finish ----------------------------/')

});

    app.post('/api/register',(req, res) =>{
        console.log('/------------------------- /api/register Start ----------------------------/')
    console.log('req.body:',req.body);
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "X-Requested-With");

    // schema for joi
    const schema = {
        number: Joi.string().min(11).max(11).required()
    };

    // validate with Joi
    const resultValidation = Joi.validate(req.body, schema);
    if(resultValidation.error)
    {
        res.status(400).send({"error": 'Something Wrong With Parameters'});
        return;
    }
    var genCode = Math.floor(Math.random()*90000) + 10000;

    // insert into mongo db
    db.collection("users").findOne({number: req.body.number}, function (error, result) {

        // console.log('result:',result);
        if(result && result._id){
            db.collection('users').update({number: req.body.number},{$set: {verif_code: genCode}},function (err, result1212) {
                if (err) throw err;
                console.log('user with code gen inserted');
            })
            res.json({msg: 'verification code sent'});
        }else{
            db.collection('users').insert({number: req.body.number, verif_code: genCode},function (err, result1212) {
                if (err) throw err;
                console.log('user with code gen inserted');
            })
            res.json({msg: 'verification code sent'});
        }
        // use telegram for register code
        let msg = 'login code is:\n'+genCode;
        sendTelegramNotification(msg);
    })
    console.log('/------------------------- /api/register End ----------------------------/')

});

    app.post('/api/verification',(req, res) =>{

        console.log('/------------------------- /api/verification Start ----------------------------/')

    // schema for joi
    const schema = {
        number: Joi.string().min(11).max(11).required(),
        code: Joi.string().min(5).max(5).required(),
        deviceId: Joi.string().required()
    };

    // validate with Joi
    const resultValidation = Joi.validate(req.body, schema);
    if(resultValidation.error)
    {
        res.status(400).send({"error": 'Something Wrong With Parameters'});
        return;
    }

    db.collection("users").findOne({number: req.body.number}, function (error, result) {

        if (parseInt(req.body.code) == parseInt(result.verif_code))
        {
            // prepare data for getting token
            console.log()
            var tokenData = {
                number: req.body.number,
                deviceId: req.body.deviceId
            };

            jwt.sign({tokenData},secretKey, (error,token) => {
                console.log('token', {token});

            /// TODO:
            // 1- add device uniqe id to mongodb
            // res.send({token});
            res.json({token});
        });
        }else{
            res.status(400).json({error: 'verification code is invalid'})
        }
    })
    // res.status(400).send('the param is not ok');
    console.log('/------------------------- /api/verification End ----------------------------/')

});


    app.post('/api/getnearest/:type',(req, res) =>{
        console.log('/------------------------- /api/getnearest/:type Start ----------------------------/')
    let token = req.headers.authorization.split(' ')[1];

    jwt.verify(token,secretKey, (error,authData) => {
        if(error)
        {
            console.log('verify token error:',error);
            res.status(400).json({error: 'token is invalid'})

        }else{
            console.log('authData', authData.tokenData.user_id);
    const number = authData.tokenData.number;
    const deviceId = authData.tokenData.deviceId;


    // schema for joi
    const schema = {
        latitude: Joi.string().required(),
        longitude: Joi.string().required(),
    };

    // validate with Joi
    const resultValidation = Joi.validate(req.body, schema);
    if(resultValidation.error)
    {
        res.status(400).send({"error": 'Something Wrong With Parameters'});
        return;
    }
    let typeArray = [
        "art",
        "beauty",
        "education",
        "entertainment",
        "health",
        "restaurant",
        "services"
    ];
    const resultType = typeArray.find(c => c === req.params.type);
    if(resultType != undefined){
        console.log('resultType:',resultType);
        console.log('req.body:',req.body);

        db.collection(resultType).find({ $and: [ { "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } } ] }).toArray(function (err, resultMongoType) {

            if (err) throw err;

            console.log('resultMongoType:',resultMongoType);

            var filtered = resultMongoType.filter(function (el) {
                return (el.latitude !== (undefined && null && '' && {} && 'undefined'));
            });
            console.log('filtered:',filtered);

            var findNearest = geolib.findNearest(req.body,resultMongoType);
            console.log("findNearest",findNearest);

            // var nearest = geolib.orderByDistance(req.body,filtered);
            var nearest = geolib.orderByDistance(req.body,filtered);
            // console.log("order by nearest",nearest);

            let newArrayNearest = nearest.splice(0,20);

            let lastArray = [];
            newArrayNearest.forEach(function(element){
                resultMongoType[element.key].distance = element.distance;
                lastArray.push(resultMongoType[element.key]);
            });

            console.log('lastArray:',lastArray);
            res.send(lastArray);

        })

    }else{
        res.status(400).send({error: 'type is invalid'})
    }
}})


    console.log('/------------------------- /api/getnearest/:type End ----------------------------/')

});

    app.post('/api/suggestion',(req, res) =>{
        console.log('/------------------------- /api/suggestion Start ----------------------------/')
    let token = req.headers.authorization.split(' ')[1];

    jwt.verify(token,secretKey, (error,authData) => {
        if(error)
        {
            console.log('verify token error:',error);
            res.status(400).json({error: 'token is invalid'})

        }else{

            const number = authData.tokenData.number;
    const deviceId = authData.tokenData.deviceId;


    // schema for joi
    const schema = {
        latitude: Joi.string().required(),
        longitude: Joi.string().required(),
    };

    // validate with Joi
    const resultValidation = Joi.validate(req.body, schema);
    if(resultValidation.error)
    {
        res.status(400).send({"error": 'Something Wrong With Parameters'});
        return;
    }
    let typeArray = [
        "art",
        "beauty",
        "education",
        "entertainment",
        "health",
        "restaurant",
        "services"
    ];

    var promiseArr = [];

    typeArray.forEach(function (element) {
        db.collection(element).find({ $and: [ { "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } } ] }).toArray(function (err, resultEachType) {
            if (err) throw err;
            // console.log(`resultEachType ${element}:`,resultEachType);

            var findNearest = geolib.findNearest(req.body,resultEachType);
            findNearest.type = element;
            promiseArr.push(findNearest);

            if(promiseArr.length == typeArray.length)
            {
                var lh = lowestHighest(promiseArr);
                console.log('promiseArr:',promiseArr);
                var lowElement = promiseArr.find((function(element) {
                    return element.distance == lh.lowest;
                }));
                console.log('lowElement:',lowElement);
                db.collection(lowElement.type).find({ $and: [ { "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } } ] }).toArray(function (err, resultLastType) {
                    if (err) throw err;
                    // console.log('resultLastType:',resultLastType);

                    var filtered = resultLastType.filter(function (el) {
                        return (el.latitude !== (undefined && null && '' && {} && 'undefined'));
                    });

                    var nearest = geolib.orderByDistance(req.body,filtered);
                    let newArrayNearest = nearest.splice(0,20);

                    let lastArray = [];
                    newArrayNearest.forEach(function(element){
                        resultLastType[element.key].distance = element.distance;
                        lastArray.push(resultLastType[element.key]);
                    });
                    res.send(lastArray);

                })
                // res.send({lh});
            }
        })


    })

}})
    console.log('/------------------------- /api/suggestion End ----------------------------/')
});

    app.post('/api/suggestion',(req, res) =>{
        console.log('/------------------------- /api/suggestion Start ----------------------------/')
    let token = req.headers.authorization.split(' ')[1];

    jwt.verify(token,secretKey, (error,authData) => {
        if(error)
        {
            console.log('verify token error:',error);
            res.status(400).json({error: 'token is invalid'})

        }else{

            const number = authData.tokenData.number;
    const deviceId = authData.tokenData.deviceId;


    /*    // schema for joi
        const schema = {
            latitude: Joi.string().required(),
            longitude: Joi.string().required(),
        };

        // validate with Joi
        const resultValidation = Joi.validate(req.body, schema);
        if(resultValidation.error)
        {
            res.status(400).send({"error": 'Something Wrong With Parameters'});
            return;
        }*/




}})
    console.log('/------------------------- /api/suggestion End ----------------------------/')
});

    /*
        app.post('/api/upload',
            upload.single("file" /!* name attribute of <file> element in your form *!/),
            (req, res) => {
            console.log('req:',req.path);
            console.log('req.originalname:',req.files);
            const tempPath = req.path;
        const targetPath = path.join(__dirname, "./uploads/image.jpg");

        if (path.extname(req.originalname).toLowerCase() === ".jpg") {
            fs.rename(tempPath, targetPath, err => {
                if (err) return handleError(err, res);

            res
                .status(200)
                .contentType("text/plain")
                .end("File uploaded!");
        });
        } else {
            fs.unlink(tempPath, err => {
                if (err) return handleError(err, res);

            res
                .status(403)
                .contentType("text/plain")
                .end("Only .jpg files are allowed!");
        });
        }
    });*/


    app.post('/api/addcomment/:id',(req, res) =>{
        console.log('/------------------------- /api/addcomment Start ----------------------------/')
    let token = req.headers.authorization.split(' ')[1];

    jwt.verify(token,secretKey, (error,authData) => {
        if(error)
        {
            console.log('verify token error:',error);
            res.status(400).json({error: 'token is invalid'})

        }else{

            const number = authData.tokenData.number;
    const deviceId = authData.tokenData.deviceId;

    // schema for joi
    const schema = {
        comment: Joi.string().required(),
        type: Joi.string().required(),
        rate: Joi.number().required(),
    };

    // schema param for joi
    const schemaParams = {
        id: Joi.string().required(),
    };

    // validate with Joi
    const resultValidation = Joi.validate(req.body, schema);
    if(resultValidation.error)
    {
        res.status(400).send({"error": 'Something Wrong With Parameters'});
        return;
    }

    // validate with Joi
    const resultValidationParams = Joi.validate(req.params, schemaParams);
    if(resultValidationParams.error)
    {
        res.status(400).send({"error": 'Something Wrong With item id'});
        return;
    }

    let typeArray = [
        "art",
        "beauty",
        "education",
        "entertainment",
        "health",
        "restaurant",
        "services"
    ];
    const resultType = typeArray.find(c => c === req.body.type);

    if(resultType != undefined) {
        console.log('resultType:', resultType);

        db.collection("users").findOne({number: number},function (err,resultUser) {
            if (err) throw err;
            console.log('resultUser:',resultUser);
            db.collection("comments").insert({
                item_id: req.params.id,
                name: resultUser.name,
                avatar: resultUser.avatar,
                comment: persianjs(req.body.comment).englishNumber().toString(),
                type: resultType,
                rate: req.body.rate,
                validated: 1,
                date: persianjs(moment().locale('fa').format('YYYY/MM/DD H:M:ss')).englishNumber().toString()
            },function (err, r) {
                if (err) throw err;

                res.send({msg: "add successfully"})
            })
        })

    }else{
        req.status(400).send("type is not valid")
    }


}})
    console.log('/------------------------- /api/addcomment End ----------------------------/')
});


    app.post('/api/getcomment/:id',(req, res) =>{
        console.log('/------------------------- /api/getcomment Start ----------------------------/')

    let token = req.headers.authorization.split(' ')[1];

    jwt.verify(token,secretKey, (error,authData) => {
        if(error)
        {
            console.log('verify token error:',error);
            res.status(400).json({error: 'token is invalid'})

        }else{

            const number = authData.tokenData.number;
    const deviceId = authData.tokenData.deviceId;

    // schema for joi
    const schema = {
        type: Joi.string().required()
    };

    // schema param for joi
    const schemaParams = {
        id: Joi.string().required()
    };

    // validate with Joi
    const resultValidation = Joi.validate(req.body, schema);
    if(resultValidation.error)
    {
        res.status(400).send({"error": 'Something Wrong With Parameters'});
        return;
    }

    // validate with Joi
    const resultValidationParams = Joi.validate(req.params, schemaParams);
    if(resultValidationParams.error)
    {
        res.status(400).send({"error": 'Something Wrong With item id'});
        return;
    }

    let typeArray = [
        "art",
        "beauty",
        "education",
        "entertainment",
        "health",
        "restaurant",
        "services"
    ];
    const resultType = typeArray.find(c => c === req.body.type);

    if(resultType != undefined) {

        console.log("1");
        console.log('resultType:', resultType);
        db.collection("comments").find({
                item_id: req.params.id,
                type: resultType,
                validated: 1,
            },
            {
                _id:0,
                item_id:0,
                type:0,
                rate:0,
                validated:0,
            }).toArray(function (err, comments) {

            db.collection("comments").aggregate(
                [
                    { $match: { item_id: req.params.id } },
                    {
                        $group:
                            {
                                _id: "$item_id",
                                avgQuantity: { $avg: "$rate" }
                            }
                    }
                ]
                ,function (err,rateResult) {
                    if(err) throw err;
                    console.log("rateResult:",rateResult);

                    if(rateResult && rateResult!=null && rateResult.length !=0){
                        if(comments && comments != null)
                        {

                            comments = comments.map(item => {
                                item.avatar = 'http://takhfifapp.velgardi-game.ir/tmp/'+item.avatar
                            return item;
                        })

                            res.send({
                                rate: rateResult[0].avgQuantity,
                                rate_persian: persianjs(rateResult[0].avgQuantity).englishNumber().toString(),
                                comments});
                        }else{
                            res.send({comments});
                        }
                    }else{
                        res.send({comments});
                    }

                })
        })
    }else{
        req.status(400).send("type is not valid")
    }
}})
    console.log('/------------------------- /api/getcomment End ----------------------------/')
});


    app.post('/api/update',(req, res) =>{
        console.log('/------------------------- /api/update Start ----------------------------/')
    let token = req.headers.authorization.split(' ')[1];

    jwt.verify(token,secretKey, (error,authData) => {
        if(error)
        {
            console.log('verify token error:',error);
            res.status(400).json({error: 'token is invalid'})

        }else{
            const number = authData.tokenData.number;
    const deviceId = authData.tokenData.deviceId;


    var objForUpdate = {};
    if (req.body.name) objForUpdate.name = req.body.name;
    if (req.body.family) objForUpdate.family = req.body.family;
    if (req.body.email) objForUpdate.email = req.body.email;
    if (req.body.city) objForUpdate.city = req.body.city;
    if (req.body.password) objForUpdate.password = req.body.password;

    db.collection("users").update({
        number: number,
    },{ $set: objForUpdate
    },function (err, r) {
        if (err) throw err;

        console.log('r:',r);

        db.collection("users").findOne({number: number},{_id:0,verif_code:0,password:0},function (err, re) {
            if (err) throw err;
            re.avatar = 'http://takhfifapp.velgardi-game.ir/tmp/'+re.avatar;
            console.log('r:',re);
            res.send(re)

        })
    })
}})
    console.log('/------------------------- /api/update End ----------------------------/')
});

    /*
        app.post('/api/search',(req, res) =>{
            console.log('/------------------------- /api/search Start ----------------------------/')
        let token = req.headers.authorization.split(' ')[1];

        jwt.verify(token,secretKey, (error,authData) => {
            if(error)
            {
                console.log('verify token error:',error);
                res.status(400).json({error: 'token is invalid'})

            }else{
                const number = authData.tokenData.number;
        const deviceId = authData.tokenData.deviceId;

        // schema for joi
        const schema = {
            search: Joi.string().required()
        };

        // validate with Joi
        const resultValidation = Joi.validate(req.body, schema);
        if(resultValidation.error)
        {
            res.status(400).send({"error": 'Something Wrong With Parameters'});
            return;
        }

        let typeArray = [
            "art",
            "beauty",
            "education",
            "entertainment",
            "health",
            "restaurant",
            "services"
        ];

        var finalArray = [];
        let processid = 0 ;
        typeArray.forEach(function (element) {
            db.collection(element).find({title: new RegExp(req.body.search, 'i')}).toArray(function (err, resultEachType) {
                if (err) throw err;
                console.log(`resultEachType ${element}:`,resultEachType);
                if(resultEachType.length != 0)
                {
                    finalArray.push(resultEachType);
                }

                processid++;
                if(processid == typeArray.length)
                {
                    res.send(finalArray);
                }
            })
        })

    }})
        console.log('/------------------------- /api/search End ----------------------------/')
    });*/


    app.post('/api/search',(req, res) =>{
        console.log('/------------------------- /api/search Start ----------------------------/')
    let token = req.headers.authorization.split(' ')[1];

    jwt.verify(token,secretKey, (error,authData) => {
        if(error)
        {
            console.log('verify token error:',error);
            res.status(400).json({error: 'token is invalid'})

        }else{
            const number = authData.tokenData.number;
    const deviceId = authData.tokenData.deviceId;

    // schema for joi
    const schema = {
        search: Joi.string().required(),
        latitude: Joi.string().required(),
        longitude: Joi.string().required()
    };

    // validate with Joi
    const resultValidation = Joi.validate(req.body, schema);
    if(resultValidation.error)
    {
        res.status(400).send({"error": 'Something Wrong With Parameters'});
        return;
    }

    let typeArray = [
        "art",
        "beauty",
        "education",
        "entertainment",
        "health",
        "restaurant",
        "services"
    ];

    var finalArray = [];

    async.map(typeArray,function (name,callback) {
        var finalArray = [];

        db.collection(name).find({$and: [ {title: new RegExp(req.body.search, 'i')},{ "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } } ]}).toArray(function (err, resultEachType) {
            if (err) throw err;

            callback(null,resultEachType);
        })

    },function (err, searchResult) {
        // console.log('searchResult:',searchResult);

        var filtered = searchResult.filter(function (el) {
            return el.length != 0;
        });

        var proccess = 0;
        let lastArray = [];

        filtered.forEach(function (element) {
            var nearest = geolib.orderByDistance({latitude: req.body.latitude,longitude: req.body.longitude},element);

            let newArrayNearest = nearest.splice(0,20);
            var proccess_new = 0;

            console.log('newArrayNearest:',newArrayNearest);
            proccess ++;
            newArrayNearest.forEach(function(element1){
                element[element1.key].distance = element1.distance;
                lastArray.push(element[element1.key]);
                proccess_new ++;
                if(filtered.length == proccess && newArrayNearest.length == proccess_new){

                    res.send(lastArray.sort(compare));
                }
            });

        })
    })
}})
    console.log('/------------------------- /api/search End ----------------------------/')
});


    app.post('/api/status',(req, res) =>{
        console.log('/------------------------- /api/status Start ----------------------------/')
    let token = req.headers.authorization.split(' ')[1];

    jwt.verify(token,secretKey, (error,authData) => {
        if(error)
        {
            console.log('verify token error:',error);
            res.status(400).json({error: 'token is invalid'})

        }else{
            console.log('authData.tokenData:',authData.tokenData);
    const number = authData.tokenData.number;
    const deviceId = authData.tokenData.deviceId;
    db.collection("users").findOne({number: number},{verif_code:0},function (error, status) {
        if(status && status._id) {
            status.avatar = 'http://takhfifapp.velgardi-game.ir/tmp/'+status.avatar;
            res.send({status});
        }else{
            res.status(400).send({"error": 'user not existed'});
        }
    })
}})
    console.log('/------------------------- /api/status End ----------------------------/')
});

    app.post('/api/persian',(req, res) =>{
        console.log('/------------------------- /api/status Start ----------------------------/')

        db.collection("art").update({_id: "5c7a848f3ff5e357303a8307"},{$set:
                {discount_price:
                        persianjs("$discount_price").englishNumber().toString()}},function (error, status) {
            if(error) throw error
                console.log('status:',status);
        })
        console.log('/------------------------- /api/status End ----------------------------/')
    });

});


// const port = process.env.PORT || 3031;
const port = process.env.PORT || 4455;
app.listen(port,()=>console.log(`Listening on port ${port} ...`));



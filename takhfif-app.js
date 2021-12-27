const express = require("express");
const http = require("http");
const jwt = require("jsonwebtoken");
const request = require("request");
const bodyParser = require("body-parser");
const geolib = require("geolib");
const Joi = require("joi");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const persianjs = require("persianjs");
const MongoClient = require("mongodb").MongoClient;
const CryptoJS = require("crypto-js");
const async = require("async");
const multer = require("multer");
const path = require("path");
const moment = require("jalali-moment");
const morgan = require("morgan");

// libraries
const otp = require("./libs/otp");

// debugging console
const appDebuger = require("debug")("app:application");
const dbDebuger = require("debug")("app:db");
const httpDebuger = require("debug")("app:http");
const errorDebuger = require("debug")("app:error");

const port = process.env.PORT || 3031;
// const port = process.env.PORT || 4455;

var setting_message = "دسته بندی که دوست داری انتخاب کن تا موقع نزدیک شدن به تخفیف مورد نظرت بهت خبر بدیم";
var suggestion_message = "میتونی نزدیک ترین تخفیف و پیشنهادات مشابه اون تخفیفو بر اساس موقعیتت تو این صفحه ببینی و اولین نفری باشی که خرید میکنی";
var active_message = "کاربر عزیز امکان ورود به سرویس ویزنو بدلیل نداشتن شارژ کافی مقدور نمی باشد. لطفا سیم کارت خود را شارژ کنید و مجددا تلاش کنید";


// Init Upload
const upload = multer({ dest: "/home/velgardi/domains/velgardi-game.ir/public_html/takhfifapp/tmp" }).single("fileToUpload");

const app = express();
const secretKey = "discountSk";

// middlewares
app.use(express.static("./tmp"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("tiny"));

// app.use(cors());
app.use((req, res, next) => {

  console.log("headers:",req.headers);
  /*res.header('Access-Control-Allow-Origin', '*');
  // res.setHeader('Access-Control-Allow-Origin', 'http://visno.ir');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // res.setHeader('Access-Control-Allow-Credentials', true);
  if ('OPTIONS' === req.method) {
    //respond with 200
    // res.json('OK');
    res.sendStatus(204);
  }
  else {
    //move on
    next();
  }*/


  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,HEAD,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers,Origin,Accept,X-Requested-With,Content-Type,Cache-Control,X-Auth-Token,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization");
  if ('OPTIONS' === req.method) {
    //respond with 200
    // res.json('OK');
    res.sendStatus(204);
  }
  else {
    //move on
    next();
  }
});
//app.use(express.json());

// connect to mongodb on mongoose
/*
mongoose.connect('mongodb://localhost:27017/discount_col')
    .then(() => console.log('Connected to MongoDB ...'))
.catch(err=> console.log('Could not connect to mongoDB',err));

*/

// connect to mongodb on socket connection
MongoClient.connect("mongodb://localhost:27017/discount_col", function(err, db) {

  app.post("/api/upload", upload, (req, res) => {

    console.log("/------------------------- /api/upload/ Start ----------------------------/");
    console.log("req.body:", req.body);
    if (req.headers.authorization) {

      let token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, secretKey, (error, authData) => {
        if (error) {
          console.log("verify token error:", error);
          res.status(400).json({ error: "token is invalid" });

        } else {
          console.log("authData", authData.tokenData.user_id);
          const number = authData.tokenData.number;
          const deviceId = authData.tokenData.deviceId;

          console.log("req.file:", req.file);
          upload(req, res, (err) => {
            if (err) {
              res.send({
                msg: err
              });
            } else {
              if (req.file == undefined) {
                res.status(400).send({
                  msg: "Error: No File Selected!"
                });
              } else {

                // add to database
                db.collection("users").update({ number: number }, { $set: { avatar: req.file.filename } }, function(err, resu) {
                  if (err) throw err;
                  console.log("resu:", resu);
                  db.collection("users").findOne({ number: number }, {
                    _id: 0,
                    password: 0,
                    verif_code: 0
                  }, function(err, status) {
                    if (err) throw err;
                    console.log("status:", status);
                    status.avatar = "http://takhfifapp.velgardi-game.ir/tmp/" + status.avatar;
                    res.send({ status });
                  });
                });
                console.log({
                  msg: "File Uploaded!",
                  file: `tmp/${req.file.filename}`
                });
              }
            }
          });

        }
      });
    } else {
      res.status(400).json({ error: "token not existed" });
    }


    console.log("/------------------------- /api/upload/ finish ----------------------------/");

  });

  app.post("/api/register", (req, res) => {
    console.log("/------------------------- /api/register Start ----------------------------/");
    // console.log('req.body:',req.body);
    console.log("req.body:", req.body);
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "X-Requested-With");

    // schema for joi
    const schema = {
      number: Joi.string().min(11).max(11).required(),
      notificationId: Joi.string()
    };

    // validate with Joi
    const resultValidation = Joi.validate(req.body, schema);
    if (resultValidation.error) {
      res.status(400).send({ "error": "Something Wrong With Parameters" });
      return;
    }
    // var genCode = Math.floor(Math.random() * 90000) + 10000;

    // insert into mongo db
    db.collection("users").findOne({ number: req.body.number }, function(error, result) {

      console.log('result findOne:',result);
      if (result && result._id) {

        // version 1.0 (old version)
        /*db.collection("users").update({ number: req.body.number }, { $set: { verif_code: genCode } }, function(err, result1212) {
          if (err) throw err;
          console.log("user with code gen inserted update");
        });
        res.json({ msg: "verification code sent" });*/


        // version 2.0
        otp.internalUserStatus(req.body.number)
          .then(function(result) {
            console.log("result internalUserStatus:", result);
            if(result.body.status == true)
            {
              // user is existed return token
              // res.json({ msg: "verification code sent" });
              var tokenData = {
                number: req.body.number,
                notificationId: req.body.notificationId
              };

              db.collection("users").update({ number: req.body.number }, { $set: { notification: req.body.notificationId } }, function(err, resultUpdate) {
                if (err) throw err;

                console.log("notificationId updated");
              });

              jwt.sign({ tokenData }, secretKey, (error, token) => {
                console.log("token", { token });

                /// TODO:
                // 1- add device uniqe id to mongodb
                // res.send({token});
                res.json({ token });
              });
            }else{
              otp.internalOtpRequest(req.body.number)
                .then(function(result) {
                  console.log("result internalOtpRequest:", result);
                  if(result.body.status == true)
                  {
                    res.json({ msg: "verification code sent" });
                  }else{
                    res.json({ msg: "خطای رخ داده. مجددا تلاش کنید" });
                  }
                }).catch(function(err) {
                console.error("amirKabirOtpRequest error: ", err);
              });
            }
          }).catch(function(err) {
          console.error("amirKabirOtpRequest error: ", err);
        });


      } else {

        // version 1.0
        /*db.collection("users").insert({ number: req.body.number, verif_code: genCode }, function(err, result1212) {
          if (err) throw err;
          console.log("user with code gen inserted insert");
        });
        res.json({ msg: "verification code sent" });
*/


        // version 2.0
        otp.internalOtpRequest(req.body.number)
          .then(function(result) {
            console.log("result:", result);
            if(result.body.status == true)
            {
              res.json({ msg: "verification code sent" });
            }else{
              res.json({ msg: "خطای رخ داده. مجددا تلاش کنید" });
            }
          }).catch(function(err) {
          console.error("amirKabirOtpRequest error: ", err);
        });
      }
      // use telegram for register code
/*      console.log("genCode:", genCode);
      let msg = "visno login code is:\n" + req.body.number + " - " + genCode;
      // sendSms(genCode,req.body.number);
      console.log("req.body.number.substr(1,1):", req.body.number.substr(0, 1));
      console.log("req.body.number.substr(1):", req.body.number.substr(1));
      if (req.body.number.length == 11 && req.body.number.substr(0, 1) == 0) {
        console.log("here1");
        var numberOtp = "98" + req.body.number.substr(1);
      } else if (req.body.number.length == 10 && req.body.number.substr(0, 1) == 0) {
        console.log("here2");
        var numberOtp = "98" + req.body.number;
      } else {
        console.log("here3");

        var numberOtp = req.body.number;

      }*/

      // sendTelegramNotification(msg);
    });
    console.log("/------------------------- /api/register End ----------------------------/");

  });

  app.post("/api/verification", (req, res) => {

    console.log("/------------------------- /api/verification Start ----------------------------/");

    console.log("req.body:", req.body);

    // schema for joi
    /* const schema = {
         number: Joi.string().min(11).max(11).required(),
         code: Joi.string().min(5).max(5).required(),
         notificationId: Joi.string()
     };

     // validate with Joi
     const resultValidation = Joi.validate(req.body, schema);
     if(resultValidation.error)
     {
         res.status(400).send({"error": 'Something Wrong With Parameters'});
         return;
     }*/

    /*db.collection("users").findOne({number: req.body.number}, function (error, result) {

        if (parseInt(req.body.code) == parseInt(result.verif_code) || parseInt(req.body.code) == 12345)
        {
            // prepare data for getting token
            var tokenData = {
                number: req.body.number,
                notificationId: req.body.notificationId
            };

            // insert notificationId from user into collection
            db.collection("users").update({number: req.body.number},{$set:{notification: req.body.notificationId}},function (err, resultUpdate) {
                if(err) throw err;

                console.log("notificationId updated");
            })

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
    })*/

    db.collection("users").findOne({ number: req.body.number }, function(error, result) {

      if (result) {

        // version 2.0
        if(req.body.code.length == 5){
          var pin = req.body.code.substr(0,4);
        }else{
          var pin = req.body.code;
        }
        otp.internalOtpConfirm(req.body.number,pin)
          .then(function(result) {
            console.log("result:", result);

            if(result.body.status == true)
            {
              // prepare data for getting token
              var tokenData = {
                number: req.body.number,
                notificationId: req.body.notificationId
              };

              // insert notificationId from user into collection
              db.collection("users").update({ number: req.body.number }, { $set: { notification: req.body.notificationId } }, function(err, resultUpdate) {
                if (err) throw err;

                console.log("notificationId updated");
              });

              jwt.sign({ tokenData }, secretKey, (error, token) => {
                console.log("token", { token });

                /// TODO:
                // 1- add device uniqe id to mongodb
                // res.send({token});
                res.json({ token });
              });
            }else{
              res.status(400).json({ error: "verification code is invalid" });
            }

          }).catch(function(err) {
          console.error("amirKabirOtpRequest error: ", err);
        });
      }


      // version 1.0
      /*if (parseInt(req.body.code) == parseInt(result.verif_code) || parseInt(req.body.code) == 12345) {
        // prepare data for getting token
        var tokenData = {
          number: req.body.number,
          notificationId: req.body.notificationId
        };

        // insert notificationId from user into collection
        db.collection("users").update({ number: req.body.number }, { $set: { notification: req.body.notificationId } }, function(err, resultUpdate) {
          if (err) throw err;

          console.log("notificationId updated");
        });

        jwt.sign({ tokenData }, secretKey, (error, token) => {
          console.log("token", { token });

          /// TODO:
          // 1- add device uniqe id to mongodb
          // res.send({token});
          res.json({ token });
        });
      } else {
        res.status(400).json({ error: "verification code is invalid" });
      }*/
    });
    // res.status(400).send('the param is not ok');
    console.log("/------------------------- /api/verification End ----------------------------/");

  });

  app.post("/api/getnearest/:type", (req, res) => {
    console.log("/------------------------- /api/getnearest/:type Start ----------------------------/");
    console.log("req.body:", req.body);

    if (req.headers.authorization) {

      let token = req.headers.authorization.split(" ")[1];
      console.log("token:",token);

      jwt.verify(token, secretKey, (error, authData) => {
        if (error) {
          console.log("verify token error:", error);
          res.status(400).json({ error: "token is invalid" });

        } else {
          console.log("authData", authData);
          console.log("authData.tokenData.user_id", authData.tokenData.user_id);
          const number = authData.tokenData.number;
          const deviceId = authData.tokenData.deviceId;

          // schema for joi
          const schema = {
            latitude: Joi.string().required(),
            longitude: Joi.string().required()
          };

          // validate with Joi
          const resultValidation = Joi.validate(req.body, schema);
          if (resultValidation.error) {
            res.status(400).send({ "error": "Something Wrong With Parameters" });
            return;
          }

          let typeArray = [
            "arts",
            "beauties",
            "educations",
            "entertainments",
            "healths",
            "restaurants",
            "services",
            "all"
          ];

          if(req.params.type === "services" || req.params.type === "all" || req.params.type === "health")
          {
            var resultType = typeArray.find(c => c === req.params.type);
          }else if(req.params.type === "beauty"){
            var resultType = "beauties";
          }else{
            var resultType = typeArray.find(c => c === req.params.type+"s");
          }

          console.log("resultType before:", resultType);

          if (resultType) {

            console.log("resultType:", resultType);
            // console.log('req.body:',req.body);
            console.log("req.body:", req.body);

            if (resultType == "all") {
              let typeArray = [
                "arts",
                "beauties",
                "educations",
                "entertainments",
                "healths",
                "restaurants",
                "services"
              ];

              var promiseArr = [];

              var i = 1;
              typeArray.forEach(function(element) {
                db.collection(element).find({ $and: [{ "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } }] })

                  .toArray(function(err, resultEachType) {
                    if (err) throw err;

                    var filtered = resultEachType.filter(function(el) {
                      return (el.latitude !== (undefined && null && "" && {} && "undefined"));
                    });

                    var nearest = geolib.orderByDistance(req.body, filtered);
                    // let newArrayNearest = nearest.splice(0,5);
                    //
                    // let lastArray = [];
                    // newArrayNearest.forEach(function(element){
                    //     resultEachType[element.key].distance = element.distance;
                    //     // lastArray.push(resultEachType[element.key]);
                    //     promiseArr.push(resultEachType[element.key]);
                    // });

                    nearest.forEach(function(element) {
                      resultEachType[element.key].distance = element.distance;
                      promiseArr.push(resultEachType[element.key]);
                    });

                    i++;
                    if (i == typeArray.length) {
                      var nearestNew = geolib.orderByDistance(req.body, promiseArr);
                      let newArrayNearestSpliced = nearestNew.splice(0, 20);

                      var j = 0;
                      var LastTotallArray = [];
                      newArrayNearestSpliced.forEach(function(element) {
                        promiseArr[element.key].distance = element.distance;
                        LastTotallArray.push(promiseArr[element.key]);

                        j++;
                        if (j == newArrayNearestSpliced.length) {
                          res.send(LastTotallArray);
                        }
                      });
                    }
                  });
              });

            } else {
              db.collection(resultType).find({ $and: [{ "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } }] })
              // .limit(2)
                .toArray(function(err, resultMongoType) {

                  if (err) throw err;

                  console.log("resultMongoType:", resultMongoType);

                  var filtered = resultMongoType.filter(function(el) {
                    return (el.latitude !== (undefined && null && "" && {} && "undefined"));
                  });
                  console.log("req.body:", req.body);
                  console.log("resultMongoType:", resultMongoType);

                  var findNearest = geolib.findNearest(req.body, resultMongoType);
                  console.log("findNearest", findNearest);

                  // var nearest = geolib.orderByDistance(req.body,filtered);
                  var nearest = geolib.orderByDistance(req.body, filtered);
                  // console.log("order by nearest",nearest);

                  let newArrayNearest = nearest.splice(0, 20);

                  let lastArray = [];
                  newArrayNearest.forEach(function(element) {
                    resultMongoType[element.key].distance = element.distance;
                    var current = new Date();
                    var currentTimestamp = current.getTime();
                    var finish = new Date(resultMongoType[element.key].finish_date);
                    var finishTimestamp = current.getTime();

                    resultMongoType[element.key].remain = Math.round((finishTimestamp - currentTimestamp) / 1000) != 0 ? Math.round((finishTimestamp - currentTimestamp) / 1000) : false;
                    lastArray.push(resultMongoType[element.key]);
                  });

                  console.log("lastArray:", lastArray);
                  res.send(lastArray);

                });
            }

          } else {
            res.status(400).send({ error: "type is invalid" });
          }
        }
      });
    } else {
      res.status(400).json({ error: "token not existed" });
    }
    console.log("/------------------------- /api/getnearest/:type End ----------------------------/");

  });

  app.post("/api/getnearest-web/:type", (req, res) => {
    console.log("/------------------------- /api/getnearest-web/:type Start ----------------------------/");
    console.log("req.body:", req.body);

          // schema for joi
          const schema = {
            latitude: Joi.string().required(),
            longitude: Joi.string().required()
          };

          // validate with Joi
          const resultValidation = Joi.validate(req.body, schema);
          if (resultValidation.error) {
            res.status(400).send({ "error": "Something Wrong With Parameters" });
            return;
          }

          let typeArray = [
            "arts",
            "beauties",
            "educations",
            "entertainments",
            "healths",
            "restaurants",
            "services"
          ];

    if(req.params.type === "services" || req.params.type === "all" )
    {
      var resultType = "services";
    }else if(req.params.type === "beauty"){
      var resultType = "beauties";
    }else if(req.params.type === "health"){
      var resultType = "health";
    }else{
      var resultType = typeArray.find(c => c === req.params.type+"s");
    }

          if (resultType) {

            console.log("resultType:", resultType);
            // console.log('req.body:',req.body);
            console.log("req.body:", req.body);
              db.collection(resultType).find({ $and: [{ "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } },{ "latitude": { $not: /.* .*/i } },{ "longitude": { $not: /.* .*/i } }] })
                // .limit(10)
              // .limit(2)
                .toArray(function(err, resultMongoType) {

                  if (err) throw err;

                  // console.log("resultMongoType:", resultMongoType);

                  var filtered = resultMongoType.filter(function(el) {
                    return (el.latitude !== (undefined && null && "" && {} && "undefined"));
                  });
                  console.log("req.body:", req.body);
                  // console.log("resultMongoType:", resultMongoType);

                  var findNearest = geolib.findNearest(req.body, resultMongoType);
                  console.log("findNearest", findNearest);

                  // var nearest = geolib.orderByDistance(req.body,filtered);
                  var nearest = geolib.orderByDistance(req.body, filtered);
                  // console.log("order by nearest",nearest);

                  let newArrayNearest = nearest.splice(0, 4);

                  let lastArray = [];
                  newArrayNearest.forEach(function(element) {
                    resultMongoType[element.key].distance = element.distance;
                    var current = new Date();
                    var currentTimestamp = current.getTime();
                    var finish = new Date(resultMongoType[element.key].finish_date);
                    var finishTimestamp = current.getTime();

                    resultMongoType[element.key].remain = Math.round((finishTimestamp - currentTimestamp) / 1000) != 0 ? Math.round((finishTimestamp - currentTimestamp) / 1000) : false;
                    lastArray.push(resultMongoType[element.key]);
                  });

                  console.log("lastArray:", lastArray);
                  res.send(lastArray);

                });

          } else {
            res.status(400).send({ error: "type is invalid" });
          }
    console.log("/------------------------- /api/getnearest-web/:type End ----------------------------/");

  });

  app.post("/", (req, res) => {
    console.log("/------------------------- /api/getnearest-web/:type Start ----------------------------/");
    console.log("req.body:", req.body);
    req.body.latitude = "35.84";
    req.body.longitude = "50.9391";

          // schema for joi
          const schema = {
            latitude: Joi.string().required(),
            longitude: Joi.string().required()
          };

          // validate with Joi
          const resultValidation = Joi.validate(req.body, schema);
          if (resultValidation.error) {
            res.status(400).send({ "error": "Something Wrong With Parameters" });
            return;
          }

          let typeArray = [
            "arts",
            "beauties",
            "educations",
            "entertainments",
            "healths",
            "restaurants",
            "services"
          ];


    var resultType ="art";
          if (resultType) {

            console.log("resultType:", resultType);
            // console.log('req.body:',req.body);
            console.log("req.body:", req.body);
              db.collection(resultType).find({ $and: [{ "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } },{ "latitude": { $not: /.* .*/i } },{ "longitude": { $not: /.* .*/i } }] })
                // .limit(10)
              // .limit(2)
                .toArray(function(err, resultMongoType) {

                  if (err) throw err;

                  // console.log("resultMongoType:", resultMongoType);

                  var filtered = resultMongoType.filter(function(el) {
                    return (el.latitude !== (undefined && null && "" && {} && "undefined"));
                  });
                  console.log("req.body:", req.body);
                  // console.log("resultMongoType:", resultMongoType);

                  var findNearest = geolib.findNearest(req.body, resultMongoType);
                  console.log("findNearest", findNearest);

                  // var nearest = geolib.orderByDistance(req.body,filtered);
                  var nearest = geolib.orderByDistance(req.body, filtered);
                  // console.log("order by nearest",nearest);

                  let newArrayNearest = nearest.splice(0, 4);

                  let lastArray = [];
                  newArrayNearest.forEach(function(element) {
                    resultMongoType[element.key].distance = element.distance;
                    var current = new Date();
                    var currentTimestamp = current.getTime();
                    var finish = new Date(resultMongoType[element.key].finish_date);
                    var finishTimestamp = current.getTime();

                    resultMongoType[element.key].remain = Math.round((finishTimestamp - currentTimestamp) / 1000) != 0 ? Math.round((finishTimestamp - currentTimestamp) / 1000) : false;
                    lastArray.push(resultMongoType[element.key]);
                  });

                  console.log("lastArray:", lastArray);
                  res.send(lastArray);

                });

          } else {
            res.status(400).send({ error: "type is invalid" });
          }
    console.log("/------------------------- /api/getnearest-web/:type End ----------------------------/");

  });

  app.get("/", (req, res) => {
    console.log("/------------------------- /api/getnearest-web/:type Start ----------------------------/");
    console.log("req.body:", req.body);


    res.status(200).json("successfull")
    console.log("/------------------------- /api/getnearest-web/:type End ----------------------------/");

  });

  app.post("/api/suggestion", (req, res) => {
    console.log("/------------------------- /api/suggestion Start ----------------------------/");
    console.log("req.body:", req.body);
    if (req.headers.authorization) {
      let token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, secretKey, (error, authData) => {
        if (error) {
          console.log("verify token error:", error);
          res.status(400).json({ error: "token is invalid" });

        } else {

          const number = authData.tokenData.number;
          const deviceId = authData.tokenData.deviceId;


          // schema for joi
          const schema = {
            latitude: Joi.string().required(),
            longitude: Joi.string().required()
          };

          // validate with Joi
          const resultValidation = Joi.validate(req.body, schema);
          if (resultValidation.error) {
            res.status(400).send({ "error": "Something Wrong With Parameters" });
            return;
          }
          let typeArray = [
            "arts",
            "beauties",
            "educations",
            "entertainments",
            "healths",
            "restaurants",
            "services"
          ];

          var promiseArr = [];

          typeArray.forEach(function(element) {
            db.collection(element).find({ $and: [{ "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } }] }).toArray(function(err, resultEachType) {
              if (err) throw err;
              // console.log(`resultEachType ${element}:`,resultEachType);

              var findNearest = geolib.findNearest(req.body, resultEachType);
              // console.log("element:",element);
              // console.log("findNearest:",findNearest);

              if (findNearest && findNearest != undefined) {
                findNearest.type = element;
                // console.log("findNearest:",findNearest);

                promiseArr.push(findNearest);

                if (promiseArr.length == typeArray.length) {
                  var lh = lowestHighest(promiseArr);
                  console.log("promiseArr:", promiseArr);
                  var lowElement = promiseArr.find((function(element) {
                    return element.distance == lh.lowest;
                  }));
                  console.log("lowElement:", lowElement);
                  db.collection(lowElement.type).find({ $and: [{ "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } }] }).toArray(function(err, resultLastType) {
                    if (err) throw err;
                    // console.log('resultLastType:',resultLastType);

                    var filtered = resultLastType.filter(function(el) {
                      return (el.latitude !== (undefined && null && "" && {} && "undefined"));
                    });

                    var nearest = geolib.orderByDistance(req.body, filtered);
                    let newArrayNearest = nearest.splice(0, 20);

                    let lastArray = [];

                    newArrayNearest.forEach(function(element) {
                      resultLastType[element.key].distance = element.distance;
                      lastArray.push(resultLastType[element.key]);
                    });
                    res.send(lastArray);
                  });
                }
              }
            });
          });
        }
      });
    } else {
      res.status(400).json({ error: "token not existed" });
    }

    console.log("/------------------------- /api/suggestion End ----------------------------/");
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

  app.post("/api/addcomment/:id", (req, res) => {
    console.log("/------------------------- /api/addcomment Start ----------------------------/");
    console.log("req.body:", req.body);
    if (req.headers.authorization) {
      let token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, secretKey, (error, authData) => {
        if (error) {
          console.log("verify token error:", error);
          res.status(400).json({ error: "token is invalid" });

        } else {

          const number = authData.tokenData.number;
          const deviceId = authData.tokenData.deviceId;

          // schema for joi
          const schema = {
            comment: Joi.string().required(),
            type: Joi.string().required(),
            rate: Joi.number().required()
          };

          // schema param for joi
          const schemaParams = {
            id: Joi.string().required()
          };

          // validate with Joi
          const resultValidation = Joi.validate(req.body, schema);
          if (resultValidation.error) {
            res.status(400).send({ "error": "Something Wrong With Parameters" });
            return;
          }

          // validate with Joi
          const resultValidationParams = Joi.validate(req.params, schemaParams);
          if (resultValidationParams.error) {
            res.status(400).send({ "error": "Something Wrong With item id" });
            return;
          }

          let typeArray = [
            "arts",
            "beauties",
            "educations",
            "entertainments",
            "healths",
            "restaurants",
            "services"
          ];
          const resultType = typeArray.find(c => c === req.body.type);

          if (resultType != undefined) {
            console.log("resultType:", resultType);

            db.collection("users").findOne({ number: number }, function(err, resultUser) {
              if (err) throw err;
              console.log("resultUser:", resultUser);
              db.collection("comments").insert({
                item_id: req.params.id,
                name: resultUser.name,
                avatar: resultUser.avatar,
                comment: persianjs(req.body.comment).englishNumber().toString(),
                type: resultType,
                rate: req.body.rate,
                validated: 1,
                date: persianjs(moment().locale("fa").format("YYYY/MM/DD H:M:ss")).englishNumber().toString()
              }, function(err, r) {
                if (err) throw err;

                res.send({ msg: "add successfully" });
              });
            });

          } else {
            req.status(400).send("type is not valid");
          }


        }
      });
    } else {
      res.status(400).json({ error: "token not existed" });
    }

    console.log("/------------------------- /api/addcomment End ----------------------------/");
  });

  app.post("/api/getcomment/:id", (req, res) => {
    console.log("/------------------------- /api/getcomment Start ----------------------------/");
    console.log("req.body:", req.body);

    if (req.headers.authorization) {
      let token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, secretKey, (error, authData) => {
        if (error) {
          console.log("verify token error:", error);
          res.status(400).json({ error: "token is invalid" });

        } else {

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
          if (resultValidation.error) {
            res.status(400).send({ "error": "Something Wrong With Parameters" });
            return;
          }

          // validate with Joi
          const resultValidationParams = Joi.validate(req.params, schemaParams);
          if (resultValidationParams.error) {
            res.status(400).send({ "error": "Something Wrong With item id" });
            return;
          }

          let typeArray = [
            "arts",
            "beauties",
            "educations",
            "entertainments",
            "healths",
            "restaurants",
            "services"
          ];
          const resultType = typeArray.find(c => c === req.body.type);

          console.log("resultType:", resultType);
          if (resultType) {
            console.log("1");
            console.log("resultType:", resultType);
            console.log("resultType:", resultType);
            db.collection("comments").find({
                item_id: req.params.id,
                type: resultType,
                validated: 1
              },
              {
                _id: 0,
                item_id: 0,
                type: 0,
                rate: 0,
                validated: 0
              }).toArray(function(err, comments) {

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
                , function(err, rateResult) {
                  if (err) {
                    console.log("err:::", err);
                  }
                  ;
                  // console.log("rateResult:",rateResult);
                  console.log("rateResult:", rateResult);

                  if (rateResult && rateResult != null && rateResult.length != 0) {
                    if (comments && comments != null) {

                      comments = comments.map(item => {
                        item.avatar = "http://takhfifapp.velgardi-game.ir/tmp/" + item.avatar;
                        return item;
                      });

                      console.log("rateResult[0]:", rateResult[0]);
                      res.send({
                        rate: rateResult[0].avgQuantity,
                        rate_persian: rateResult[0].avgQuantity != 0 ? persianjs(rateResult[0].avgQuantity).englishNumber().toString() : "0",
                        comments
                      });
                    } else {
                      res.send({ comments });
                    }
                  } else {
                    res.send({ comments });
                  }

                });
            });
          } else {
            res.status(400).send("type is not valid");
          }
        }
      });
    } else {
      res.status(400).json({ error: "token not existed" });
    }

    console.log("/------------------------- /api/getcomment End ----------------------------/");
  });

  app.post("/api/update", (req, res) => {
    console.log("/------------------------- /api/update Start ----------------------------/");
    console.log("req.body:", req.body);

    if (req.headers.authorization) {
      let token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, secretKey, (error, authData) => {
        if (error) {
          console.log("verify token error:", error);
          res.status(400).json({ error: "token is invalid" });

        } else {
          const number = authData.tokenData.number;
          const deviceId = authData.tokenData.deviceId;


          var objForUpdate = {};
          if (req.body.name) objForUpdate.name = req.body.name;
          if (req.body.family) objForUpdate.family = req.body.family;
          if (req.body.email) objForUpdate.email = req.body.email;
          if (req.body.city) objForUpdate.city = req.body.city;
          if (req.body.password) objForUpdate.password = req.body.password;

          db.collection("users").update({
            number: number
          }, {
            $set: objForUpdate
          }, function(err, r) {
            if (err) throw err;

            console.log("r:", r);

            db.collection("users").findOne({ number: number }, {
              _id: 0,
              verif_code: 0,
              password: 0
            }, function(err, re) {
              if (err) throw err;
              re.avatar = "http://takhfifapp.velgardi-game.ir/tmp/" + re.avatar;
              console.log("r:", re);
              res.send(re);

            });
          });
        }
      });
    } else {
      res.status(400).json({ error: "token not existed" });
    }

    console.log("/------------------------- /api/update End ----------------------------/");
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

  app.post("/api/search", (req, res) => {
    console.log("/------------------------- /api/search Start ----------------------------/");
    console.log("req.body:", req.body);

    if (req.headers.authorization) {

      let token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, secretKey, (error, authData) => {
        if (error) {
          console.log("verify token error:", error);
          res.status(400).json({ error: "token is invalid" });

        } else {
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
          if (resultValidation.error) {
            res.status(400).send({ "error": "Something Wrong With Parameters" });
            return;
          }

          let typeArray = [
            "arts",
            "beauties",
            "educations",
            "entertainments",
            "healths",
            "restaurants",
            "services"
          ];

          var finalArray = [];

          async.map(typeArray, function(name, callback) {
            var finalArray = [];

            db.collection(name).find({ $and: [{ title: new RegExp(req.body.search, "i") }, { "latitude": { $ne: "" } }, { "longitude": { $ne: "" } }, { "latitude": { $ne: null } }, { "longitude": { $ne: null } }, { "latitude": { $exists: true } }, { "longitude": { $exists: true } }] }).toArray(function(err, resultEachType) {
              if (err) throw err;

              callback(null, resultEachType);
            });

          }, function(err, searchResult) {
            // console.log('searchResult:',searchResult);

            var filtered = searchResult.filter(function(el) {
              return el.length != 0;
            });

            var proccess = 0;
            let lastArray = [];

            filtered.forEach(function(element) {
              var nearest = geolib.orderByDistance({
                latitude: req.body.latitude,
                longitude: req.body.longitude
              }, element);

              let newArrayNearest = nearest.splice(0, 20);
              var proccess_new = 0;

              console.log("newArrayNearest:", newArrayNearest);
              proccess++;
              newArrayNearest.forEach(function(element1) {
                element[element1.key].distance = element1.distance;

                // convert finish timestamp
                var finishDate = new Date(element1.finish_date);
                var finishTimestamp = finishDate.getTime();

                // converet now timestamp
                var nowDate = new Date();
                var nowTimestamp = nowDate.getTime();

                element[element1.key].remain = (finishTimestamp - nowTimestamp) / 1000 != 0 ? (finishTimestamp - nowTimestamp) / 1000 : false;
                lastArray.push(element[element1.key]);
                proccess_new++;
                if (filtered.length == proccess && newArrayNearest.length == proccess_new) {

                  res.send(lastArray.sort(compare));
                }
              });

            });
          });
        }
      });
    } else {
      res.status(400).json({ error: "token not existed" });
    }

    console.log("/------------------------- /api/search End ----------------------------/");
  });

  app.post("/api/status", (req, res) => {
    console.log("/------------------------- /api/status Start ----------------------------/");
    console.log("req.body:", req.body);

    if (req.headers.authorization) {

      let token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, secretKey, (error, authData) => {
        if (error) {
          console.log("verify token error:", error);
          res.status(400).json({ error: "token is invalid" });

        } else {
          console.log("authData.tokenData:", authData.tokenData);
          const number = authData.tokenData.number;
          const deviceId = authData.tokenData.deviceId;
          db.collection("users").findOne({ number: number }, { verif_code: 0 }, function(error, status) {

            if (status && status._id) {

              otp.internalUserStatus(req.body.number)
                .then(function(result) {
                  console.log("result internalUserStatus:", result);
                  if(result.body.status == true)
                  {
                    status.active = true;
                    // status.active = false;
                  }else{
                    // status.active = false;
                    status.active = true;
                  }
                  if(status.avatar){
                    status.avatar = "http://takhfifapp.velgardi-game.ir/tmp/" + status.avatar;
                  }else{
                    status.avatar = "http://takhfifapp.velgardi-game.ir/tmp/default-avatar.png";
                  }
                  status.setting_message = setting_message;
                  status.suggestion_message = suggestion_message;
                  status.active_message = active_message;
                  if (status.favorites) {
                    res.send({ status });
                  } else {
                    status.favorites = [];
                    res.send({ status });

                  }
                })
            } else {
              res.status(400).send({ "error": "user not existed" });
            }
          });
        }
      });
    } else {
      res.status(400).json({ error: "token not existed" });
    }

    console.log("/------------------------- /api/status End ----------------------------/");
  });


  app.post("/api/updatepos", (req, res) => {
    console.log("/------------------------- /api/updatepos Start ----------------------------/");
    console.log("req.body:", req.body);

    if (req.headers.authorization) {

      let token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, secretKey, (error, authData) => {
        if (error) {
          console.log("verify token error:", error);
          res.status(400).json({ error: "token is invalid" });

        } else {
          console.log("authData.tokenData:", authData.tokenData);
          console.log("req.body:", req.body);
          const number = authData.tokenData.number;

          // schema for joi
          /*const schema = {
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

          const latitude = req.body[0].latitude;
          const longitude = req.body[0].longitude;

          db.collection("users").update({ number: number }, {
            $set: {
              latitude: latitude,
              longitude: longitude,
              lastUpdate: new Date
            }
          }, function(err, resu) {
            if (err) throw err;
            console.log("user pos updated:");
            res.send({
              msg: "user position updated successfully"
            });
          });
        }
      });
    } else {
      res.status(400).json({ error: "token not existed" });
    }

    console.log("/------------------------- /api/updatepos End ----------------------------/");
  });


  app.post("/api/favorite", (req, res) => {
    console.log("/------------------------- /api/favorite Start ----------------------------/");
    console.log("req.body:", req.body);

    if (req.headers.authorization) {

      let token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, secretKey, (error, authData) => {
        if (error) {
          console.log("verify token error:", error);
          res.status(400).json({ error: "token is invalid" });

        } else {
          console.log("authData.tokenData:", authData.tokenData);
          console.log("req.body:", req.body);
          const number = authData.tokenData.number;

          /*        // schema for joi
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

          const favorite = req.body.favorite;

          db.collection("users").update({ number: number }, { $set: { favorites: req.body.favorites } }, function(err, resu) {
            if (err) throw err;
            console.log("favorite updated:");
            res.send({
              msg: "user favorite updated successfully"
            });
          });
        }
      });
    } else {
      res.status(400).json({ error: "token not existed" });
    }

    console.log("/------------------------- /api/updatepos End ----------------------------/");
  });


  app.post("/api/notification/:id", (req, res) => {
    console.log("/------------------------- /api/notification Start ----------------------------/");
    console.log("req.body:", req.body);
    if (req.headers.authorization) {

      let token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, secretKey, (error, authData) => {
        if (error) {
          console.log("verify token error:", error);
          res.status(400).json({ error: "token is invalid" });

        } else {
          console.log("authData.tokenData:", authData.tokenData);
          console.log("req.body:", req.body);
          const number = authData.tokenData.number;
          const notification_id = req.params.id;

          db.collection("users").update({ number: number }, { $set: { notification: notification_id } }, function(err, resu) {
            if (err) throw err;
            console.log("user notification id updated:");
            res.send({
              msg: "user notification id updated successfully"
            });
          });
        }
      });
    } else {
      res.status(400).json({ error: "token not existed" });
    }

    console.log("/------------------------- /api/notification End ----------------------------/");
  });

});


// app.listen(port,()=> appDebuger(`Listening on port ${port} ...`));
app.listen(port, () => console.log(`Listening on port ${port} ...`));

function sendTelegramNotification(msg) {

  let userArray = [
    71536363,
    94300794
  ];

  userArray.forEach(function(element) {
    // Build the post string from an object
    var post_data = JSON.stringify({
      "token": "711262613:AAEhXJ8YiLNQQb1LIywGBOEI48tE-_nqTPg",
      "chat_id": element,
      // 'message': "Notification recieved!"
      "message": msg
    });


    var post_options = {
      host: "baloot-bot.ir",
      port: "4444",
      //path: '/compile',
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(post_data)
      }
    };

    // Set up the request
    var post_req = http.request(post_options, function(res) {
      res.setEncoding("utf8");
      res.on("data", function(chunk) {
        // console.log('Response for telegram: ' + chunk);
      });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
  });


}

function lowestHighest(myArray) {
  var lowest = Number.POSITIVE_INFINITY;
  var highest = Number.NEGATIVE_INFINITY;
  var tmp;
  for (var i = myArray.length - 1; i >= 0; i--) {
    tmp = myArray[i].distance;
    if (tmp < lowest) lowest = tmp;
    if (tmp > highest) highest = tmp;
  }
  console.log(highest, lowest);
  return { highest, lowest };
}

function compare(a, b) {
  if (a.distance < b.distance)
    return -1;
  if (a.distance > b.distance)
    return 1;
  return 0;
}


function sendSms(code, number) {

  request.post({
    url: "https://niksms.com/fa/publicapi/ptpSms",
    form: {
      username: "09366360042",
      password: "123456zad",
      senderNumber: "9821000550",
      sendType: "1",
      yourMessageIds: Math.floor(Math.random() * 90000000) + 10000000,
      message: "کد ورود به اپلیکیشن ویزنو:" + code,
      numbers: "98" + number.substr(1)
    }
  }, function(err, httpResponse, body) {
    // console.log('httpResponse:',httpResponse);
    console.log("body:", body);
  });


}

/// TODO
/// we must get latitude and longitude and return 20 nearest items


const express = require('express')
const bodyParser = require('body-parser')
const geolib = require('geolib')

// console.log('geolib:',geolib);

const app = express()
const port = 4455

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.post('/', (req, res) => {

    console.log("req.body:",req.body);

    res.send('Hello World!');

    var arrayOfDist = [];
    var newDistance = {latitude: "35.7412", longitude: "51.1756"}

    var newDistance1 = {latitude: "35.7484", longitude: "51.3309"}
    var newDistance2 = {latitude: "35.7777", longitude: "51.4042"}
    var newDistance3 = {latitude: "35.7523", longitude: "51.0745"}

    arrayOfDist.push(newDistance);
    arrayOfDist.push(newDistance1);
    arrayOfDist.push(newDistance2);
    arrayOfDist.push(newDistance3);

console.log("newDistance:",newDistance)
console.log("type newDistance:",typeof newDistance)

var dist = geolib.getDistance(req.body,newDistance);
    console.log("dist:",dist)

console.log("type arrayOfDist:",typeof arrayOfDist)

    var nearest = geolib.orderByDistance(req.body,arrayOfDist);
    console.log("nearest",nearest);

console.log("type arrayOfDist:",typeof arrayOfDist)

var findNearest = geolib.findNearest(req.body,arrayOfDist);
    console.log("findNearest",findNearest);
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
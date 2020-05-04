const PORT = 3006;
const tripFile = "./server/trips.json";
const distFolder = "dist";

const fs = require("fs");
const path = require("path");
const {resolve} = require("path");
var history = require('connect-history-api-fallback');
const cors = require('cors');
var express = require('express');
var app = express();

const staticLocations = path.join(__dirname, "../", '/dist')
const staticFileMiddleware = express.static(staticLocations)

app.use(staticFileMiddleware)
app.use(express.json());
app.use(cors())
const indexFile = resolve(path.join(__dirname, "../", distFolder, "/index.html"))
app.use(history({index: indexFile }))

let trips;
try{
    trips = JSON.parse(fs.readFileSync(tripFile));
} catch (e) {
    fs.writeFileSync(tripFile, JSON.stringify([]));
    trips = [];
}

function writeTrips() {
    if (fs.existsSync(tripFile)) {
        fs.rename(tripFile, tripFile+(new Date()).getTime(), () => {
            fs.writeFileSync(tripFile, JSON.stringify(trips));
        });
    }else{
        fs.writeFileSync(tripFile, JSON.stringify(trips));
    }
}

app.post('/api/addTrip', function(req, res){
    const index = trips.findIndex(elem => {
        return elem.id == req.body.id
    });
    if (index < 0) {
        trips.push(req.body);
    } else {
        trips[index] = req.body
    }
    writeTrips();
    res.send("Success");
});

app.get("/api/trips", (req, res) => {
    res.json(trips);
})

app.get("/api/deleteTrip/:id", (req, res) => {
    const id = req.params.id;
    const index = trips.findIndex(elem => {
        return elem.id == id
    });
    if (index < 0) {
        res.send("Failed")
    } else {
        trips.splice(index, 1);
        res.send("Success");
    }
})

app.get('/', function (req, res) {
    res.render(indexFile)
})

app.listen(PORT);
console.log("Listening at "+PORT);
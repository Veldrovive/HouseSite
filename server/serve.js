const fs = require("fs");
const path = require("path");

const tripFile = path.join(__dirname, "trips", "trips.json");
const PORT = 3006

const history = require('connect-history-api-fallback');
const cors = require('cors');
const express = require('express');
const app = express();

app.use(history())
app.use(express.static(path.join(__dirname, "dist")));
app.use(express.json());
app.use(cors())

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

app.listen(PORT, function () {
    console.log(`Example app listening on port ${PORT}!`);
})
  
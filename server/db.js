import Mongo from "mongodb";
const { MongoClient } = Mongo;
import HouseCollection from "./collections/houses.js";
import UserCollection from "./collections/users.js";

export default class Database {
    static async setup(port=27017, database="house", user="root", password="rootpassword") {
        const url = `mongodb://${user}:${password}@localhost:${port}`;
        const db = new Database();
        const client = await MongoClient.connect(url, { useUnifiedTopology: true })
            .catch(err => console.log("Failed to connect to database due to:", err));
        if (!client)
            return false;

        db.client = client;
        db.inst = client.db(database);

        db.houseCollection = new HouseCollection(db);
        db.userCollection = new UserCollection(db);

        return db;
    }
}

async function main() {
    const db = await Database.setup();
    if (!db) {
        console.log("Failed to get database");
        return;
    }

    const houseId = await db.houseCollection.createHouse("Test House");
    const userOneId = await db.userCollection.addUser("test-token-1", "Aidan", "Dempster");
    const userTwoId = await db.userCollection.addUser("test-token-2", "Rowan", "Dempster");
    const userThreeId = await db.userCollection.addUser("test-token-3", "Rebecca", "Dempster");
    const userFourId = await db.userCollection.addUser("test-token-4", "Mathew", "Beck");
    const oneAdded = await db.houseCollection.addHouseUser(houseId, userOneId);
    const twoAdded = await db.houseCollection.addHouseUser(houseId, userTwoId);
    const threeAdded = await db.houseCollection.addHouseUser(houseId, userThreeId);
    const fourAdded = await db.houseCollection.addHouseUser(houseId, userFourId);

    console.log("Set up users in house");

    const testTripOne = {
        date: new Date(),
        tripName: "Test Trip 1",
        payer: userOneId,
        items: [
            {
                name: "Lettuce",
                cost: 4.90,
                tax: 0.13,
                shortName: "LET",
                splitters: [userTwoId, userOneId] // The object ids of the people paying for this item
            },
            {
                name: "Grapes",
                cost: 8,
                tax: 0.13,
                shortName: "GRP",
                splitters: [userThreeId, userFourId] // The object ids of the people paying for this item
            },
        ],
    }

    const testTripTwo = {
        date: new Date(),
        tripName: "Test Trip 2",
        payer: userOneId,
        items: [
            {
                name: "Lettuce",
                cost: 4.90,
                tax: 0,
                shortName: "LETT",
                splitters: [userTwoId, userOneId] // The object ids of the people paying for this item
            },
            {
                name: "DL",
                cost: 20.9,
                tax: 0.13,
                shortName: "DEV",
                splitters: [userOneId] // The object ids of the people paying for this item
            },
        ],
    }

    console.log("Adding Trips");
    const tripOneId = await db.houseCollection.addTrip(houseId, testTripOne);
    const tripTwoId = await db.houseCollection.addTrip(houseId, testTripTwo);
    console.log("Added Trips");

    try{
        console.log("Extracting trip data");
        const tripSummaries = await db.houseCollection.getTripSummaries(houseId);
        // console.log("Summaries:", tripSummaries);
        const tripTwoData = await db.houseCollection.getTripData(houseId, tripTwoId);
        // console.log("Trip One data:", tripTwoData);
    } catch(err) {
        console.log("Failed to get trip data", err);
    }

    process.on('SIGINT', async function() {
        console.log("Caught interrupt signal");
    
        const houseDeleted = await db.houseCollection.hardDeleteHouse(houseId);
        const userOneDeleted = await db.userCollection.hardDeleteUser(userOneId);
        const userTwoDeleted = await db.userCollection.hardDeleteUser(userTwoId);
        const userThreeDeleted = await db.userCollection.hardDeleteUser(userThreeId);
        const userFourDeleted = await db.userCollection.hardDeleteUser(userFourId);
        console.log("Deleted", houseDeleted, userOneDeleted, userTwoDeleted, userThreeDeleted, userFourDeleted);
        process.exit();
    });
}

// main();
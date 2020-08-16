import Mongo from "mongodb";
import TestCollection from "./collections/test.js";
const MongoClient = Mongo.MongoClient;

class Database {
    static async setup(port=27017, database="house", user="root", password="rootpassword") {
        const url = `mongodb://${user}:${password}@localhost:${port}`;
        const db = new Database();
        const client = await MongoClient.connect(url, { useUnifiedTopology: true })
            .catch(err => console.log("Failed to connect to database due to:", err));
        if (!client)
            return false;

        db.client = client;
        db.inst = client.db("house")

        db.testCollection = new TestCollection(db.inst)

        return db;
    }
}

async function main() {
    const db = await Database.setup();
    if (!db) {
        console.log("Failed to get database");
        return;
    }

    console.log((await db.testCollection.testInsert("Test Title")).result);
    console.log((await db.testCollection.getTest("Test Title")));
}

main();
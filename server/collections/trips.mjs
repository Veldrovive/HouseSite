import Mongo from "mongodb";
const { ObjectID } = Mongo;
import _ from 'lodash';

export default class TripCollection {
    constructor(db) {
        this.db = db;
        this.c = db.inst.collection("trips");

        this.c.createIndex( { houseId: 1, date: 1, name: 1, payer: 1 });
    }

    async addTrip(houseId, tripData) {
        houseId = new ObjectID(houseId);

        tripData.houseId = houseId;
        for (const item of tripData.items) {
            if (!("_id" in item))
                item._id = new ObjectID();
        }

        const res = await this.c.insertOne(tripData);
        this.db.houseCollection.generateVocab(houseId);
        return true;
    }

    validateItems(items, houseUsers) {
        const validItems = [];
        console.log("All users", houseUsers);
        for (const item of items) {
            let { name, cost, tax, shortName, splitters } = item;
            if (!name || typeof name !== "string") throw `All items must have a name`;
            if (!cost || typeof cost !== "number") throw `${name} must have a cost`;
            if (tax === undefined || typeof tax !== "number") tax = 0;
            if (!splitters || splitters.length < 1) throw `${name} must have at least one cost splitter`;
            for (const splitter of splitters) {
                console.log("This splitter", splitter);
                if (!houseUsers.includes(splitter.toString())) throw `All cost splitters for ${name} must be in the house`;
            }
            splitters = splitters.map(id => new ObjectID(id));
            validItems.push({
                name, cost, tax, shortName, splitters
            })
        }
        return validItems;

    }

    async updateTrip(tripId, tripData) {
        tripId = new ObjectID(tripId);

        const { houseId } = await this.c.findOne({ _id: tripId }, { projection: { houseId: 1 } })
        const houseUsers = (await this.db.houseCollection.getHouseUserIds(houseId)).map(item => item.toString());

        const query = { _id: tripId };
        const updatedFields = {};
        const update = { $set: updatedFields };

        if ("date" in tripData) updatedFields.date = new Date(tripData.date);
        if ("name" in tripData) updatedFields.name = tripData.name;
        if ("payer" in tripData) updatedFields.payer = new ObjectID(tripData.payer);
        if ("items" in tripData) updatedFields.items = this.validateItems(tripData.items, houseUsers);

        const res = await this.c.updateOne(query, update);
        this.db.houseCollection.generateVocab(houseId);
        return res.matchedCount > 0;
    }

    async getHouseTrips(houseId) {
        houseId = new ObjectID(houseId);

        const query = { houseId };

        const trips = await this.c.find(query).toArray();

        return trips;
    }

    async getTripSummaries(houseId) {
        houseId = new ObjectID(houseId);

        const houseQuery = { _id: houseId };
        const houseOptions = { projection: { _id: 0, users: 1 } };

        const { users } = await this.db.houseCollection.c.findOne(houseQuery, houseOptions);
        const userData = await this.db.userCollection.getUsersByIds(users);
        const userNames = userData.map(user => `${user.firstName} ${user.lastName}`);
        const userMap = _.zipObject(users, userNames);

        const query = { houseId };

        const trips = await this.c.find(query).toArray();
        
        const summaries = [];
        trips.forEach(async trip => {
            const { date, name, payer, items, _id } = trip;
            const summary = {
                date, name,
                id: _id,
                payer: payer,
                totalCost: 0,
                userCosts: _.zipObject(users, new Array(users.length).fill(0))
            }

            for (const item of items) {
                const { cost, tax, splitters } = item;
                const indivCost = (cost * (1 + tax)) / splitters.length;
                for (const userId of splitters) {
                    summary.userCosts[userId] += indivCost;
                    summary.totalCost += indivCost;
                }
            }

            summaries.push(summary);
        })
        return {userMap, summaries};
    }

    async getTripData(tripId) {
        tripId = new ObjectID(tripId);

        const query = { _id: tripId };
        const trip = await this.c.findOne(query);

        const houseId = trip.houseId;

        const houseQuery = { _id: houseId };
        const houseOptions = { projection: { _id: 0, users: 1 } };

        const { users } = await this.db.houseCollection.c.findOne(houseQuery, houseOptions);
        const userData = await this.db.userCollection.getUsersByIds(users);
        const userNames = userData.map(user => `${user.firstName} ${user.lastName}`);
        const userMap = _.zipObject(users, userNames);

        

        trip["payerName"] = userMap[trip.payer];
        trip["userMap"] = userMap;

        return trip;
    }
}

const tripBase = {
    _id: new ObjectID(),
    houseId: new ObjectID(),
    date: new Date(),
    name: "AName",
    payer: new ObjectID(),
    items: [
        {
            _id: new ObjectID(),
            name: "ItemName",
            cost: 11.90,
            tax: 1.13,
            shortName: "AutofilledValue or undefined",
            splitters: [new ObjectID(),] // The object ids of the people paying for this item
        }
    ],
}
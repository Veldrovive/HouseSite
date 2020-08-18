import Mongo from "mongodb";
import _ from "lodash";
const { ObjectID } = Mongo;

export default class HouseCollection {
    constructor(db) {
        this.db = db;
        this.c = db.inst.collection("houses");

        this.c.createIndex({ name: 1 });
    }

    async createHouse(name, ownerId, userIds) {
        if (!name) {
            throw "House must have a name";
        }

        const users = [ownerId]
        if (userIds) {
            // Javascript please add array comprehensions thanks
            for (const userId of userIds) {
                if (userId !== creatorId) {
                    users.push(new ObjectID(userId));
                }
            }
        }

        const houseObj = {
            _id: new ObjectID(),
            owner: new ObjectID(ownerId),
            joinRequests: [],
            name, users, trips: [], vocab: {}
        }

        const res = await this.c.insertOne(houseObj);
        if (res.insertedCount === 0) {
            throw "Failed to create new house";
        } else {
            return res.insertedId;
        }
    }

    async transferOwner(houseId, newOwnerId) {
        houseId = new ObjectID(houseId);
        newOwnerId = new ObjectID(newOwnerId);

        const query = { _id: houseId };
        const update = { $set: { owner: newOwnerId } };

        const ownerRes = await this.c.updateOne(query, update);
        await this.addHouseUser(houseId, newOwnerId);

        return ownerRes.modifiedCount > 0;
    }

    async addUserJoinRequest(houseId, userId) {
        houseId = new ObjectID(houseId);
        userId = new ObjectID(userId);

        const userIds = (await this.getHouse(houseId)).users.map(user => user._id.toString());
        if (userIds.includes(userId.toString())) {
            throw "User is already in house.";
        }

        const query = { _id: houseId };
        const update = { $addToSet: { joinRequests: userId } };
        const res = await this.c.updateOne(query, update);
        return res.modifiedCount > 0;
    }

    async removeUserJoinRequest(houseId, userId) {
        houseId = new ObjectID(houseId);
        userId = new ObjectID(userId);

        const query = { _id: houseId };
        const update = { $pull: { joinRequests: userId } };
        const res = await this.c.updateOne(query, update);
        return res.modifiedCount > 0;
    }

    async addHouseUser(houseId, userId) {
        houseId = new ObjectID(houseId);
        userId = new ObjectID(userId);

        try {
            const user = await this.db.userCollection.getUserById(userId);
            const query = { _id: houseId }
            const update = { $addToSet: { users: userId } }
            const res = await this.c.updateOne(query, update);
            return res.modifiedCount > 0;
        } catch(err) {
            console.log("Errored on adding house user: ", err);
            throw "User to be added does not exist anymore";
        }
    }

    async hardDeleteHouse(houseId) {
        houseId = new ObjectID(houseId);

        const res = await this.c.deleteOne({ _id: houseId });
        return res["deletedCount"] > 0;
    }

    async getUserHouses(userObjId) {
        userObjId = new ObjectID(userObjId);

        const query = { users: userObjId }
        const options = {
            sort: { name: 1 },
            projection: { _id: 1, name: 1, users: 1, joinRequests: 1, owner: 1 }
        }

        const rawHouses = await this.c.find(query, options).toArray();
        const houses = [];
        for (const house of rawHouses) {
            const { _id, name, users, joinRequests, owner } = house;
            houses.push({
                _id, name, owner,
                users: (await this.db.userCollection.getUsersByIds(users)),
                joinRequests: (await this.db.userCollection.getUsersByIds(joinRequests))
            });
        }
        return houses;
    }

    async getHouse(houseId) {
        houseId = new ObjectID(houseId);

        const query = { _id: houseId };

        const res = await this.c.findOne(query);
        res["users"] = await this.db.userCollection.getUsersByIds(res["users"]);
        res["joinRequests"] = await this.db.userCollection.getUsersByIds(res["joinRequests"]);

        return res;
    }

    async searchHouseByName(houseName) {
        console.log("Searching for", houseName);
        const query = { name: houseName }
        const options = { projection: { _id: 1 } }

        const rawHouses = await this.c.find(query, options).toArray();

        const houses = []
        for (const house of rawHouses) {
            const { name, users, owner } = await this.getHouse(house._id);
            const ownerObj = await this.db.userCollection.getUserById(owner);
            const ownerName = `${ownerObj.firstName} ${ownerObj.lastName}`;
            const userNames = users.map(user => `${user.firstName} ${user.lastName}`);
            const houseObj = {
                name, ownerName,
                id: house._id,
                userNames
            }
            houses.push(houseObj);
        }
        return houses;
    }

    async getHouseUserIds(houseId) {
        const house = await this.getHouse(houseId);
        return house.users.map(user => user._id);
    }

    async updateTrip(houseId, tripId, tripData) {
        houseId = new ObjectID(houseId);
        tripId = new ObjectID(tripId);

        delete tripData._id;
        for (const item of tripData.items) {
            if (!("_id" in item))
                item._id = new ObjectID();
        }

        const query = { _id: houseId, 'trips._id': tripId }
        const update = { $set: { "trips.$": tripData } }

        try {
            const res = await this.c.updateOne(query, update);
            await this.generateVocab(houseId);
            return res.modifiedCount > 0 ? tripId : false;
        } catch (err) {
            console.log("Failed to update trip:", err);
            throw "Failed to update trip";
        }
        
    }

    async addTrip(houseId, tripData) {
        houseId = new ObjectID(houseId);

        tripData._id = new ObjectID();
        for (const item of tripData.items) {
            if (!("_id" in item))
                item._id = new ObjectID();
        }

        const query = { _id: houseId };
        const update = { $push: { trips: tripData } };

        const res = await this.c.updateOne(query, update);
        await this.generateVocab(houseId);
        return res.modifiedCount > 0 ? tripData._id : false;
    }

    async getTripSummaries(houseId) {
        houseId = new ObjectID(houseId);

        const query = { _id: houseId };
        const options = { projection: { _id: 0, trips: 1, users: 1 } };

        const { trips, users } = await this.c.findOne(query, options);

        const userData = await this.db.userCollection.getUsersByIds(users);
        const userNames = userData.map(user => `${user.firstName} ${user.lastName}`);

        const userMap = _.zipObject(users, userNames);
        
        const summaries = [];
        trips.forEach(async trip => {
            const { date, tripName, payer, items } = trip;
            const summary = {
                date, tripName,
                payer: userMap[payer],
                totalCost: 0,
                userCosts: _.zipObject(userNames, new Array(userNames.length).fill(0))
            }

            for (const item of items) {
                const { cost, tax, splitters } = item;
                const indivCost = (cost * (1 + tax)) / splitters.length;
                for (const userId of splitters) {
                    summary.userCosts[userMap[userId]] += indivCost;
                    summary.totalCost += indivCost;
                }
            }

            summaries.push(summary);
        })
        return summaries;
    }

    async getTripData(houseId, tripId) {
        houseId = new ObjectID(houseId);
        tripId = new ObjectID(tripId);

        const query = { _id: houseId };
        const options = { projection: { _id: 0, users: 1, trips: { $elemMatch: {_id: tripId} } } }

        const res = await this.c.findOne(query, options);

        const { users } = res;
        const userData = await this.db.userCollection.getUsersByIds(users);
        const userNames = userData.map(user => `${user.firstName} ${user.lastName}`);
        const userMap = _.zipObject(users, userNames);

        const trip = res.trips[0];
        trip["payerName"] = userMap[trip.payer];
        trip["userMap"] = userMap;

        return trip;
    }

    async generateVocab(houseId) {
        houseId = new ObjectID(houseId);

        const tripsQuery = { _id: houseId };
        const tripsOptions = { projection: { _id: 0, trips: 1 } };

        const house = await this.c.findOne(tripsQuery, tripsOptions);

        const vocab = {}
        house.trips.forEach(trip => {
            try{
                for (const item of trip.items) {
                    const { name, shortName, cost, tax } = item;
                    if (!(name in vocab)) {
                        vocab[name] = {"shortName": {}, "cost": {}, "tax": {}}
                    }
                    if (shortName) {
                        if (!(shortName in vocab[name]["shortName"])) {
                            vocab[name]["shortName"][shortName] = 0
                        }
                        vocab[name]["shortName"][shortName]++;
                    }
                    if (cost) {
                        if (!(cost in vocab[name]["cost"])) {
                            vocab[name]["cost"][cost] = 0
                        }
                        vocab[name]["cost"][cost]++;
                    }
                    if (tax !== undefined) {
                        if (!(tax in vocab[name]["tax"])) {
                            vocab[name]["tax"][tax] = 0
                        }
                        vocab[name]["tax"][tax]++;
                    }
                }
            } catch(err) {
                console.log("Failed to iterate trips:", err);
            }
        });

        const vocabQuery = { _id: houseId };
        const vocabUpdate = { $set: { vocab: vocab } }

        const vocabRes = await this.c.updateOne(vocabQuery, vocabUpdate);
        return vocabRes.modifiedCount > 0;
    }
}

// const houseBase = {
//     _id: new ObjectID(),
//     name: "Nickname for house",
//     owner: new ObjectID(),
//     users: [new ObjectID(),],
//     joinRequests: [new ObjectID(),],
//     trips: [
//         {
//             _id: new ObjectID(),
//             date: new Date(),
//             name: "AName",
//             payer: new ObjectId(),
//             items: [
//                 {
//                     _id: new ObjectID(),
//                     name: "ItemName",
//                     cost: 11.90,
//                     tax: 1.13,
//                     shortName: "AutofilledValue or undefined",
//                     splitters: [new ObjectID(),] // The object ids of the people paying for this item
//                 }
//             ],
//         }
//     ],
//     vocab: {
//         // Vocab stores all items this house has already bought. If the item was autofilled (with a receipt parser or something else)
//         // then its initial value is stored so that in the future we can just use the actual name. All prices it was bought for are
//         // stored so we can give the user a dropdown of prices to fill quickly.
//         "itemName": {"autoFill": ["FilledName1", "FilledName2..."], "price": [10, 11.5, 9], "taxed": [true, false, true, true]}
//     }
// }
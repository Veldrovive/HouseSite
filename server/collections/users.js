import Mongo from "mongodb";
const { ObjectID } = Mongo;

export default class UserCollection {
    constructor(db) {
        this.db = db;
        this.c = db.inst.collection("users");

        this.c.createIndex( { "token": 1 }, { unique: true });
        this.c.createIndex( { firstName: 1, lastName: 1, active: 1, creationDate: 1, lastLogin: 1 });
    }

    async addUser(token, firstName, lastName) {
        const doc = {
            token, firstName, lastName,
            active: true,
            creationDate: new Date(),
            lastLogin: new Date()
        }

        const res = await this.c.insertOne(doc);
        if (res.insertedCount === 0) {
            throw "Failed to add user"
        } else {
            return res.insertedId;
        }
    }

    async hardDeleteUser(userId) {
        userId = new ObjectID(userId);

        const query = { _id: userId };

        const res = await this.c.deleteOne(query);

        return res.deletedCount === 1;
    }

    async getUserById(userId) {
        userId = new ObjectID(userId);

        const query = { _id: userId }

        const user = await this.c.findOne(query)

        if (user) {
            return user;
        } else {
            throw "No such user"
        }
    }

    async getUsersByIds(idArray) {
        const getUserCalls = [];
        for (const id of idArray) {
            getUserCalls.push(this.getUserById(id));
        }

        const users = await Promise.allSettled(getUserCalls);

        return users.map(userData => userData.value);
    }
}

// const userBase = {
//     _id: new ObjectID(),
//     token: "Google Token",
//     firstName: "asdf",
//     lastName: "asdf",
//     active: true, // When a user deletes their account this goes to false
//     creationDate: new Date(),
//     lastLogin: new Date()
// }
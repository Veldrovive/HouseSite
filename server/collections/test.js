export default class TestCollection {
    constructor(db) {
        this.collection = db.collection("test");
    }

    async testInsert(title) {
        return await this.collection.insertOne({ title, date: new Date() });
    }

    async getTest(title) {
        return (await this.collection.find({ title })).toArray();
    }
}
export default class Watcher {
    constructor(db, registeredConnections) {
        this.db  = db;
        this.registeredConnections = registeredConnections;

        this.setupUserWatching();
        this.setupHouseWatching();
        this.setupTripWatching();
    }

    /**
     * Tells other connection objects to send an interaction to their registered user.
     * @param {string[]} userIds A user id or user ids to send interaction to.
     * @param {string} interaction The name of the interaction.
     * @param {any} meta Data sent with the interaction.
     * @param {string} meta The user, house, or trip id that has been modified.
     */
    async sendConnectionInteraction(userIds, interaction, meta, targetId) {
        async function send(userId, interaction, meta, targetId) {
            if (userId in this.registeredConnections) {
                try{
                    await this.registeredConnections[userId].recieveConnectionInteraction(interaction, meta, targetId);
                } catch(err) {
                    console.log("Send interaction errored:", err);
                }
            }
        }
        if (typeof userIds === 'string') {
            send.bind(this)(userIds, interaction, meta, targetId);
        } else {
            for(const userId of userIds) {
                console.log("Sending interaction to", userId);
                send.bind(this)(userId, interaction, meta, targetId);
            }
        }
    }

    async setupHouseWatching() {
        const options = { fullDocument: "updateLookup" };
        const changeStream = this.db.houseCollection.c.watch([], options);
        changeStream.on("change", change => {
            const changeId = change.documentKey._id.toString();
            const operationType = change.operationType;
            const fullDocument = change.fullDocument;
            console.log("A house document changed: ", changeId, operationType, change);
            if (operationType === 'insert') {
                // Then the owner has created a new house.
                const userIds = fullDocument.users;
                console.log("Sending house update to: ", userIds);
                this.sendConnectionInteraction(userIds, 'USER_HOUSES_CHANGED', changeId, changeId);
            }
            if (operationType === 'update' || operationType === 'replace') {
                const userIds = fullDocument.users;
                console.log("Sending house update to: ", userIds);
                this.sendConnectionInteraction(userIds, 'USER_HOUSES_CHANGED', changeId, changeId);
                this.sendConnectionInteraction(userIds, "USER_HOUSE_CHANGED", changeId, changeId);
            }
        })
    }

    async setupUserWatching() {
        const options = { fullDocument: "updateLookup" };
        const changeStream = this.db.userCollection.c.watch([], options);
        changeStream.on("change", change => {
            const changedId = change.documentKey._id.toString();
            const operationType = change.operationType;
            const fullDocument = change.fullDocument;
            console.log("A user document changed: ", changedId, operationType);
            if (operationType === 'update' || operationType === 'replace') {
                this.sendConnectionInteraction(changedId, 'USER_INFO_CHANGED', changedId, changedId);
            }
        })
    }

    async setupTripWatching() {
        const options = { fullDocument: "updateLookup" };
        const changeStream = this.db.tripCollection.c.watch([], options);
        changeStream.on("change", async change => {
            const changeId = change.documentKey._id.toString();
            const operationType = change.operationType;
            const fullDocument = change.fullDocument;
            if (operationType === 'insert') {
                const houseId = fullDocument.houseId;
                const userIds = this.db.houseCollection.getHouseUserIds(houseId);
                this.sendConnectionInteraction(userIds, 'USER_HOUSES_CHANGED', houseId, changeId);
                this.sendConnectionInteraction(userIds, "USER_HOUSE_CHANGED", houseId, changeId);
            } 
            if (operationType === 'update' || operationType === 'replace') {
                const houseId = fullDocument.houseId;
                const userIds = await this.db.houseCollection.getHouseUserIds(houseId);
                this.sendConnectionInteraction(userIds, 'USER_HOUSES_CHANGED', houseId, houseId);
                this.sendConnectionInteraction(userIds, "USER_HOUSE_CHANGED", houseId, houseId);
                this.sendConnectionInteraction(userIds, 'USER_TRIP_CHANGED', changeId, changeId);
            }
        })
    }
}
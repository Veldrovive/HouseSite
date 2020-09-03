const CLIENT_ID = "26627556060-f1t8d58sm3rdh7nm76ev0rf3hohaf4nq.apps.googleusercontent.com";

import Mongo from "mongodb";
const { ObjectID } = Mongo;
import GoogleAuth from "google-auth-library";
const { OAuth2Client } = GoogleAuth;
const googleClient = new OAuth2Client(CLIENT_ID);


export default class Connection {
    constructor(socket, db, registeredUsers) {
        this.registeredUsers = registeredUsers;
        this.db = db;
        this.users = this.db.userCollection;
        this.houses = this.db.houseCollection;
        this.trips = this.db.tripCollection;
        this.socket = socket;
        this.userToken = undefined;
        this.userId = undefined;

        this.setupUnregisteredEndpoints();
        this.setupConnectionInteractions();
    }

    response(endpoint, data) {
        let { meta, error, code } = data || {};
        if (!code) code = error ? 400 : 200;
        const res = {success: !error, code}
        if (error) {
            res.error = error;
        }
        if (meta) {
            res.meta = meta;
        }
        return {endpoint, meta: res};
    }

    setupConnectionInteractions() {
        this.connectionInteractions = {};
        this.addConnectionInteraction("USER_INFO_CHANGED", this.getUser);
        this.addConnectionInteraction("USER_HOUSES_CHANGED", this.getMyHouses);
        this.addConnectionInteraction("USER_HOUSE_CHANGED", this.getHouseInfo);
        this.addConnectionInteraction("USER_TRIP_CHANGED", this.getTrip);
        // this.addConnectionInteraction("USER_REQUEST_JOIN_YOUR_HOUSE", this.getMyHouses);
        // this.addConnectionInteraction("YOUR_USER_JOIN_REQUEST_ACCEPTED", this.getMyHouses);
        // this.addConnectionInteraction("YOUR_HOUSES_UPDATED", this.getMyHouses);
        // this.addConnectionInteraction("YOUR_TRIP_SUMMARIES_UPDATED", this.getTripSummaries);
        // this.addConnectionInteraction("YOUR_TRIP_UPDATED", this.getTrip);
    }

    addConnectionInteraction(interaction, callback) {
        this.connectionInteractions[interaction] = callback.bind(this);
    }

    async recieveConnectionInteraction(interaction, arg, id) {
        console.log("Recieved connection interaction", this.userId, interaction);
        if (interaction in this.connectionInteractions) {
            
            const { meta: data } = await this.connectionInteractions[interaction](arg);
            const { success, code, error, meta } = data;
            console.log("Interaction function returned", interaction, success, code, error);
            if (success) {
                this.socket.emit(interaction, { meta, id });
            } else {
                console.log(`Connection interaction failed: ${code} -`, error);
            }
        }
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
            for(const userId in userIds) {
                send.bind(this)(userId, interaction, meta, targetId);
            }
        }
    }

    on(endpoint, callback) {
        const emittingCallback = async (meta, clientCallback) => {
            const res = await callback.bind(this)(meta);
            clientCallback(res.meta);
        }
        this.socket.on(endpoint, emittingCallback.bind(this));
    }

    remove(endpoint) {
        console.log("Removing", endpoint);
        this.socket.removeAllListeners(endpoint);
    }

    setupUnregisteredEndpoints() {
        this.on("UNREG_TEST", this.testEndpoint);
        this.on("LOGIN", this.login);
        this.on("CREATE_USER", this.createUser);
    }

    removeUnregisteredEndpoints() {
        this.remove("UNREG_TEST");
        this.remove("LOGIN");
        this.remove("CREATE_USER");
    }

    setupRegisteredEndpoints() {
        this.on("REG_TEST", this.testEndpoint);
        this.on("LOGOUT", this.logout);
        this.on("CREATE_HOUSE", this.createHouse);
        this.on("SET_HOUSE_IMAGE", this.setHouseImage);
        this.on("SEARCH_HOUSE", this.searchHouse);
        this.on("JOIN_HOUSE", this.joinHouse);
        this.on("ACCEPT_JOIN_REQUEST", this.acceptJoinRequest);
        this.on("GET_MY_HOUSES", this.getMyHouses);
        this.on("GET_HOUSE_INFO", this.getHouseInfo);
        this.on("GET_TRIP_SUMMARIES", this.getTripSummaries);
        this.on("GET_TRIP", this.getTrip);
        this.on("ADD_TRIP", this.addTrip);
        this.on("UPDATE_TRIP", this.updateTrip);
        this.on("GET_VOCAB", this.getVocab);
    }

    removeRegisteredEndpoints() {
        this.remove("REG_TEST");
        this.remove("LOGOUT");
        this.remove("CREATE_HOUSE");
        this.remove("SEARCH_HOUSE");
        this.remove("JOIN_HOUSE");
        this.remove("ACCEPT_JOIN_REQUEST");
        this.remove("GET_MY_HOUSES");
        this.remove("GET_HOUSE_INFO");
        this.remove("GET_TRIP_SUMMARIES");
        this.remove("GET_TRIP");
        this.remove("ADD_TRIP");
        this.remove("UPDATE_TRIP");
        this.remove("GET_VOCAB");
    }

    testEndpoint(meta) {
        console.log("Test endpoint got: ", meta);
        return this.response("TEST_RESPONSE", { meta: "Test Response Meta" });
    }

    async googleVerify(token) {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        return userid;
    }

    /**
     * Registers this connection as logged in.
     * @param {string} token The google token unique identifier of the user.
     */
    async login(token) {
        console.log("Got a login request");
        try {
            const gId = await this.googleVerify(token);
            const user = await this.users.getUserByToken(gId);
            this.userToken = token;
            this.userId = user._id;
            this.users.registerLogin(this.userId);
            this.registeredUsers[this.userId.toString()] = this;
            this.removeUnregisteredEndpoints();
            this.setupRegisteredEndpoints();
            this.recieveConnectionInteraction('USER_HOUSES_CHANGED');
            return this.response("LOGIN_SUCCESSFUL", { meta: user });
        } catch(err) {
            console.log(err);
            return this.response("LOGIN_FAILED", { error: "No user of that token" });
        }
    }

    /**
     * Resets the connection to no logged in.
     */
    async logout() {
        try {
            delete this.registeredUsers[this.userId];
            this.userToken = undefined;
            this.userId = undefined;

            this.removeRegisteredEndpoints();
            this.setupUnregisteredEndpoints();

            return this.response("LOGOUT_SUCCESSFUL");
        } catch(err) {
            return this.response("LOGOUT_FAILED", { error: err });
        }
    }

    /**
     * Adds a new user to the database as long as the token is not already in the database.
     * @param {{token: string, firstName: string, lastName: string}} meta User data required to create a new user.
     */
    async createUser(meta) {
        const { token, firstName, lastName, email, imgPath } = meta;
        let error = "";
        if (!token) error += "token required. ";
        let gId;
        try {
            gId = await this.googleVerify(token);
        } catch(err) {
            error += "Token rejected by google. ";
        }
        console.log("Got gId:", gId);
        if (!firstName) error += "firstName required. ";
        if (!lastName) error += "lastName required. ";
        if (!email) error += "email required. "
        if (error) {
            return this.response("CREATE_USER_FAILED", { error });
        }

        try {
            const res = await this.users.addUser(gId, firstName, lastName, email, imgPath);
            return this.response("CREATE_USER_SUCCESSFUL");
        } catch(error) {
            console.log(error);
            return this.response("CREATE_USER_FAILED", { error: "Failed to insert user into database", code: 500 });
        }
    }

    async addUserAvatar({ userId, imgBuffer}) {
        // This should add an image to an S3 instance and then set the avatar path for the user.
    }

    async getUser(userId) {
        try {
            const user = await this.users.getUserById(userId);
            return this.response('GET_USER_SUCCESSFUL', { meta: user });
        } catch(error) {
            return this.response('GET_USER_FAILED', { error });
        }
    }

    /**
     * Returns whether the current user is the owner of the house.
     * @param {string} houseId The id of the house to check.
     */
    async isHouseOwner(houseId) {
        const houseOwner = (await this.houses.getHouse(houseId)).owner._id;
        return houseOwner.equals(this.userId);
    }

    /**
     * Returns whether the current user is a member of the house.
     * @param {string} houseId The id of the house to check.
     * @param {string} userOverride A user id used instead of the current user.
     */
    async isInHouse(houseId, userOverride) {
        const user = userOverride ? userOverride : this.userId;
        const myHouseIds = (await this.houses.getUserHouses(user)).map(house => house._id.toString());
        return myHouseIds.includes(houseId.toString());
    }

    /**
     * Gets the user ids for all users in the specified house.
     * @param {string} houseId The id of the house to get the users of.
     */
    async getHouseUserIds(houseId) {
        try {
            const users = (await this.houses.getHouse(houseId)).users;
            return users.map(user => user._id);
        } catch(err) {
            console.log("Get house users failed:", err);
            return [];
        }
    }

    /**
     * Creates a new house under the current user's id.
     * @param {string} name The name for the new house.
     */
    async createHouse(name) {
        try {
            const houseId = await this.houses.createHouse(name, this.userId);
            const house = await this.houses.getHouse(houseId);
            return this.response("CREATE_HOUSE_SUCCESSFUL", { meta: house });
        } catch(error) {
            return this.response("CREATE_HOUSE_FAILED", { error });
        }
    }

    async setHouseImage({ houseId, imgUrl }) {
        console.log("Setting image for ", houseId, "to", imgUrl);
        const updated = await this.houses.setImg(houseId, imgUrl);
        if (updated) {
            return this.response("SET_HOUSE_IMAGE_SUCCESSFULT");
        } else {
            return this.response("SET_HOUSE_IMAGE_FAILED", { error: "House does not exist" });
        }
    }

    /**
     * Transfers a house into a new owner.
     * @param {{houseId: string, ownerId: string}} meta The id of the house and the id of the new owner.
     */
    async transferHouseOwner(meta) {
        const { houseId, ownerId } = meta;
        try {
            if (!(await this.isHouseOwner(houseId))) {
                return this.response("TRANSFER_OWNER_FAILED", { error: "Current user is not house owner." });
            }
            if (!this.getHouseUserIds(houseId).includes(ownerId)) {
                return this.response("TRANSFER_OWNER_FAILED", { error: "New owner is not in the house." });
            }
            const res = await this.houses.transferOwner(houseId, ownerId);
            return this.response("TRANSFER_OWNER_SUCCESSFUL");
        } catch(error) {
            return this.response("TRANSFER_OWNER_FAILED", { error });
        }
    }

    /**
     * Adds the current user to a new house.
     * @param {string} houseId The house id to add the current user to.
     */
    async joinHouse(houseId) {
        try {
            const added = await this.houses.addUserJoinRequest(houseId, this.userId);
            if (added) {
                return this.response("JOIN_HOUSE_SUCCESSFUL");
            } else {
                return this.response("JOIN_HOUSE_FAILED", { error: "User is already in house" });
            }
        } catch(error) {
            console.log(err);
            return this.response("JOIN_HOUSE_FAILED", { error });
        }
    }

    /**
     * Moves a user from the request to join category to joined.
     * @param {{houseId: string, userId: string}} meta The house and user ids to accept the join request.
     */
    async acceptJoinRequest(meta) {
        const { houseId, userId } = meta;
        try {
            if (!(await this.isHouseOwner(houseId))) {
                return this.response("ACCEPT_JOIN_REQUEST_FAILED", "User is not the house owner");
            }
            const joinRequests = (await this.houses.getHouse(houseId)).joinRequests.map(user => user._id.toString());
            console.log(joinRequests, userId, joinRequests.includes(userId))
            if (!joinRequests.includes(userId)) {
                return this.response("ACCEPT_JOIN_REQUEST_FAILED", "User did not request to join house");
            }
            const added = await this.houses.addHouseUser(houseId, userId);
            if (!added) {
                return this.response("ACCEPT_JOIN_REQUEST_FAILED", "Internal Server Error: User was not added to house");
            }
            const requestRemoved = await this.houses.removeUserJoinRequest(houseId, userId);
            return this.response("ACCEPT_JOIN_REQUEST_SUCCESSFUL", { meta: requestRemoved })
        } catch(err) {
            console.log(err);
            return this.response("ACCEPT_JOIN_REQUEST_FAILED", { error: err.toString() });
        }
    }

    /**
     * Searchest for any matching houses.
     * @param {{name: string, houseId: string, memberName: string, memberId: string}} meta Possible criteria to search for.
     */
    async searchHouse(meta) {
        try{
            const { name, houseId, memberName, memberId } = meta;
            if (name) {
                const houses = await this.houses.searchHouseByName(name);
                return this.response("SEARCH_HOUSE_SUCCESSFUL", { meta: houses });
            }
            if (houseId) {
                return this.response("SEARCH_HOUSE_FAILED", { error: "This search criteria is not implemented" });
            }
            if (memberName) {
                return this.response("SEARCH_HOUSE_FAILED", { error: "This search criteria is not implemented" });
            }
            if (memberId) {
                return this.response("SEARCH_HOUSE_FAILED", { error: "This search criteria is not implemented" });
            }
        } catch(err) {
            console.log(err);
            return this.response("SEARCH_HOUSE_FAILED", {error: err.toString() });
        }
    }

    /**
     * Returns a response that has the user's houses in it.
     */
    async getMyHouses() {
        try {
            const houses = await this.houses.getUserHouses(this.userId);
            return this.response("GET_MY_HOUSES_SUCCESSFUL", { meta: houses });
        } catch(err) {
            console.log(err);
            return this.response("GET_MY_HOUSES_FAILED", { error: err.toString() });
        }
    }

    /**
     * Gets the info for a house if the user is in it.
     * @param {string} houseId The id of the house to get the info of.
     */
    async getHouseInfo(houseId) {
        try {
            const house = await this.houses.getHouse(houseId);
            if (!(await this.isInHouse(houseId))) {
                house.isInHouse = false;
                delete house["joinRequests"];
                delete house["tripSummaries"];
                delete house['vocab'];
                return this.response("GET_HOUSE_INFO_SUCCESSFUL", { meta: house });
            } else {
                house.isInHouse = true;
                return this.response("GET_HOUSE_INFO_SUCCESSFUL", { meta: house });
            }
        } catch(err) {
            console.log(err);
            return this.response("GET_HOUSE_INFO_FAILED", { error: err.toString() });
        }
    }

    /**
     * Gest the trip summaries for a house the user is in.
     * @param {string} houseId Gets house to get the trip summaries of.
     */
    async getTripSummaries(houseId) {
        try {
            if (!(await this.isInHouse(houseId))) {
                return this.response("GET_TRIP_SUMMARIES_FAILED", "User is not in house");
            }
            const summaries = await this.trips.getTripSummaries(houseId);
            return this.response("GET_TRIP_SUMMARIES_SUCCESSFUL", { meta: {houseId, summaries} })
        } catch(err) {
            console.log(err);
            return this.response("GET_TRIP_SUMMARIES_FAILED", { error: err.toString() });
        }
    }

    /**
     * Responds with the trip data for a specific trip of a house the current user is in.
     * @param {{houseId: string, tripId: string}} meta The house and trip id to get.
     */
    async getTrip(tripId) {
        // const { houseId, tripId } = meta;
        try {
            const trip = await this.trips.getTripData(tripId);
            const houseId = trip.houseId;
            if (!(await this.isInHouse(houseId))) {
                return this.response("GET_TRIP_FAILED", { error: "User is not in house" });
            }
            return this.response("GET_TRIP_SUCCESSFUL", { meta: trip });
        } catch(err) {
            console.log(err);
            return this.response("GET_TRIP_FAILED", { error: err.toString() });
        }
    }

    /**
     * Constructs a valid trip if the input is valid else error descriptively.
     * @param {string} houseId The id of the house the trip is for.
     * @param {dateString} tripDate A valid date for the trip.
     * @param {string} tripName A name for the trip.
     * @param {string} payer The id of the person paying for the trip.
     * @param {object[]} items An array of item objects.
     */
    async constructTrip(houseId, tripDate, tripName, payer, items) {
        const houseUsers = (await this.houses.getHouseUserIds(houseId)).map(id => id.toString());
        console.log(payer, houseUsers);
        tripDate = new Date(tripDate);
        if (!tripDate || isNaN(tripDate.getTime())) throw "Trip date is malformed";
        if (!payer || !(await this.isInHouse(houseId, payer))) {
            throw "Payer is not in the house";
        }
        if (!tripName || typeof tripName !== "string" || tripName.length < 1) {
            throw "Trip must have a name"
        }
        const trip = {
            active: true,
            date: tripDate,
            name: tripName,
            payer: new ObjectID(payer),
            items: []
        }

        for (const item of items) {
            let { name, cost, tax, shortName, splitters } = item;
            if (!name || typeof name !== "string") throw `All items must have a name`;
            if (!cost || typeof cost !== "number") throw `${name} must have a cost`;
            if (tax === undefined || typeof tax !== "number") tax = 0;
            if (!splitters || splitters.length < 1) throw `${name} must have at least one cost splitter`;
            for (const splitter of splitters) {
                if (!houseUsers.includes(splitter.toString())) throw `All cost splitters for ${name} must be in the house`;
            }
            splitters = splitters.map(id => new ObjectID(id));
            trip.items.push({
                name, cost, tax, shortName, splitters
            })
        }

        return trip;
    }

    /**
     * Adds a new trip to a house the user is in.
     * @param {{houseId: string, 
     *  tripDate: dateString
     *  tripName: string,
     *  payer: string,
     *  items: {name: string, cost: float, tax: float, shortName: string, splitters: string[]}[]
     *  }} meta The parameters that define a trip
     */
    async addTrip(meta) {
        const { houseId, tripDate, tripName, payer, items } = meta;
        try {
            const trip = await this.constructTrip(houseId, tripDate, tripName, payer, items);
            if (!(await this.isInHouse(houseId))) {
                return this.response("ADD_TRIP_FAILED", { error: "User is not in house" });
            }
            const res = await this.trips.addTrip(houseId, trip);
            if (!res) {
                return this.response("ADD_TRIP_FAILED", { error: "Internal Server Error: addTrip failed", code: 500 });
            }
            return this.response("ADD_TRIP_SUCCESSFUL", { meta: res });
            // This should also update the user with the newest house summaries and maybe also spawn a get trip and let the user handle if it is the currently viewed trip
        } catch(err) {
            console.log(err);
            return this.response("ADD_TRIP_FAILED", { error: err.toString() });
        }
    }

    /**
     * Overrides an existing trip with new trip data.
     * @param {{houseId: string, tripId: string, tripData: object}} meta Specifies a specific trip to override and an object to override it with
     */
    async updateTrip(meta) {
        const { houseId, tripId, tripDate, tripName, payer, items } = meta;
        try {
            if (!(await this.isInHouse(houseId))) {
                return this.response("UPDATE_TRIP_FAILED", { error: "User is not in house" });
            }
            const res = await this.trips.updateTrip(tripId, {date: tripDate, name: tripName, payer, items});
            if (!res) {
                return this.response("UPDATE_TRIP_FAILED", { error: "Internal Server Error: udpateTrup failed", code: 500 });
            }
            return this.response("ADD_TRIP_SUCCESSFUL", { meta: res });
        } catch(err) {
            console.log(err);
            return this.response("UPDATE_TRIP_FAILED", { error: err.toString() });
        }
    }

    /**
     * Gets the full vocabulary of a house.
     * @param {string} houseId The id of the house to get the vocab for.
     */
    async getVocab(houseId) {
        try {
            if (!(await this.isInHouse(houseId))) {
                return this.response("GET_VOCAB_FAILED", { error: "User is not in house." });
            }
            const vocab = (await this.houses.getHouse(houseId)).vocab;
            return this.response("GET_VOCAB_SUCCESSFUL", { meta: vocab });
        } catch(err) {
            console.log(err);
            return this.response("GET_VOCAB_FAILED", { error: err.toString() });
        }
    }
}
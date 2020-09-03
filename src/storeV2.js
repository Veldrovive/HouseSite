import Vue from 'vue';
import Vuex from 'vuex';
import io from 'socket.io-client';
import VuexReset from '@ianwalter/vuex-reset';

import { router } from "./main";

Vue.use(Vuex);

const socketUrl = process.env.NODE_ENV === "development" ? "localhost:3006" : location.host;
const socket = io(socketUrl);

socket.on("connection", () => {
    console.log("Connected to websocket server");
})

async function socketGet(endpoint, meta) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject({code: 408, error: "Request timed out"});
        }, 10000);
        console.log("Sending a websocket request:", endpoint);
        socket.emit(endpoint, meta, res => {
            clearTimeout(timeout);
            const { success, code, error, meta } = res;
            if (success) {
                resolve({ code, meta });
            } else {
                reject({ code, error });
            }
        })

    })
}

const userModule = {
    namespaced: true,
    state: ()  => ({
        gAutoFill: {firstName: "", lastName: "", email: "", idToken: "", imgPath: ""},

        loggedIn: false,

        id: "",
        firstName: "",
        lastName: "",
        email: "",
        imgPath: "",
        active: undefined,
        creationDate: undefined,
        lastLogin: undefined,

        loginError: "",
        logoutError: "",
        createUserError: ""
    }),
    mutations: {
        googleAutoFill(state, { firstName, lastName, email, imgPath, idToken }) {
            firstName = firstName ? firstName : state.gAutoFill.firstName;
            lastName = lastName ? lastName : state.gAutoFill.lastName;
            email = email ? email : state.gAutoFill.email;
            imgPath = imgPath ? imgPath : state.gAutoFill.imgPath;
            idToken = idToken ? idToken : state.gAutoFill.idToken;
            state.gAutoFill = { firstName, lastName, email, imgPath, idToken };
        },
        onLoginSuccess(state, { firstName, lastName, active, creationDate, lastLogin, email, imgPath, _id }) {
            state.loggedIn = true;
            if(_id) state.id = _id;
            if(firstName) state.firstName = firstName;
            if(lastName) state.lastName = lastName;
            if(email) state.email = email;
            if(imgPath) state.imgPath = imgPath;
            if(active) state.active = active;
            if(creationDate) state.creationDate = creationDate;
            if(lastLogin) state.lastLogin = lastLogin;

            state.loginError = "";
        },
        onLoginFailed(state, error) {
            state.loggedIn = false;
            state.loginError = error;
        },
        onLogoutSuccess(state) {
            state.googleId = "";
            state.loggedIn = false;
            state.firstName = "";
            state.email = "";
            state.lastName = "";
            state.imgPath = "";
            state.active = undefined;
            state.creationDate = undefined;
            state.lastLogin = undefined;

            state.logoutError = "";
        },
        onLogoutFailed(state, error) {
            state.logoutError = error;
        },
        onCreateUserFailed(state, error) {
            state.createUserError = error;
        },

        reset: () => {}
    },
    actions: {
        async googleAutoFill({ commit, state, dispatch }, { firstName, lastName, email, imgPath, idToken, manualLogin }) {
            commit('googleAutoFill', { firstName, lastName, email, imgPath, idToken });
            if (state.loggedIn) {
                dispatch('logout');
            }
            try {
                const { meta } = await socketGet("LOGIN", idToken);
                if (manualLogin) {
                    router.push('/profile').catch(() => {});
                }
                commit("onLoginSuccess", meta);
            } catch({ code, error }) {
                if (manualLogin) {
                    console.log(`Login failed because ${error} - ${code}`);
                    commit("onLoginFailed", error);
                    commit('modals/createUser/showCreateUser', {}, { root: true });
                    // router.push("/createUser").catch(() => console.log("Failed to navigate"));
                } else {
                    console.log(`ERRORING SILENTLY: Login failed because ${error} - ${code}`)
                }
            }
        },
        async login({ commit }, { token, manualLogin = false }) {
            try {
                const { meta } = await socketGet('LOGIN', token);
                if (manualLogin) {
                    router.push('/profile').catch(() => {});
                }
                commit('onLoginSuccess', meta);
            } catch({ code, error }) {
                console.log(`Login failed because ${error} - ${code}`);
            }
        },
        async logout({ commit, dispatch }) {
            console.log("Emitting LOGOUT");
            try {
                const { code, meta } = await socketGet("LOGOUT");
                console.log(`Logout successful: ${meta} - ${code}`);
                dispatch('defaults');
                commit("house/reset", {}, { root: true });
            } catch({ code, error }) {
                console.log(`Logout failed because ${error} - ${code}`);
                commit("onLogoutFailed", error);
            }
        },
        async createUser({ commit, dispatch }, { token, firstName, imgPath, lastName, email }) {
            console.log("Emitting CREATE_USER", { token, firstName, imgPath, lastName, email })
            try {
                const { code, meta } = await socketGet("CREATE_USER", { token, firstName, imgPath, lastName, email });
                console.log(`Create user successful: ${meta} - ${code}`);
            } catch({ code, error }) {
                console.log(`Create user failed because ${error} - ${code}`);
                commit("createUserError", error);
                return;
            }

            await dispatch('login', {token, manualLogin: true}).catch(err => console.log("Failed to login after create user", err));
        },

        defaults({ commit, state }) {
            const autoFilled = state.gAutoFill;
            commit('reset');
            commit('googleAutoFill', autoFilled);
        },
    }
}

const houseModule = {
    namespaced: true,
    state: () => ({
        searchCiteria: {type: "name", value: ""},
        searchResult: null,

        myHouses: null,

        // We store ids so that dynamic updates only change ui if it matches the current id
        currHouseId: "",
        currHouse: null,
        currHouseTripSummaries: null,
        currVocab: null,

        currTripId: "",
        currTrip: null
    }),
    getters: {
        currHouseOwedInfo(state, none, rootState) {
            const summaries = state.currHouse.tripSummaries.summaries;
            const userId = rootState.user.id;
            const netOwed = {};
            for (const owerId of Object.keys(state.currHouse.tripSummaries.userMap)) {
                if (userId !== owerId) {
                    netOwed[owerId] = 0;
                }
            }
            for (const tripSummary of summaries) {
                if (tripSummary.payer !== userId) {
                    // Then the current user will owe for this trip.
                    netOwed[tripSummary.payer] += tripSummary.userCosts[userId];
                } else {
                    // Then all others will owe the current user for this trip.
                    for (const owerId of Object.keys(tripSummary.userCosts)) {
                        if (owerId !== userId) {
                            netOwed[owerId] -= tripSummary.userCosts[owerId];
                        }
                    }
                }
            }
            return netOwed;
        },
        myHousesOwedInfo(state, none, rootState) {
            const userId = rootState.user.id;
            const owedInfos = {};
            for (const house of state.myHouses) {
                const summaries = house.tripSummaries.summaries;
                const netOwed = {};
                for (const owerId of Object.keys(house.tripSummaries.userMap)) {
                    if (userId !== owerId) {
                        netOwed[owerId] = 0;
                    }
                }
                for (const tripSummary of summaries) {
                    if (tripSummary.payer !== userId) {
                        // Then the current user will owe for this trip.
                        netOwed[tripSummary.payer] += tripSummary.userCosts[userId];
                    } else {
                        // Then all others will owe the current user for this trip.
                        for (const owerId of Object.keys(tripSummary.userCosts)) {
                            if (owerId !== userId) {
                                netOwed[owerId] -= tripSummary.userCosts[owerId];
                            }
                        }
                    }
                }
                owedInfos[house._id] = netOwed;
            }
            return owedInfos;
        },
        historicalOwedInfo(state, none, rootState) {
            if(!state.myHouses) {
                return [];
            }
            const allSummaries = [].concat(...state.myHouses.map(house => house.tripSummaries.summaries));
            const ownId = rootState.user.id;
            const summaryNetCosts = allSummaries.map(summary => {
                const date = summary.date;
                let currentUserPayed = false;
                let netCost = 0;
                if (summary.payer === ownId) {
                    // Then the current user payed and the net cost to the user should be negative.
                    currentUserPayed = true;
                    for (const userId of Object.keys(summary.userCosts)) {
                        if (userId !== ownId) {
                            // Subtract off all the costs that other users pay to the current user.
                            netCost -= summary.userCosts[userId];
                        }
                    }
                } else {
                    // Then another person payed and the net cost is the amount this user payed.
                    netCost = summary.userCosts[ownId];
                }
                return {date, netCost, currentUserPayed, name: summary.name};
            });
            // We then arrange the array by date and integrate the net costs to get the total amount owed at any given time.
            summaryNetCosts.sort((a, b) => a.date > b.date ? 1 : -1);
            let totalOwed = 0;
            const summaryTotalCosts = summaryNetCosts.map(summary => {
                totalOwed += summary.netCost;
                return {date: summary.date, netCost: summary.netCost.toFixed(2), totalOwed: totalOwed.toFixed(2), currentUserPayed: summary.currentUserPayed, name: summary.name};
            });
            return summaryTotalCosts;
        }
    },
    mutations: {
        searchCriteriaChanged(state, { type, value }) {
            if(type) state.searchCiteria.type = type;
            if(value) state.searchCiteria.value = value;
        },
        searchCompleted(state, result) {
            state.searchResult = result ? result : null;
        },

        myHousesUpdated(state, result) {
            state.myHouses = result ? result : null;
        },

        houseIdSelected(state, id) {
            state.currHouseId = id ? id : "";
        },
        houseIdDeselected(state) {
            state.currHouseId = "";
            state.currHouse = null;
            state.summaries = null;
            state.vocab = null;
        },
        getHouseCompleted(state, house) {
            if (house) {
                state.currHouse = house;
                state.summaries = house.tripSummaries;
            } else {
                state.currHouse = null;
                state.summaries = null;
            }
        },
        getHouseTripSummariesCompleted(state, summaries) {
            state.summaries = summaries ? summaries : null;
        },
        getVocabCompleted(state, vocab) {
            state.vocab = vocab ? vocab : null;
        },

        tripIdSelected(state, id) {
            state.currTripId = id ? id : "";
        },
        getTripCompleted(state, trip) {
            state.currTrip = trip ? trip : null;
        },

        reset: () => {}
    },
    actions: {
        async createHouse(none, name) {
            console.log("Creating house: ", name);
            try {
                const { code, meta: house} = await socketGet('CREATE_HOUSE', name);
                console.log("Created new house", code, house);
            } catch(error) {
                console.log(error);
                // console.log(`Create House failed: ${code} - ${error}`);
            }
        },
        async getSearch({ commit, state }, { type, value }) {
            commit('searchCriteriaChanged', { type, value })
            try {
                const searchObj = {};
                searchObj[state.searchCiteria.type] = state.searchCiteria.value;
                const { code, meta: houses } = await socketGet('SEARCH_HOUSE', searchObj);
                console.log(`Got searched houses: ${code}`);
                commit('searchCompleted', houses);
            } catch({ error, code }) {
                console.log(`Search failed: ${code} - ${error}`);
            }
        },

        async updateMyHouses({ commit }) {
            try {
                const { code, meta: houses } = await socketGet('GET_MY_HOUSES');
                console.log(`Got my houses: ${code}`);
                commit('myHousesUpdated', houses);
            } catch({ error, code }) {
                console.log(`Failed to get my houses: ${code} -`, error);
            }
        },

        setCurrentHouse({ commit, dispatch }, houseId) {
            commit('houseIdSelected', houseId);
            dispatch('getCurrentHouse').catch(err => console.log(err));
            dispatch('getCurrentVocab').catch(err => console.log(err));
        },
        async getCurrentHouse({ commit, state }) {
            try {
                const { meta: house } = await socketGet('GET_HOUSE_INFO', state.currHouseId);
                commit('getHouseCompleted', house);
            } catch({ error, code }) {
                console.log(`Failed to get current house: ${code} -`, error);
            }
        },
        async getCurrentTripSummaries({ commit, state }) {
            try {
                const { code, meta: summaries } = await socketGet('GET_TRIP_SUMMARIES', state.currHouseId);
                console.log(`Got summaries ${code}`);
                commit('getHouseTripSummariesCompleted', summaries);
            } catch({ error, code }) {
                console.log(`Failed to get trip summaries ${code} -`, error);
            }
        },
        async getCurrentVocab({ commit, state }) {
            try {
                const { meta: vocab } = await socketGet('GET_VOCAB', state.currHouseId);
                commit('getVocabCompleted', vocab);
            } catch({ error, code }) {
                console.log(`Failed to get vocab ${code} -`, error);
            }
        },

        async setCurrHouseImg({ state }, img) {
            try {
                await socketGet('SET_HOUSE_IMAGE', { houseId: state.currHouseId, imgUrl: img });
            } catch({ error, code }) {
                console.log(`Failed to set img ${code} -`, error);
            }
        },

        async requestJoinCurrentHouse({ state }) {
            try {
                await socketGet('JOIN_HOUSE', state.currHouseId);
            } catch({ error, code }) {
                console.log(`Failed to request join house ${code} -`, error);
            }
        },
        async acceptJoinRequest({ state }, userId) {
            try {
                await socketGet('ACCEPT_JOIN_REQUEST', {
                    houseId: state.currHouseId,
                    userId
                });
            } catch({ error, code }) {
                console.log(`Failed to accept user ${code} -`, error);
            }
        },

        setCurrentTrip({ commit, dispatch }, tripId) {
            commit('tripIdSelected', tripId);
            dispatch('getCurrentTrip');
        },
        async getCurrentTrip({ commit, state }) {
            try {
                const { code, meta: trip } = await socketGet('GET_TRIP', state.currTripId);
                console.log(`Got trip: ${code}`);
                commit('getTripCompleted', trip);
            } catch({ error, code }) {
                console.log(`Gailed to get trip ${code} -`, error);
            }
        },
        async addTrip({ state }, meta) {
            // Items must be in form {name, cost, tax, shortName, splitters}
            const { tripDate, tripName, payer, items } = meta;
            try {
                console.log(tripDate, tripName, payer, items)
                await socketGet('ADD_TRIP', {houseId: state.currHouseId, tripDate, tripName, payer, items});
            } catch(error) {
                console.log('Failed to add trip: ', error);
            }
        },
        async updateTrip({ state }, meta) {
            // Items must be in form {name, cost, tax, shortName, splitters}
            const { tripDate, tripName, payer, items } = meta;
            try {
                await socketGet('UPDATE_TRIP', {
                    houseId: state.currHouseId, tripId: state.currTripId,
                    tripDate, tripName, payer, items
                });
            } catch(error) {
                console.log('Failed to update trip: ', error);
            }
        }
    }
}

const modalModule = {
    namespaced: true,
    modules: {
        createHouse: {
            namespaced: true,
            state: () => ({
                shown: false,

                name: ""
            }),
            mutations: {
                showCreateHouse(state) {
                    state.shown = true;
                },
                hideCreateHouse(state) {
                    state.shown = false;
                },

                setName(state, name) {
                    state.name = name;
                }
            }
        },
        createUser: {
            namespaced: true,
            state: () => ({
                shown: false,
            }),
            mutations: {
                showCreateUser(state) {
                    state.shown = true;
                },
                hideCreateUser(state) {
                    state.shown = false;
                }
            }
        },
        setHouseImg: {
            namespaced: true,
            state: () => ({
                shown: false,

                imgUrl: ""
            }),
            mutations: {
                showSetHouseImg(state) {
                    state.shown = true;
                },
                hideSetHouseImg(state) {
                    state.shown = false;
                },

                setUrl(state, imgUrl) {
                    state.imgUrl = imgUrl;
                }
            }
        }
    }
}

const store = new Vuex.Store({
    plugins: [VuexReset()],
    modules: {
        user: userModule,
        house: houseModule,
        modals: modalModule
    }
})

function setupDatabaseWatch() {
    const userCommit = (mutation, data) => store.commit(`user/${mutation}`, data);
    const houseState = store.state.house;
    const houseCommit = (mutation, data) => store.commit(`house/${mutation}`, data);
    socket.on('USER_INFO_CHANGED', ({ meta: updatedValues }) => {
        userCommit('onLoginSuccess', updatedValues);
    });
    socket.on('USER_HOUSES_CHANGED', ({ meta: houses }) => {
        console.log('User houses changed', houses);
        houseCommit('myHousesUpdated', houses);
    });
    socket.on('USER_HOUSE_CHANGED', ({ id: houseId, meta: house }) => {
        console.log("House changed: ", houseId, houseState.currHouseId);
        if (houseId.toString() === houseState.currHouseId) {
            houseCommit('getHouseCompleted', house);
        }
    });
    socket.on('USER_HOUSE_SUMMAIRES_CHANGED', ({ id: houseId, meta: summaries }) => {
        if (houseId.toString() === houseState.currHouseId) {
            houseCommit('getHouseTripSummariesCompleted', summaries);
        }
    });
    socket.on('USER_HOUSE_VOCAB_CHANGED', ({ houseId, vocab }) => {
        if (houseId.toString() === houseState.currHouseId) {
            houseCommit('getVocabCompleted', vocab);
        }
    });
    socket.on('USER_TRIP_CHANGED', ({ id: tripId, meta: trip }) => {
        console.log("Trip changed:", trip);
        if (tripId.toString() === houseState.currTripId) {
            houseCommit('getTripCompleted', trip);
        }
    })
}

setupDatabaseWatch();

export default store
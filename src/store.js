import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import shortid from 'shortid'
import { router, ls } from './main'

Vue.use(Vuex)

const people = ["Aidan", "Teresa", "Nasser", "Melisa", "Wadee", "Shebri"]

function safeParse(json) {
    if (typeof(json) === "object") {
        return json;
    }
    try {
        return JSON.parse(json);
    } catch(err) {
        return false;
    }
}

class Trip {
    date = new Date()
    name = ""
    payer = ""
    people = []
    items = []
    id

    constructor(people) {
        this.people = people;
        this.id = shortid.generate();
    }

    static load(jsonObj) {
        const trip = new Trip(people); // new Trip(jsonObj.people);
        trip.date = new Date(jsonObj.date);
        trip.name = jsonObj.name;
        trip.payer = jsonObj.payer;
        trip.items = jsonObj.items;
        trip.id = jsonObj.id;
        return trip;
    }

    static loadFromLS(people) {
        if (people === undefined) {
            people = ls.get('people');
        }
        const trip = new Trip(people);
        trip.date = new Date(ls.get('date', ""));
        trip.name = ls.get('name', "");
        trip.payer = ls.get('payer', "");
        trip.items = safeParse(ls.get('items', []));
        trip.id = ls.get('id', shortid.generate());
        return trip
    }

    saveToLS() {
        ls.set('people', this.people);
        ls.set('date', this.date.toUTCString());
        ls.set('name', this.name);
        ls.set('payer', this.payer);
        ls.set('items', JSON.stringify(this.items))
        ls.set('id', this.id);
    }

    changeItemMeta(index, prop, val) {
        this.items[index][prop] = val;
        this.saveToLS();
    }
    changeItemPeople(index, checked, person) {
        const splittersArray = this.items[index].costSpliters;
        if (checked) {
            splittersArray.push(person)
        }else{
            const dataIndex = splittersArray.indexOf(person);
            if (dataIndex > -1) {
                splittersArray.splice(dataIndex, 1);
            }
        }
        this.saveToLS();
    }
    selectOnePerson(index, person) {
        this.items[index].costSpliters = [person];
        this.saveToLS();
    }
    addRow() {
        this.items.push({"itemName": "", "itemCost": 0, "costSpliters": [...this.people]})
        this.saveToLS();
    }

    getTotalCost() {
        let cost = 0;
        for(const item of this.items) {
            cost += item.itemCost
        }
        return cost;
    }

    getIndivCost() {
        const index_map = {}
        const costs = [];
        for (const person of this.people) {
            index_map[person] = costs.length;
            costs.push({"name": person, "cost": 0});
        }
        for (const item of this.items) {
            const marginalCost = item.itemCost / item.costSpliters.length
            for (const person of item.costSpliters) {
                const index = index_map[person]
                costs[index].cost += marginalCost
            }
        }
        console.log("Costs:", costs);
        return costs;
    }

    validate() {
        if (this.name.length < 1) return "Trip name must be set";
        if (this.date <= new Date(0) || !this.date ) return "Trip date must be set";
        if (!this.payer) return "The person who paid must be set as the payer";
        if (this.items.length < 1) return "Trip must have at least one item";
        return false;
    }
}

const itemsModule = {
    namespaced: true,
    state: {
        allTrips: [],
        currTrip:  new Trip(people) // Trip.loadFromLS(["Aidan", "Teresa", "Nasser", "Melisa", "Wadee"])
    },
    getters: {
        people: () => {
            return people;
            // return state.currTrip.people;
        },
        currItems: state => {
            return state.currTrip.items;
        },
        currTotalCost: state => {
            return state.currTrip.getTotalCost();
        },
        currIndivCost: state => {
            return state.currTrip.getIndivCost();
        },
        tripName: state => {
            return state.currTrip.name;
        },
        tripPayer: state => {
            return state.currTrip.payer;
        },
        tripDate: state => {
            return state.currTrip.date;
        },
        tripPeople: state => {
            return state.currTrip.people;
        },
        pastTrips: state => {
            return state.allTrips;
        }
    },
    mutations: {
        onItemMetaChange(state, args) {
            const {index, prop, val} = args;
            state.currTrip.changeItemMeta(index, prop, val);
        },
        onItemPersonChange(state, args) {
            const {checked, person, dataIndex} = args;
            state.currTrip.changeItemPeople(dataIndex, checked, person);
        },
        onDisableOtherPeople(state, args) {
            const {index, person} = args;
            state.currTrip.selectOnePerson(index, person);
        },
        setName(state, name) {
            state.currTrip.name = name;
            state.currTrip.saveToLS();
        },
        setDate(state, date) {
            state.currTrip.date = date;
            state.currTrip.saveToLS();
        },
        setPayer(state, payer) {
            state.currTrip.payer = payer;
            state.currTrip.saveToLS();
        },
        addRow(state) {
            state.currTrip.addRow();
        },
        resetTrip(state) {
            state.currTrip = new Trip(people);
            state.currTrip.saveToLS();
        },
        recallTripFromLS(state) {
            state.currTrip = Trip.loadFromLS(people);
        },
        recallOldTrip(state, index) {
            state.currTrip = state.allTrips[index];
            router.push("/shopping");
            state.currTrip.saveToLS();
        },
        setOldTrips(state, trips) {
            state.allTrips = trips;
        }
    },
    actions: {
        saveTrip({ commit, dispatch, state }) {
            const trip = state.currTrip;
            const err = trip.validate()
            if (err) {
                alert(err)
            }else{
                const handle = () => {
                    router.push("/");
                    commit("resetTrip");
                    dispatch('getOldTrips');
                }
                axios
                    .post("api/addTrip", trip)
                    .then(() => {
                        handle();
                    })
                    .catch(() => {
                        axios.post("http://127.0.0.1:3006/api/addTrip", trip)
                            .then(() => {
                                handle();
                            })
                    })
            }
        },
        getOldTrips({ commit }) {
            const handle = res => {
                console.log("Handling:", res);
                const objects = [];
                for (const obj of res.data) {
                    objects.push(Trip.load(obj));
                }
                console.log("Old Trips: ", objects);
                commit('setOldTrips', objects);
            }
            console.log("Getting old trups")
            axios
                .get("api/trips")
                .then(res => {
                    console.log("Got old trips")
                    handle(res);
                })
                .catch(() => {
                    console.log("Failed when getting old trips")
                    axios.get("http://127.0.0.1:3006/api/trips")
                        .then(res => {
                            handle(res);
                        })
                    }
                )
        },
        deleteOldTrip({ dispatch }, id) {
            const handle = () => {
                dispatch('getOldTrips');
            }
            axios
                .get(`api/deleteTrip/${id}`)
                .then(() => {
                    handle();
                })
                .catch(() => {
                    axios.get(`http://127.0.0.1:3006/api/deleteTrip/${id}`)
                        .then(() => {
                            handle();
                        })
                })
        }
    }
}

const store = new Vuex.Store({
    modules: {
        items: itemsModule
    }
})

export default store
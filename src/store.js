import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import shortid from 'shortid'
import { router } from './main'

Vue.use(Vuex)

class Trip {
    date = false
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
        const trip = new Trip(jsonObj.people);
        trip.date = new Date(jsonObj.date);
        trip.name = jsonObj.name;
        trip.payer = jsonObj.payer;
        trip.items = jsonObj.items;
        trip.id = jsonObj.id;
        return trip;
    }

    changeItemMeta(index, prop, val) {
        this.items[index][prop] = val;
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
    }
    selectOnePerson(index, person) {
        this.items[index].costSpliters = [person];
    }
    addRow() {
        this.items.push({"itemName": "", "itemCost": 0, "costSpliters": [...this.people]})
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
        return costs;
    }

    

    validate() {
        if (this.name.length < 1) return "Trip name must be set";
        if (this.date <= new Date(0) || !this.date ) return "Trip date must be set";
        if (this.items.length < 1) return "Trip must have at least one item";
        return false;
    }
}

const itemsModule = {
    namespaced: true,
    state: {
        allTrips: [],
        currTrip: new Trip(["Aidan", "Teresa", "Nasser", "Melisa", "Wadee"])
    },
    getters: {
        people: state => {
            return state.currTrip.people;
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
        },
        setDate(state, date) {
            state.currTrip.date = date;
        },
        setPayer(state, payer) {
            state.currTrip.payer = payer
        },
        addRow(state) {
            state.currTrip.addRow();
        },
        saveTrip(state) {
            state.currTrip = new Trip(["Aidan", "Teresa", "Nasser", "Melisa", "Wadee"]);
        },
        recallOldTrip(state, index) {
            state.currTrip = state.allTrips[index];
            router.push("/shopping");
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
                axios
                    .post("http://127.0.0.1:3006/api/addTrip", trip)
                    .then(() => {
                        router.push("/");
                        commit("saveTrip");
                        dispatch('getOldTrips');
                    })
            }
        },
        getOldTrips({ commit }) {
            axios
                .get("http://127.0.0.1:3006/api/trips")
                .then(res => {
                    const objects = [];
                    for (const obj of res.data) {
                        objects.push(Trip.load(obj));
                    }
                    commit('setOldTrips', objects);
                })
        },
        deleteOldTrip({ dispatch }, id) {
            console.log("Deleting", id);
            axios
                .get(`http://127.0.0.1:3006/api/deleteTrip/${id}`)
                .then(() => {
                    dispatch('getOldTrips');
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
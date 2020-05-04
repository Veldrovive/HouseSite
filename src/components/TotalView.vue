<template>
    <div>
        <b-table-simple v-if="pastTrips.length > 0" striped hover>
            <b-thead>
                <b-tr>
                    <b-th>Trip Name</b-th>
                    <b-th>Payer</b-th>
                    <b-th>Trip Date</b-th>
                    <b-th v-for="(person, index) in pastTrips[0].getIndivCost()" :key="index">{{ person.name }}</b-th>
                </b-tr>
            </b-thead>
            <b-tbody>
                <b-tr v-for="(trip, index) in pastTrips" :key="index">
                    <b-td @click="recallOldTrip(index)">{{ trip.name }}</b-td>
                    <b-td @click="recallOldTrip(index)">{{ trip.payer }}</b-td>
                    <b-td @click="recallOldTrip(index)">{{ trip.date.toDateString() }}</b-td>
                    <b-td v-for="(cost, indivIndex) in trip.getIndivCost()" :key="indivIndex" @click="recallOldTrip(index)">${{ cost.cost.toFixed(2) }}</b-td>
                    <b-td><b-button @click="deleteOldTrip(trip.id)">Delete</b-button></b-td>
                </b-tr>
            </b-tbody>
            <b-tfoot>
                <b-tr v-for="(payee, index) in totalCosts" :key="index">
                    <b-td></b-td>
                    <b-td></b-td>
                    <b-td><b>Pay to {{ payee.toPay }}:</b></b-td>
                    <b-td v-for="(person, index) in tripPeople" :key="index">${{ payee[person].toFixed(2) }}</b-td>
                </b-tr>
            </b-tfoot>
        </b-table-simple>
        <template v-else>
            <p id="noTripsMessage">Add a shopping trip to begin</p>
        </template>
        <b-button @click="$router.push('/shopping')">Add Trip</b-button>
    </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex"

export default {
    name: "Total",
    computed: {
        ...mapGetters("items", ["pastTrips", "tripPeople"]),
        totalCosts() {
            if (this.pastTrips.length > 0) {
                const people = this.pastTrips[0].people;
                const index_map = {};
                const costs = [];
                for (const person of ["Net Cost", ...people]) {
                    index_map[person] = costs.length;
                    const payObj = {"toPay": person}
                    for (const inPerson of people) {
                        payObj[inPerson] = 0;
                    }
                    costs.push(payObj)
                }
                for (const trip of this.pastTrips) {
                    const tripCost = trip.getIndivCost();
                    const payer = trip.payer;
                    for (const indivCost of tripCost) {
                        const person = indivCost.name;
                        costs[index_map["Net Cost"]][person] += indivCost.cost;
                        costs[index_map[payer]][person] += indivCost.cost;
                    }
                }
                return costs;
            } else {
                return false;
            }
        }
    },
    created: function() {
        const test = this.totalCosts;
        console.log(test);
    },
    methods: {
        ...mapMutations("items", ["recallOldTrip"]),
        ...mapActions("items", ["deleteOldTrip"])
    }
}
</script>

<style scoped>
#noTripsMessage {
    margin: 20px;
}
</style>
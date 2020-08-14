<template>
    <div id="totalViewContainer">
        <div id="tripsTableContainer">
            <b-table-simple v-if="pastTrips.length > 0" striped hover sticky-header="100%"> 
                <b-thead>
                    <b-tr>
                        <b-th>Trip Name</b-th>
                        <b-th>Payer</b-th>
                        <b-th>Trip Date</b-th>
                        <b-th v-for="(person, index) in people" :key="index">{{ person }}</b-th>
                        <b-th></b-th>
                    </b-tr>
                </b-thead>
                <b-tbody>
                    <b-tr v-for="(trip, index) in pastTrips" :key="index">
                        <b-td @click="recallOldTrip(index)">{{ trip.name }}</b-td>
                        <b-td @click="recallOldTrip(index)">{{ trip.payer }}</b-td>
                        <b-td @click="recallOldTrip(index)">{{ trip.date.toDateString() }}</b-td>
                        <b-td v-for="(cost, indivIndex) in trip.getIndivCost()" :key="indivIndex" @click="recallOldTrip(index)">${{ (cost.cost*1.13).toFixed(2) }}</b-td>
                        <b-td><b-button @click="deleteOldTrip(trip.id)">Delete</b-button></b-td>
                    </b-tr>
                </b-tbody>
                <b-tfoot>
                    <b-tr v-for="(payee, index) in Object.keys(netCosts)" :key="index">
                        <b-td></b-td>
                        <b-td></b-td>
                        <b-td><b>Pay to {{ payee }}:</b></b-td>
                        <b-td v-for="(person, index) in tripPeople" :key="index">${{ (netCosts[payee][person]*1.13).toFixed(2) }} (${{ netCosts[payee][person].toFixed(2) }})</b-td>
                    </b-tr>
                </b-tfoot>
            </b-table-simple>
            <template v-else>
                <p id="noTripsMessage">Add a shopping trip to begin</p>
            </template>
        </div>
        <b-button @click="$router.push('/shopping')" id="total_view_add_trip">Add Trip</b-button>
    </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex"

export default {
    name: "Total",
    computed: {
        ...mapGetters("items", ["pastTrips", "tripPeople", "people"]),
        totalCosts() {
            if (this.pastTrips.length > 0) {
                const people = this.pastTrips[0].people;
                const costs = {"Net Cost": {}};
                for (const person of people) costs["Net Cost"][person] = 0;
                for (const payer of people) {
                    costs[payer] = {};
                    for (const payee of people) {
                        costs[payer][payee] = 0;
                    }
                }
                for (const trip of this.pastTrips) {
                    const tripCost = trip.getIndivCost();
                    const payer = trip.payer;
                    for (const indivCost of tripCost) {
                        const person = indivCost.name;
                        costs["Net Cost"][person] += indivCost.cost;
                        costs[payer][person] += indivCost.cost;
                    }
                }
                return costs;
            } else {
                return false;
            }
        },
        netCosts() {
            const totalCosts = this.totalCosts;
            const people = Object.keys(totalCosts).filter(elem => elem !== "Net Cost");
            const netCosts = {"Net Cost": {}}
            for (const person of people) netCosts["Net Cost"][person] = 0;
                for (const payer of people) {
                    netCosts[payer] = {};
                    for (const payee of people) {
                        netCosts[payer][payee] = 0;
                    }
                }
            for (const toPay of people) {
                for (const payer of people) {
                    let net = totalCosts[toPay][payer] - totalCosts[payer][toPay];
                    netCosts["Net Cost"][payer] += net;
                    net = net < 0 ? 0 : net;
                    netCosts[toPay][payer] += net;
                }
            }
            console.log(netCosts);
            return netCosts
        }
    },
    methods: {
        ...mapMutations("items", ["recallOldTrip"]),
        ...mapActions("items", ["deleteOldTrip"])
    }
}
</script>

<style scoped>
#totalViewContainer {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
}

#total_view_add_trip {
    width: 20%;
    margin: 10px;
}

#tripsTableContainer {
    flex: 1;
    min-height: 0;
}

#noTripsMessage {
    margin: 20px;
}
</style>
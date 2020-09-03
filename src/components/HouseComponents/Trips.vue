<template>
    <div id='tripsContainer'>
        <b-table-simple sticky-header='100%' striped hover>
            <b-thead>
                <b-tr>
                    <b-th @click='setSort("name")'>Trip Name <b-icon-arrow-up v-if='sortBy === "name" && !reverseSort'></b-icon-arrow-up><b-icon-arrow-down v-if='sortBy === "name" && reverseSort'></b-icon-arrow-down></b-th>
                    <b-th @click='setSort("payer")'>Payer <b-icon-arrow-up v-if='sortBy === "payer" && !reverseSort'></b-icon-arrow-up><b-icon-arrow-down v-if='sortBy === "payer" && reverseSort'></b-icon-arrow-down></b-th>
                    <b-th @click='setSort("date")'>Date <b-icon-arrow-up v-if='sortBy === "date" && !reverseSort'></b-icon-arrow-up><b-icon-arrow-down v-if='sortBy === "date" && reverseSort'></b-icon-arrow-down></b-th>
                    <b-th @click='setSort("user", userId)' v-for='(name, userId) in userMap' :key='userId'>{{ name.split(' ')[0] }} <b-icon-arrow-up v-if='sortBy === "user" && sortUserId === userId && !reverseSort'></b-icon-arrow-up><b-icon-arrow-down v-if='sortBy === "user" && sortUserId === userId && reverseSort'></b-icon-arrow-down></b-th>
                    <!-- <b-th></b-th> -->
                </b-tr>
            </b-thead>
            <b-tbody>
                <b-tr v-for='(summary, index) in summaries' :key='index'>
                    <b-td @click='openTrip(summary.id)'>{{ summary.name }}</b-td>
                    <b-td @click='openTrip(summary.id)'>{{ userMap[summary.payer] }}</b-td>
                    <b-td @click='openTrip(summary.id)'>{{ prettyPrintDate(summary.date) }}</b-td>
                    <b-td @click='openTrip(summary.id)' v-for='(name, userId) in userMap' :key='userId'>${{ summary.userCosts[userId].toFixed(2) }}</b-td>
                    <!-- <b-td><b-button>Delete</b-button></b-td> -->
                </b-tr>
            </b-tbody>
            <b-tfoot>
                <b-tr><b-td :colspan='3+Object.keys(userMap).length'><div id='addTripButtonContainer'><b-button :to='`/house/${currHouseId}/addTrip`'>New Trip</b-button></div></b-td></b-tr>
            </b-tfoot>
        </b-table-simple>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import date from 'date-and-time';

export default {
    name: 'Trips',
    data: () => ({
        sortBy: 'date', // Or 'name', 'payer', or 'user'
        sortUserId: null,
        reverseSort: false,
    }),
    computed: {
        ...mapState('house', ['currHouse', 'currHouseId']),
        compareMap(){
            return {
                'date': this.dateCompare,
                'name': this.nameCompare,
                'payer': this.payerCompare,
                'user': this.userCompare
            }
        },
        userMap() {
            return this.currHouse.tripSummaries.userMap;
        },
        summaries() {
            const summaries = this.currHouse.tripSummaries.summaries;
            summaries.sort(this.compareMap[this.sortBy]);
            if (this.reverseSort) {
                summaries.reverse();
            }
            return summaries;
        }
    },
    methods: {
        prettyPrintDate(dateStr) {
            const time = new Date(dateStr);

            return date.format(time, 'ddd, MMM DD YYYY');
        },
        openTrip(tripId) {
            this.$router.push(`/house/${this.currHouseId}/addTrip/${tripId}`);
        },
        setSort(key, userId) {
            if (this.sortBy === key) {
                if (key !== 'user' || this.sortUserId === userId ){
                    this.reverseSort = !this.reverseSort;
                }
            } else {
                this.sortUserId = null;
                this.sortBy = key;
                this.reverseSort = false;
            }
            this.sortUserId = userId;
        },
        dateCompare(a, b) {
            return a.date > b.date ? 1 : -1;
        },
        nameCompare(a, b) {
            return a.name > b.name ? 1 : -1;
        },
        payerCompare(a, b) {
            return this.userMap[a.payer] > this.userMap[b.payer] ? 1 : -1;
        },
        userCompare(a, b) {
            if (this.sortUserId in this.userMap) {
                return a.userCosts[this.sortUserId] > b.userCosts[this.sortUserId] ? 1 : -1;
            }
            return true;
        }
    }
}
</script>

<style lang="less" scoped>
#tripsContainer {
    height: 100%;
    width: 100%;

    #addTripButtonContainer {
        display: flex;
        justify-content: center;

        .btn {
            width: 30%;
        }
    }
}
</style>
<template>
    <div id='mainHouseView'>
        <b-table-simple responsive striped>
            <b-thead>
                <b-tr>
                    <b-th>Name</b-th>
                    <b-th>Email</b-th>
                    <b-th>Last Online</b-th>
                    <b-th>Owed</b-th>
                </b-tr>
            </b-thead>
            <b-tbody>
                <b-tr v-for='user in users' :key='user._id'>
                    <b-td>{{ user.firstName }} {{ user.lastName }}</b-td>
                    <b-td>{{ user.email }}</b-td>
                    <b-td>{{ prettyPrintTimeSince(user.lastLogin) }} ago</b-td>
                    <b-td>{{ (user.owed > 0) ? 'You owe them' : 'They owe you' }} ${{ Math.abs(user.owed).toFixed(2) }}</b-td>
                </b-tr>
            </b-tbody>
        </b-table-simple>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import date from 'date-and-time';
import timespan from 'date-and-time/plugin/timespan';
date.plugin(timespan);

export default {
    name: "HouseMain",
    computed: {
        ...mapState('house', ['currHouse']),
        ...mapGetters('house', ['currHouseOwedInfo']),
        users() {
            const users = this.currHouse.users;
            for (const user of users) {
                if (user._id in this.currHouseOwedInfo) {
                    user.owed = this.currHouseOwedInfo[user._id]
                } else {
                    user.owed = 0;
                }
            }
            return this.currHouse.users;
        }
    },
    methods: {
        prettyPrintTimeSince(dateStr) {
            const time = new Date(dateStr);
            const now = new Date();
            const since = date.subtract(now, time);
            let pattern;
            if (since.toMinutes() < 60) {
                pattern = 'm [minutes]';
            } else if (since.toHours() < 24) {
                pattern = 'H [hours] m [minutes]';
            } else {
                pattern = 'D [days] H [hours] m [minutes]';
            }

            return date.timeSpan(time, now).toDays(pattern);
        }
    }
}
</script>

<style lang="less" scoped>
#mainHouseView {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;

    .table-responsive {
        max-height: 100%;
        border-bottom: 2px solid #dee2e6;
    }
}
</style>
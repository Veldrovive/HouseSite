<template>
    <div id='joinRequests'>
        <b-table-simple>
            <b-thead>
                <b-tr>
                    <b-th>Name</b-th>
                    <b-th>Email</b-th>
                    <b-th>Accept</b-th>
                </b-tr>
            </b-thead>
            <b-tbody>
                <b-tr v-for='request in joinRequests' :key='request._id'>
                    <b-td>{{ request.firstName }} {{ request.lastName }}</b-td>
                    <b-td>{{ request.email }}</b-td>
                    <b-td><b-button @click='acceptJoinRequest(request._id)'>Accept</b-button></b-td>
                </b-tr>
            </b-tbody>
        </b-table-simple>
    </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
    name: 'JoinRequests',
    computed: {
        ...mapState('house', ['currHouse']),
        joinRequests() {
            return this.currHouse.joinRequests;
        }
    },
    methods: {
        ...mapActions('house', ['acceptJoinRequest'])
    }
}
</script>

<style lang="less" scoped>

</style>
<template>
    <div id="sContainer">
            <b-card bg-variant="light" header="Total Cost">
                <b-card-text>${{ currTotalCost.toFixed(2) }}</b-card-text>
            </b-card>

            <b-card bg-variant="light" header="Individual Costs" id="indivCostCard">
                <b-card-text>
                    <b-table-simple borderless>
                        <b-tbody>
                            <b-tr v-for="(person, index) in currIndivCost" :key="index">
                                <b-td>{{ person.name}}</b-td>
                                <b-td>${{ person.cost.toFixed(2) }}</b-td>
                            </b-tr>
                        </b-tbody>
                    </b-table-simple>
                </b-card-text>
            </b-card>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: "Summary",
    computed: {
        ...mapGetters("items", ["currTotalCost", "currIndivCost"])
    }
}
</script>

<style scoped>
#sContainer {
    width: 100%;
    display: flex;
    flex-direction: column;
}

#indivCostCard {
    margin-top: 10px;
}

#indivCostCard .card-body {
    padding: 0;
}


</style>
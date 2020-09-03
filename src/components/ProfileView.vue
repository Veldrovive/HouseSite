<template>
    <div id="profileViewContainer">
        <div id="userInfo">
            <h5>{{ firstName }} {{ lastName }}</h5>
            <p>{{ `${currentTotalCost > 0 ? '-' : '+'}$${Math.abs(currentTotalCost)}` }}</p>
        </div>
        <b-avatar id="avatar" size='7vh' :src=imgPath></b-avatar>
        <div id="houseInfo">
            <!-- <div id="chartContainer"> -->
                <CostChart v-if='datacollection' :styles="myStyles" :chart-data="datacollection" :options="options"></CostChart>
            <!-- </div> -->
            <div id="houseCardsContainer">
                <div id="plusContainer">
                <house-card v-for="(house, index) in myHouses" :key="house._id" :index="index"></house-card>
                <b-button id="addHouse" @click="showCreateHouse">
                    <b-icon scale=1.5 shift-v=1 icon="plus-circle"></b-icon>
                </b-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from 'vuex';
import CostChart from './CostChart.js';
import HouseCard from './HouseCard.vue';

export default {
    name: "Profile",
    components: {
        CostChart,
        HouseCard
    },
    data: () => ({
        datacollection: {},
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    type: 'time'
                }]
            },
            title: {
                display: true,
                text: 'Total Amount Owed Over Time'
            },
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    title: (tooltipItem, data) => {
                        const pointInfo = data.datasets[tooltipItem[0].datasetIndex].data[tooltipItem[0].index];
                        const owed = pointInfo.totalOwed;
                        const text = owed > 0 ? 'You owe' : 'You are owed';
                        return `${text} $${Math.abs(owed)} in total`;
                    },
                    label: (tooltipItem, data) => {
                        const pointInfo = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                        const tripCost = pointInfo.netCost;
                        const text = tripCost > 0 ? 'Roommate payed' : 'You payed';
                        const afterText = tripCost > 0 ? 'for you' : '';
                        return `${text} $${Math.abs(tripCost)} ${afterText}`;
                    },
                    beforeLabel: (tooltipItem, data) => {
                        const pointInfo = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                        return `Trip Name: ${pointInfo.name}`;
                    }
                },
                displayColors: false
            }
        }
    }),
    mounted() {
        this.updateDataset();
    },
    watch: {
        myHouses() {
            this.hideCreateHouse();
        },
        historicalOwedInfo() {
            this.updateDataset();
        }
    },
    computed: {
        ...mapState('user', ['firstName', 'lastName', 'email', 'imgPath']),
        ...mapState('house', ['myHouses']),
        ...mapGetters('house', ['historicalOwedInfo']),
        myStyles () {
            return {
                height: `250px`,
                position: 'relative'
            }
        },
        currentTotalCost() {
            try {
                return this.historicalOwedInfo[this.historicalOwedInfo.length - 1].totalOwed;
            } catch(err) {
                return 0;
            }
        }
    },
    methods: {
        ...mapMutations('modals/createHouse', ['showCreateHouse', 'hideCreateHouse']),
        updateDataset() {
            if(this.historicalOwedInfo) {
                this.datacollection = {
                    datasets: [{
                        label: 'Net Owed',
                        data: this.historicalOwedInfo.map(owed => ({t: new Date(owed.date), y: owed.totalOwed, ...owed})),
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        borderColor: '#000000'
                    }]
                }
                console.log(this.datacollection);
            } else {
                this.datacollection = {};
            }
        }
    }
}
</script>

<style scoped lang='less'>
#profileViewContainer {
    height: 100%;
    display: flex;
    flex-direction: column;
    p, h5 {
        margin: 0;
    }

    #userInfo {
        width: 100%;
        height: 7vh;
        flex-shrink: 0;
        background-color: #E2E2E2;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 0 15px;
        box-shadow: 0 2px 4px -3px #929292;
    }

    #avatar {
        position: relative;
        left: 50%;
        top: -4vh;
        transform: translateX(-50%);
    }

    .b-avatar /deep/ img {
        width: 100%;
        height: 100%;
    }

    #houseInfo {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        min-height: 0;
        #houseCardsContainer {
            flex: 1;
            display: flex;
            flex-direction: row;
            // justify-content: center;
            margin: 0 15px 15px 15px;
            overflow-x: scroll;
            min-height: 0px;
            overflow-y: scroll;
            #plusContainer {
                display: flex;
                flex-direction: row;
                margin: 0 auto;

                #addHouse {
                    margin: auto 0;
                    margin-left: 10px;
                }
            }
        }
    }
}
</style>
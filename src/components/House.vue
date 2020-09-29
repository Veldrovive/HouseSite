<template>
    <div id="houseContainer">
        <b-overlay
            :show="loading"
            v-if='loading'
            rounded
            opacity="0.6"
            spinner-large
            spinner-variant="primary"
            id="spinner"
            @hidden='() => {}'
        ></b-overlay>
        <div id='loaded' v-if='!loading'>
            <div id='noHouse' v-if='noHouse'>
                <p>Failed to get house correctly. Please reload the page or navigate back to the profile.</p>
            </div>
            <div id='header' v-else :style='headerStyle'>
                <h5 @click='showMain'>{{ house.name }}</h5>
                <div>
                    <b-button id='addTripButton' @click='showTrips' v-if='isInHouse'>Trips</b-button>
                    <b-button id='addTripButton' @click='showJoinRequests' v-if='isOwner'>Join Requests <b-badge variant="light" v-if='joinRequests.length > 0'>{{ joinRequests.length }}</b-badge></b-button>
                    <b-button id='addImageButton' v-if='isOwner' @click='showSetHouseImg'>Set House Image</b-button>
                    <b-button id='addImageButton' v-if='isOwner' @click='addTripsJSON'>Add Old Trips Json</b-button>
                </div>
            </div>
            <div id='ownHouse' v-if='isInHouse'>
                <!-- <p><b>Owner: </b> {{ house.owner.firstName }} {{ house.owner.lastName }}</p>
                <div v-for='user in this.house.users' :key='user._id'>
                    <p><b>Member: </b>{{ user.firstName }} {{ user.lastName }}, <b>Last Online: </b> {{ prettyPrintDate(user.lastLogin) }}, <b>Time Since Online:</b> {{ prettyPrintTimeSince(user.lastLogin) }}</p>
                </div> -->
                <JoinRequests v-if='tab === "joinRequests" && isOwner'/>
                <AddTrip v-else-if='tab === "addTrip"'/>
                <Trips v-else-if='tab === "trips"'/>
                <Main v-else-if='!tab'/>
                <div v-else>
                    404 page?
                </div>
                <div v-if='addingJSON'>
                    <textarea id='jsonAddBox' @dblclick='addJSON($event.target.value)'>{"userIdMap": {"Aidan": "5f51a701dfe4d4bc4c378aab", "Teresa": "5f51a70adfe4d4bc4c378aac", "Nasser": "5f51a71edfe4d4bc4c378aae", "Melisa": "5f51a713dfe4d4bc4c378aad", "Wadee": "5f51a729dfe4d4bc4c378aaf", "Shebri": "5f51a732dfe4d4bc4c378ab0"}, "trips": }</textarea>
                </div>
            </div>
            <div id='searchedHouse' v-else>
                <p>You are not in this house</p>
                <b-button @click='requestJoinCurrentHouse'>Join House</b-button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex';
import { AddTrip, JoinRequests, Trips, Main } from './HouseComponents';

export default {
    name: 'House',
    components: {
        JoinRequests,
        AddTrip,
        Trips,
        Main
    },
    data: () => ({
        loading: true,
        addingJSON: false,
    }),
    created() {
        this.loadHouse();
    },
    watch: {
        $route() {
            this.loadHouse();
        },
        loggedIn(to) {
            if (to) {
                this.loadHouse();
            }
        },
        currHouse() {
            this.loading = false;
        }
    },
    computed: {
        ...mapState('house', ['currHouseId', 'currHouse', 'currHouseTripSummaries', 'currVocab']),
        ...mapState('user', ['loggedIn', 'id']),
        houseId() {
            return this.$route.params.id;
        },
        tab() {
            return this.$route.params.tab;
        },
        house() {
            return this.currHouse;
        },
        noHouse() {
            return !this.house;
        },
        isInHouse() {
            return this.house.isInHouse;
        },
        isOwner() {
            return this.house.owner._id === this.id;
        },
        members() {
            return this.house.users;
        },
        joinRequests() {
            return this.house.joinRequests;
        },
        houseImg() {
            return this.house.imgPath;
        },
        headerStyle() {
            if (this.houseImg) {
                return {background: `url(${this.houseImg}) #E2E2E2`};
            }
            return '';
        }
    },
    methods: {
        ...mapActions('house', ['setCurrentHouse', 'requestJoinCurrentHouse', 'addTrip']),
        ...mapMutations('house', ['houseIdDeselected']),
        ...mapMutations('modals/setHouseImg', ['showSetHouseImg']),
        showAddTrip() {
            this.$router.push(`/house/${this.currHouseId}/addTrip`);
        },
        showTrips() {
            this.$router.push(`/house/${this.currHouseId}/trips`);
        },
        showMain() {
            this.$router.push(`/house/${this.currHouseId}`);
        },
        showJoinRequests() {
            this.$router.push(`/house/${this.currHouseId}/joinRequests`);
        },
        loadHouse() {
            // If the house has not changed. State is updated automatically by websocket.
            if (this.currHouseId !== this.houseId) {
                this.houseIdDeselected();
                this.loading = true;

                if (this.loggedIn) {
                    this.setCurrentHouse(this.houseId);
                }
            } else {
                this.loading = false;
            }
        },
        addTripsJSON() {
            this.addingJSON = !this.addingJSON;
        },
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        async addJSON(json) {
            const { trips, userIdMap } = JSON.parse(json);
            console.log("Adding", trips, userIdMap);
            const nTrips = [];
            for (const trip of trips) {
                const tripDate = new Date(trip.date);
                const tripName = trip.name;
                const payer = userIdMap[trip.payer];
                if (!payer) {
                    throw `${trip.payer} is not in id map.`
                }
                const items = trip.items.map(itemObj => {
                    const name = itemObj.itemName;
                    const cost = itemObj.itemCost;
                    const tax = 0.13;
                    const splitters = itemObj.costSpliters.map(person => {
                        const id = userIdMap[person];
                        if (!id) {
                            throw `${person} is not in id map.`
                        }
                        return id;
                    })
                    return {name, cost, tax, splitters};
                });
                console.log("Trip:", {tripDate, tripName, payer, items});
                nTrips.push({tripDate, tripName, payer, items});
            }
            let counter = 0;
            for (const trip of nTrips) {
                this.addTrip(trip);
                counter++;
                console.log(`${counter}/${nTrips.length} (${counter/nTrips.length})`);
                await this.sleep(1000);
            }
            console.log("Done");
        }
    }
}
</script>

<style lang="less" scoped>
#houseContainer {
    p, h5 {
        margin: 0;
    }
    width: 100%;
    height: 100%;
    #header {
        width: 100%;
        height: 7vh;
        flex-shrink: 0;
        background-color: #E2E2E2;
        background-blend-mode: overlay;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 0 15px;
        box-shadow: 0 2px 4px -3px #929292;

        button {
            margin-left: 10px;
        }
    }

    #spinner {
        width: 100%;
        height: 100%;
    }
    #loading {
        width: 100%;
        height: 100%;
    }
    #loaded {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;

        #ownHouse {
            flex: 1;
            min-height: 0;
        }
    }

    #jsonAddBox {
        width: 100%;
    }
}
</style>
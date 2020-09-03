<template>
    <div id='addTripContainer'>
        <b-overlay
            :show='loading'
            v-if='loading'
            rounded
            opacity="0.6"
            spinner-large
            spinner-variant="primary"
            id="spinner"
            @hidden='() => {}'
        ></b-overlay>
        <div id="tripNameInput" v-if='!loading'>
            Trip Name: <input type="text" :value="tripName" @input="tripName = $event.target.value"/> 
            <b-form-datepicker id="datepicker" :value="tripDate" @input="setDate" :value-as-date="true" size="sm"></b-form-datepicker>
            <div class="spacer"></div>
            Payer:
            <b-form-select @input="setPayer" :value="tripPayer" id="personDropdown">
                <b-form-select-option v-for="user in users" :key="user._id" :value="user._id">{{ user.firstName }}</b-form-select-option>
            </b-form-select>
            <b-button id='resetButton' @click='clear'>Reset</b-button>
        </div>
        <div id='container' v-if='!loading'>
            <div id='summaryContainer'>
                <b-card bg-variant="light" header="Total Cost">
                    <!-- <b-card-text>${{ (currTotalCost*1.13).toFixed(2) }} (${{ currTotalCost.toFixed(2) }})</b-card-text> -->
                    <b-card-text>${{ costSummaries.totalCost.toFixed(2) }}</b-card-text>
                </b-card>

                <b-card bg-variant="light" header="Individual Costs" id="indivCostCard">
                    <b-card-text>
                        <b-table-simple borderless>
                            <b-tbody>
                                <b-tr v-for="(cost, person, index) in costSummaries.userCosts" :key="index">
                                    <b-td>{{ person }}</b-td>
                                    <b-td>${{ cost.toFixed(2) }}</b-td>
                                </b-tr>
                            </b-tbody>
                        </b-table-simple>
                    </b-card-text>
                </b-card>
            </div>

            <div id='itemsSuperContainer'>
                <div id='itemsContainer'>
                    <b-table-simple striped bordered hover @keyup.enter="deselect()" sticky-header="100%">
                        <b-thead>
                            <b-tr>
                                <b-th>Item Name</b-th>
                                <b-th>Cost</b-th>
                                <b-th v-for="user in users" :key="user._id">{{ user.firstName }}</b-th>
                            </b-tr>
                        </b-thead>

                        <b-tbody>
                            <b-tr v-for='(item, index) in items' :key='index'>
                                <template v-if='index == editingIndex'>
                                    <b-td><input class="internalInput" placeholder="Item Name" :value="item.name" @input="item.name = $event.target.value" :ref="'in'+index"></b-td>
                                    <b-td><input class="internalInput" placeholder="Cost" :value="item.cost" @input="item.cost = valToNumber($event.target.value)" :ref="'ic'+index"> Tax:<input type='checkbox' :checked='item.tax' @change='item.tax = $event.target.checked'/></b-td>
                                </template>
                                <template v-else>
                                    <b-td @click="onChangeEdit(index)">{{ item.name }}</b-td>
                                    <b-td @click="onChangeEdit(index)">${{ item.cost ? item.cost.toFixed(2) : '0.00' }}</b-td>
                                </template>
                                <b-td v-for='user in users' :key='user._id'><input :checked="item.isSplitter(user._id)" type="checkbox" @dblclick="setOnlySplitter(item, user._id)" @change="setSplitterState(item, user._id, $event.target.checked)"></b-td>
                            </b-tr>
                        </b-tbody>

                        <b-tfoot>
                            <b-tr>
                                <b-td :colspan="3+users.length">
                                    <b-button id="addRowButton" @click="addRow()">+</b-button>
                                </b-td>
                            </b-tr>
                        </b-tfoot>
                    </b-table-simple>
                </div>
            </div>
        </div>
        <b-button id='finishButton' @click='finishTrip' v-if='!loading'>Finish</b-button>
    </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import ls from 'local-storage';

class Item {
    constructor(initialSplitters) {
        this.name = null;
        this.shortName = null;
        this.cost = null;
        this.tax = true;
        this.splitters = initialSplitters ? [...initialSplitters] : [];
    }

    static fromJSON(json) {
        const item = new Item();
        item.name = json.name;
        item.shortName = json.shortName;
        item.cost = json.cost;
        item.tax = json.tax;
        item.splitters = json.splitters;
        return item;
    }

    toJSON() {
        return {
            name: this.name, shortName: this.shortName,
            cost: this.cost, tax: this.tax,
            splitters: this.splitters
        }
    }

    isSplitter(name) {
        return this.splitters.includes(name);
    }

    addSplitter(name) {
        if (!this.isSplitter(name)) {
            this.splitters.push(name);
        }
    }

    removeSplitter(name) {
        if (this.isSplitter(name)) {
            this.splitters.splice(this.splitters.indexOf(name), 1);
        }
    }

    setSplitterState(name, state) {
        if (state) {
            this.addSplitter(name);
        } else {
            this.removeSplitter(name);
        }
    }

    setOnlySplitter(name) {
        this.splitters = [name];
    }

    getTax() {
        if (typeof this.tax === 'boolean') {
            return this.tax ? 0.13 : 0;
        } else {
            if (this.tax > 1) {
                return this.tax - 1;
            } else {
                return this.tax;
            }
        }
    }

    getCost() {
        if (!this.cost) {
            return 0;
        }
        return this.cost * (1 + this.getTax());
    }
}

export default {
    name: 'AddTrip',
    data: () => ({
        loading: true,
        editingIndex: -1,

        tripName: '',
        tripDate: new Date(),
        tripPayer: '',
        items: [],
    }),
    watch: {
        tripName() {
            this.save();
        },
        tripDate() {
            this.save();
        },
        tripPayer() {
            this.save();
        },
        editingIndex() {
            this.save();
        },
        currTrip(to) {
            // If the new trip id is the tripid of the url then run the overwrite function.
            console.log("The current trip was changed to ", to);
            if (to._id === this.tripId) {
                console.log("The change to route is this trip so we are overwriting");
                this.overwriteWithCurrTrip();
            }
        }
    },
    created() {
        this.setPayer(this.id);
        this.load();
        // if (this.tripId) {
        //     this.loadExistingTrip(this.tripId);
        // } else {
        //     this.loading = false;
        // }
    },
    mounted() {
        window.removeEventListener('keyup', this.handleKeyPress);
        window.addEventListener('keyup', this.handleKeyPress);
    },
    computed: {
        ...mapState('house', ['currHouse', 'currVocab', 'currHouseId', 'currTrip', 'currTripId']),
        ...mapState('user', ['id']),
        tripId() {
            return this.$route.params.meta;
        },
        house() {
            return this.currHouse;
        },
        users() {
            return this.house.users;
        },
        userIds() {
            return this.users.map(user => user._id);
        },
        usernameMap() {
            const userMap = {}
            for (const user of this.users) {
                userMap[user._id] = `${user.firstName} ${user.lastName}`;
            }
            return userMap;
        },
        costSummaries() {
            let totalCost = 0;
            let userCosts = {};
            for (const user of Object.values(this.usernameMap)) {
                userCosts[user] = 0;
            }

            for (const item of this.items) {
                const cost = item.getCost();
                totalCost += cost;
                for (const userId of item.splitters) {
                    userCosts[this.usernameMap[userId]] += cost / item.splitters.length;
                }
            }

            return {totalCost, userCosts};
        }
    },
    methods: {
        ...mapActions('house', ['addTrip', 'updateTrip', 'setCurrentTrip']),
        addRow() {
            this.items.push(new Item(this.userIds));
        },
        setDate(date) {
            this.tripDate = date;
        },
        setPayer(payer) {
            this.tripPayer = payer;
        },
        setSplitterState(item, splitter, state) {
            item.setSplitterState(splitter, state);
            this.save();
        },
        setOnlySplitter(item, splitter) {
            item.setOnlySplitter(splitter);
            this.save();
        },
        valToNumber: function(val) {
            if(isNaN(parseFloat(val))){
                return 0;
            }
            return parseFloat(val);
        },
        onChangeEdit(index) {
            this.editingIndex = index;
        },
        loadExistingTrip(tripId) {
            console.log("New Trip Id:", tripId);
            // If the trip id does not match with the currTripId then call the api to get the trip
            if (!this.currTrip || tripId !== this.currTrip._id) {
                this.loading = true;
                this.setCurrentTrip(tripId);
            } else {
                this.overwriteWithCurrTrip();
            }
        },
        overwriteWithCurrTrip() {
            // Take data from the api and overwrite the current data with it.
            console.log("Overwriting trip with past one");
            this.tripName = this.currTrip.name;
            this.tripDate = new Date(this.currTrip.date);
            this.tripPayer = this.currTrip.payer;
            this.items = [];
            for (const itemObj of this.currTrip.items) {
                this.items.push(Item.fromJSON(itemObj));
            }
            this.loading = false;
        },
        deselect(){
            this.onChangeEdit(-1);
        },
        handleKeyPress(ev) {
            if(ev.key === "Enter" || ev.key === "Escape") this.deselect();
        },
        prepItems() {
            return this.items.map(item => ({
                name: item.name, cost: item.cost, tax: item.getTax(), shortName: item.shortName, splitters: item.splitters
            }))
        },
        finishTrip() {
            const items = this.prepItems();
            const { tripDate, tripName, tripPayer: payer } = this;
            if (this.tripId) {
                this.updateTrip({ tripDate, tripName, payer, items });
            } else {
                this.addTrip({ tripDate, tripName, payer, items });
            }
            this.clear();
            this.$router.replace(`/house/${this.currHouseId}/trips`);
        },
        save() {
            const tripObject = {
                name: this.tripName,
                date: this.tripDate,
                payer: this.tripPayer,
                overwritingId: this.tripId,
                items: this.items
            }
            ls(`currentTrip${this.currHouseId}`, tripObject);
        },
        clearls() {
            ls(`currentTrip${this.currHouseId}`, null);
        },
        clear() {
            this.clearls();
            this.tripName = '';
            this.tripDate = new Date();
            this.tripPayer = this.id;
            this.items = [];
            this.$router.push(`/house/${this.currHouseId}/addTrip`);
        },
        load() {
            console.log("Loading old trip");
            const tripObject = ls.get(`currentTrip${this.currHouseId}`);
            const overwrite = () => {
                ({
                    name: this.tripName,
                    date: this.tripDate,
                    payer: this.tripPayer,
                } = tripObject);
                this.items = tripObject.items.map(itemObj => Item.fromJSON(itemObj));
                this.loading = false;
            }
            if (tripObject || this.tripId) {
                const overwritingId = tripObject ? tripObject.overwritingId : null
                if (this.tripId && this.tripId !== overwritingId) {
                    // This occures when the user has a trip saved to ls, but they access a new trip to update it.
                    // In this case, we throw out the old data and load new stuff from the api.
                    console.log("User is accessing new trip that is not currently loaded into ls");
                    this.clearls();
                    this.loadExistingTrip(this.tripId);
                } else if(!this.tripId && overwritingId) {
                    // Then the data loaded from ls contains a overwrite id not reflected in the url so we need to update the url with the correct
                    // tripId then overwrite the data with existing data
                    console.log("No given trip id so replacing with old one")
                    this.$router.replace(`/house/${this.currHouseId}/addTrip/${overwritingId}`);
                    overwrite();
                } else {
                    // Then there is nothing we need to do with the url and we can just load the data from ls.
                    console.log("No route update needed. Overwriting.")
                    overwrite();
                }
            } else {
                // Then there is nothing in ls so loading is done.
                this.loading = false;
            }
        }
    }
}
</script>

<style lang="less" scoped>
#addTripContainer {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    #tripNameInput {
        margin: 10px 0 10px 10px;
        display: flex;
        justify-content: flex-start;
        align-items: center;

        > * {
            margin-right: 10px;
        }

        #datepicker__outer_ {
            width: 20%;
        }

        #personDropdown {
            margin-right: 10px;
            width: 20%;
        }

        #resetButton {
            margin-left: auto;
        }
    }

    #container {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: row;
        min-height: 0;
        .tContainer {
            width: 50%;
            padding: 10px;
            flex: 1;
            min-height: 0;
        }

        #summaryContainer {
            padding: 10px;
            display: flex;
            flex-direction: column;
            min-height: 0;
            width: 30%;

            #indivCostCard {
                margin-top: 10px;
            }
        }

        #itemsSuperContainer {
            padding: 10px;
            width: 70%;
            #itemsContainer {
                height: 100%;

                .internalInput {
                    width: 6vw;
                }

                #addRowButton {
                    width: 100%;
                }
            }
        }
    }

    #finishButton {
        align-self: center;
        width: 30%;
        margin: 10px 0;
    }
}
</style>
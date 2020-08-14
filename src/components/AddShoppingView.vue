<template>
    <div id="addShoppingContainer">
        <div id="tripNameInput">
            Trip Name: <input type="text" :value="tripName" @input="setName($event.target.value)"/> 
            <b-form-datepicker id="datepicker" :value="tripDate" @input="setDate" :value-as-date="true" size="sm"></b-form-datepicker>
            <div class="spacer"></div>
            Payer:
            <b-form-select @input="setPayer" :value="tripPayer" id="personDropdown">
                <b-form-select-option v-for="(person, index) in tripPeople" :key="index" :value="person">{{ person }}</b-form-select-option>
            </b-form-select>
        </div>
        <div id="container">
            <div class="tContainer" id="summaryContainer">
                <Summary/>
            </div>
            <div class="tContainer" id="shoppingContainer">
                <AddItems/>
            </div>
        </div>
        <b-button id="finishButton" @click="saveTrip()">
            Finish
        </b-button>
    </div>
</template>

<script>
import { mapMutations, mapGetters, mapActions } from 'vuex'
import Summary from './AddShoppingComponents/Summary.vue'
import AddItems from './AddShoppingComponents/AddItems.vue'

export default {
    name: "AddShopping",
    components: {
        Summary,
        AddItems
    },
    data: function() {
        return {
            value: ""
        }
    },
    computed: {
        ...mapGetters("items", ["tripName", "tripDate", "tripPeople", "tripPayer"])
    },
    methods: {
        ...mapActions("items", ["saveTrip"]),
        ...mapMutations("items", ["setName", "setDate", "setPayer"]),
        comboChange(ev) {
            console.log(ev);
        }
    }
}
</script>

<style scoped>
#container {
    display: flex;
    flex-direction: row;
    min-height: 0;
}

#addShoppingContainer {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-height: 100%;
}

#personDropdown {
    margin-right: 10px;
    width: 20%;
}

#tripName {
    align-self: flex-start;
    margin: 0 0 0 10px;
}
#titleBreak {
    margin-left: 10px;
    margin-right: 10px;
    margin-bottom: 3px;
    height: 1px;
}

#summaryContainer {
    width: 40%;
}
#shoppingContainer {
    width: 60%;
    min-height: 0;
}

.spacer {
    margin-left: auto;
}

#tripNameInput {
    margin: 10px 0 10px 10px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
}

#datepicker__outer_ {
    width: 20%;
}

.tContainer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 10px;
}

#finishButton {
    width: 40%;
    margin-top: auto;
    align-self: center;
    margin-bottom: 10px;
}
</style>
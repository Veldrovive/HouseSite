<template>
    <div id="itemsContainer">
        <b-table-simple striped bordered hover @keyup.enter="deselect()">
            <b-thead>
                <b-tr>
                    <b-th>Item Name</b-th>
                    <b-th>Cost</b-th>
                    <b-th v-for="(person, index) in people" :key="index">{{ person }}</b-th>
                </b-tr>
            </b-thead>
            <b-tbody>
                <b-tr v-for="(data, index) in currItems" :key="index">
                    <template v-if="index != editIndex">
                        <b-td @click="onChangeEdit(index)">{{ data.itemName }}</b-td>
                        <b-td @click="onChangeEdit(index)">${{ data.itemCost.toFixed(2) }}</b-td>
                    </template>
                    <template v-else>
                        <b-td><input class="internalInput" placeholder="Item Name" :value="data.itemName" @input="onItemMetaChange({index: index, prop: 'itemName', val: $event.target.value})" :ref="'in'+index"></b-td>
                        <b-td><input class="internalInput" placeholder="Cost" :value="data.itemCost" @input="onItemMetaChange({index: index, prop: 'itemCost', val: valToNumber($event.target.value)})" :ref="'ic'+index"></b-td>
                    </template>
                    <b-td v-for="(person, p_index) in people" :key="p_index"><input :checked="data.costSpliters.indexOf(person)>-1" type="checkbox" @dblclick="onDisableOtherPeople({index: index, person: person})" @change="onItemPersonChange({checked: $event.target.checked, person: person, dataIndex: index})"></b-td>
                </b-tr>
            </b-tbody>
            <b-tfoot>
                <b-tr>
                    <b-td :colspan="3+people.length">
                        <b-button id="addRowButton" @click="newRow()">+</b-button>
                    </b-td>
                </b-tr>
            </b-tfoot>
        </b-table-simple>
    </div>
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'

export default {
    name: "AddItems",
    data: function() {
        return {
            editIndex: -1,
        }
    },
    computed: {
        ...mapGetters("items", ["people", "currItems"])
    },
    mounted() {
        window.removeEventListener('keyup', this.handleKeyPress);
        window.addEventListener('keyup', this.handleKeyPress);
    },
    methods: {
        ...mapMutations('items', ["onItemPersonChange", "onItemMetaChange", "addRow", "onDisableOtherPeople"]),
        handleKeyPress(ev) {
            if(ev.key === "Enter") this.deselect();
        },
        valToNumber: function(val) {
            if(isNaN(parseFloat(val))){
                return 0;
            }
            return parseFloat(val);
        },
        onChangeEdit(index) {
            this.editIndex = index;
        },
        deselect(){
            this.onChangeEdit(-1);
        },
        newRow() {
            this.addRow();
            this.onChangeEdit(this.currItems.length-1);
        }
    }
}
</script>

<style scoped>
#itemsContainer {
    width: 100%;
    display: flex;
    flex-direction: column;
}
#tripNameInput {
    margin-bottom: 10px;
}
#addRowButton {
    width: 100%;
}
.internalInput {
    width: 80%;
}
</style>
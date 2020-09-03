<template>
    <b-modal v-model="modalShown"
        title="Create New House"
    >
        <b-form-group
            label="House Name"
        >
            <b-form-input
                required
                :value="houseName"
                @input="rename"
            ></b-form-input>
        </b-form-group>

        <template v-slot:modal-footer>
            <b-button @click="submitCreate">Create House</b-button>
        </template>
    </b-modal>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex'

export default {
    name: "CreateHouseModal",
    computed: {
        ...mapState('modals/createHouse', ['shown', 'name']),
        modalShown: {
            get: function() {
                return this.shown;
            },
            set: function(shown) {
                if (shown) {
                    this.showCreateHouse();
                } else {
                    this.hideCreateHouse();
                }
            }
        },
        houseName: {
            get: function() {
                return this.name;
            },
            set: function(name) {
                this.setName(name);
            }
        }
    },
    methods: {
        ...mapMutations('modals/createHouse', ['showCreateHouse', 'hideCreateHouse', 'setName']),
        ...mapActions('house', ['createHouse']),
        rename(name) {
            this.setName(name);
        },
        submitCreate() {
            this.createHouse(this.houseName);
        }
    }
}
</script>

<style lang="less" scoped>

</style>
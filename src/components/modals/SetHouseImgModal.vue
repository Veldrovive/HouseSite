<template>
    <b-modal v-model="modalShown"
        title="Create New House"
    >
        <b-form-group
            label="House Image Url"
        >
            <b-form-input
                required
                :value="imgPath"
                @input="setImg"
            ></b-form-input>
        </b-form-group>

        <template v-slot:modal-footer>
            <b-button @click="submit">Set Image</b-button>
        </template>
    </b-modal>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex'

export default {
    name: "SetHouseImageModal",
    computed: {
        ...mapState('modals/setHouseImg', ['shown', 'imgUrl']),
        modalShown: {
            get: function() {
                return this.shown;
            },
            set: function(shown) {
                if (shown) {
                    this.showSetHouseImg();
                } else {
                    this.hideSetHouseImg();
                }
            }
        },
        imgPath: {
            get: function() {
                return this.imgUrl;
            },
            set: function(url) {
                this.setUrl(url);
            }
        }
    },
    methods: {
        ...mapMutations('modals/setHouseImg', ['showSetHouseImg', 'hideSetHouseImg', 'setUrl']),
        ...mapActions('house', ['setCurrHouseImg']),
        setImg(name) {
            this.setUrl(name);
        },
        submit() {
            this.setCurrHouseImg(this.imgPath);
        }
    }
}
</script>

<style lang="less" scoped>

</style>
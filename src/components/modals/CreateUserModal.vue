<template>
    <b-modal v-model="modalShown"
        title="Create User"
    >
        <b-form id="createUserForm">
            <b-form-group 
                id="firstNameGroup"
                label="Given Name:"
                label-for="firstNameInput"
            >
                <b-form-input 
                    id="firstNameInput"
                    v-model="form.firstName"
                    required
                    placeholder="Given Name"
                ></b-form-input>
            </b-form-group>
            <b-form-group 
                id="lastNameGroup"
                label="Family Name:"
                label-for="lastNameInput"
            >
                <b-form-input 
                    id="lastNameInput"
                    v-model="form.lastName"
                    required
                    placeholder="Family Name"
                ></b-form-input>
            </b-form-group>
            <b-form-group 
                id="emailGroup"
                label="Email:"
                label-for="emailInput"
            >
                <b-form-input 
                    id="emailInput"
                    :disabled=!!gAutoFill.idToken
                    v-model="form.email"
                    required
                    placeholder="Email"
                ></b-form-input>
            </b-form-group>
        </b-form>

        <template v-slot:modal-footer>
            <b-button type="submit" @click="submitCreate">Create User</b-button>
        </template>
    </b-modal>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex'

export default {
    name: "CreateUserModal",
    data() {
        return {
            form: {
                firstName: "",
                lastName: "",
                email: ""
            }
        }
    },
    watch: {
        gAutoFill() {
            this.form = {
                firstName: this.gAutoFill.firstName,
                lastName: this.gAutoFill.lastName,
                email: this.gAutoFill.email
            }
        },
        loggedIn() {
            this.modalShown = false;
        }
    },
    computed: {
        ...mapState('modals/createUser', ['shown', 'name']),
        ...mapState('user', ['gAutoFill', 'loggedIn']),
        modalShown: {
            get: function() {
                return this.shown;
            },
            set: function(shown) {
                if (shown) {
                    this.showCreateUser();
                } else {
                    this.hideCreateUser();
                }
            }
        }
    },
    methods: {
        ...mapMutations('modals/createUser', ['showCreateUser', 'hideCreateUser']),
        ...mapActions('user', ['createUser']),
        submitCreate() {
            this.createUser({ token: this.gAutoFill.idToken, imgPath: this.gAutoFill.imgPath, ...this.form });
        }
    }
}
</script>

<style lang="less" scoped>

</style>
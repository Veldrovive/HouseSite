<template>
    <div id="createUserContainer">
        <b-form id="createUserForm" @submit="onSubmit" @reset="onReset">
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
            <b-button type="submit">Create User</b-button>
        </b-form>
    </div>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
    name: "CreateUser",
    data() {
        return {
            form: {
                firstName: "",
                lastName: "",
                email: ""
            }
        }
    },
    created() {
        this.form = {
            firstName: this.gAutoFill.firstName,
            lastName: this.gAutoFill.lastName,
            email: this.gAutoFill.email
        }
    },
    watch: {
        gAutoFill() {
            this.form = {
                firstName: this.gAutoFill.firstName,
                lastName: this.gAutoFill.lastName,
                email: this.gAutoFill.email
            }
        }
    },
    computed: {
        ...mapState('user', ['gAutoFill'])
    },
    methods: {
        ...mapActions('user', ['createUser']),
        onSubmit(evt) {
            evt.preventDefault();
            console.log(this.form);
            this.createUser({ token: this.gAutoFill.idToken, imgPath: this.gAutoFill.imgPath, ...this.form });
        },
        onReset() {
            
        }
    }
}
</script>

<style scoped>
#createUserContainer {
    flex-direction: row;
    text-align: start;
    padding: 10px;
}

#createUserForm {
    flex-direction: row;
}
</style>
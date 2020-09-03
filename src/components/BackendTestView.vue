<template>
    <div id="backendTestContainer">
        <div class="testSection">
            <b-form-group label="Google Id Login">
                <b-form-input type="text" placeholder="Google Token" :value=gAutoFill.idToken @input=setGoogleId></b-form-input>
                <b-button @click=startLogin>Login</b-button>
                <b-button @click=logout>Logout</b-button>
            </b-form-group>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
    name: "BackendTest",
    data() {
        return {
            googleId: ""
        }
    },
    computed: {
        ...mapState('user', ['gAutoFill'])
    },
    methods: {
        ...mapActions("user", ["login", "logout"]),
        setGoogleId(event) {
            this.googleId = event;
        },
        startLogin() {
            console.log(this.googleId);
            this.login(this.googleId);
        }
    }
}
</script>

<style scoped>
#backendTestContainer {
    padding: 5px;
}

input.form-control {
    width: 30%;
    margin: 0;
}

.testSection {
    width: 100%;
    flex-direction: row;
    justify-content: flex-start;
}
</style>
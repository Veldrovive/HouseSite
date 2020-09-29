<template>
    <div class="nav-bar">
        <b-navbar toggleable="lg" id="navbar" type="dark">
            <b-navbar-brand to="/profile" id="nav-brand">NavBar</b-navbar-brand>
            <b-navbar-nav id="nav">
                <b-nav-item to="/profile">Home</b-nav-item>
                <!-- <b-nav-item id="resetButton" @click="resetTrip">Reset Shopping</b-nav-item> -->
                <GoogleLogin id="loginButton" class='btn btn-secondary' :params=params :onSuccess=onSuccess :onCurrentUser=onCurrentUser>Login</GoogleLogin>
            </b-navbar-nav>
        </b-navbar>
    </div>
</template>

<script>
import GoogleLogin from 'vue-google-login';
import { mapActions } from "vuex";

export default {
    name: "TopBar",
    components: {
        GoogleLogin
    },
    data() {
        return {
            // client_id is the only required property but you can add several more params, full list down bellow on the Auth api section
            params: {
                client_id: "26627556060-f1t8d58sm3rdh7nm76ev0rf3hohaf4nq.apps.googleusercontent.com"
            },
            // only needed if you want to render the button with the google ui
            renderParams: {
                width: 250,
                height: 50,
                longtitle: true
            }
        }
    },
    methods: {
        ...mapActions("user", ["googleAutoFill"]),
        onSuccess(googleUser) {
            const profile = googleUser.getBasicProfile();
            const firstName = profile.getGivenName();
            const lastName = profile.getFamilyName();
            const email = profile.getEmail();
            const imgPath = profile.getImageUrl();
            const idToken = googleUser.getAuthResponse().id_token;

            const loginInfo = { firstName, lastName, email, imgPath, idToken, manualLogin: true };
            this.googleAutoFill(loginInfo);
        },
        onCurrentUser(googleUser) {
            const profile = googleUser.getBasicProfile();
            const firstName = profile.getGivenName();
            const lastName = profile.getFamilyName();
            const email = profile.getEmail();
            const imgPath = profile.getImageUrl();
            const idToken = googleUser.getAuthResponse().id_token;

            const loginInfo = { firstName, lastName, email, imgPath, idToken, manualLogin: false };
            this.googleAutoFill(loginInfo);
        },

    }
}
</script>

<style scoped>
.nav-bar {
    box-shadow: 0 1px 4px;
    z-index: 1;
    min-height: 58px;
    height: 7%;
}

#navbar {
    background-color: #2c3e50;
    height: 100%;
}

#nav {
    flex: 1;
}

#loginButton {
    margin-left: auto;
}

.navbarLink {
    color: white;
}

#nav-brand {
    color: #bdc3c7;
    font-weight: 400;
}
</style>
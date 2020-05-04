<template>
    <div class="nav-bar">
        <b-navbar toggleable="lg" id="navbar" type="dark">
            <b-navbar-brand to="/" id="nav-brand">NavBar</b-navbar-brand>
            <b-navbar-nav>
                <b-nav-item to="/">Home</b-nav-item>
                <b-nav-item to="/shopping">Shopping</b-nav-item>
            </b-navbar-nav>
        </b-navbar>
    </div>
</template>

<script>
export default {
    name: "TopBar"
}
</script>

<style scoped>
#navbar {
    background-color: #2c3e50;
}

.navbarLink {
    color: white;
}

#nav-brand {
    color: #bdc3c7;
    font-weight: 400;
}
</style>
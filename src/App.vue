<template>
  <div id="app">
    <TopBar/>
    <div id="mainContainer">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex'
import TopBar from './components/TopBar.vue'

export default {
  name: 'App',
  components: {
    TopBar
  },
  created: function() {
    this.getOldTrips();
    this.recallTripFromLS();
  },
  methods: {
    ...mapActions("items", ["getOldTrips"]),
    ...mapMutations("items", ["recallTripFromLS"])
  }
}
</script>

<style scoped>
#mainContainer {
  margin: 0 15vw 0 15vw;
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ecf0f1;
}
</style>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: absolute;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>

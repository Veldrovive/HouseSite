<template>
  <div id="app">
    <TopBar/>
    <div id="mainContainer">
      <router-view></router-view>
    </div>
    <Modals/>
  </div>
</template>

<script>
import TopBar from './components/TopBar.vue'
import Modals from './components/Modals';

export default {
  name: 'App',
  components: {
    TopBar,
    Modals
  }
}
</script>

<style scoped>
#mainContainer {
  box-shadow: 1px 0 4px #e0dfdf, -1px 0 4px #e0dfdf;
  margin: 0 15vw 0 15vw;
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ecf0f1;
  min-height: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  position: absolute;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>

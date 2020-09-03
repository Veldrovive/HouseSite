import Vue from 'vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import VueRouter from 'vue-router'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import App from './App.vue'
import store from './storeV2.js'

import Profile from './components/ProfileView.vue';
import CreateUser from './components/CreateUserView.vue'
import Total from './components/TotalView.vue';
import AddShopping from './components/AddShoppingView.vue';
import BackendTest from './components/BackendTestView.vue';
import House from './components/House';

Vue.use(VueRouter)
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)

Vue.config.productionTip = false

const routes = [
  { path: '/shopping', component: AddShopping },
  { path: '/profile', component: Profile },
  { path: '/house/:id/:tab?/:meta?', component: House },
  { path: '/createUser', component: CreateUser},
  { path: '/test', component: BackendTest },
  { path: '/', component: Total}
]

export const router = new VueRouter({
  mode: 'history',
  routes
})

new Vue({
  render: h => h(App),
  router: router,
  store: store
}).$mount('#app')

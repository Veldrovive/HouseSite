import Vue from 'vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import VueRouter from 'vue-router'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import App from './App.vue'
import store from './store.js'

import Total from './components/TotalView.vue'
import AddShopping from './components/AddShoppingView.vue'

Vue.use(VueRouter)
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)

Vue.config.productionTip = false

const routes = [
  { path: '/shopping', component: AddShopping },
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

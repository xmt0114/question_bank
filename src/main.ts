import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import App from './App.vue'
import { FontAwesomeIcon } from './plugins/fontawesome'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 注册Font Awesome组件
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')

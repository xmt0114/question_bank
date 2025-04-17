import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/tutorial',
      name: 'tutorial',
      component: () => import('../views/TutorialMode.vue')
    },
    {
      path: '/exam',
      name: 'exam',
      component: () => import('../views/ExamMode.vue')
    }
  ]
})

export default router

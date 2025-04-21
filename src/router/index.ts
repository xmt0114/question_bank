import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

// 根据环境变量确定是否为管理员模式
const isAdminMode = import.meta.env.VITE_APP_MODE === 'admin'

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
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      children: [
        {
          path: '',
          redirect: { name: 'settings-organizations' }
        },
        {
          path: 'organizations',
          name: 'settings-organizations',
          component: () => import('../views/settings/OrganizationsManager.vue')
        },
        {
          path: 'categories',
          name: 'settings-categories',
          component: () => import('../views/settings/CategoriesManager.vue')
        },
        {
          path: 'levels',
          name: 'settings-levels',
          component: () => import('../views/settings/LevelsManager.vue')
        },
        {
          path: 'papers',
          name: 'settings-papers',
          component: () => import('../views/settings/PapersManager.vue')
        }
      ]
    }
  ]
})

// 添加导航守卫，根据模式控制路由访问
router.beforeEach((to, from, next) => {
  // 如果是管理员模式，允许访问所有路由
  if (isAdminMode) {
    next()
    return
  }

  // 如果是用户模式，不允许访问设置页面
  if (to.path.startsWith('/settings')) {
    next('/')
    return
  }

  next()
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import Dashboard from '../views/Dashboard.vue'
import Users from '../views/Users.vue'
import Classes from '../views/Classes.vue'
import Courses from '../views/Courses.vue'
import CheckInRecords from '../views/CheckInRecords.vue'
import Profile from '../views/Profile.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '数据概览', icon: 'Odometer' }
      },
      {
        path: 'users',
        name: 'Users',
        component: Users,
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'classes',
        name: 'Classes',
        component: Classes,
        meta: { title: '班级管理', icon: 'School' }
      },
      {
        path: 'courses',
        name: 'Courses',
        component: Courses,
        meta: { title: '课程管理', icon: 'Reading' }
      },
      {
        path: 'checkin',
        name: 'CheckInRecords',
        component: CheckInRecords,
        meta: { title: '签到记录', icon: 'Check' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: { title: '个人设置', icon: 'Setting' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
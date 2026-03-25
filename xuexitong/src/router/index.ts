import { createRouter, createWebHistory } from 'vue-router'
import { getToken, getCurrentUser } from '../utils/sessionStorage'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import StudentDashboard from '../views/student/StudentDashboard.vue'
import TeacherDashboard from '../views/teacher/TeacherDashboard.vue'
import ClassManagement from '../views/teacher/ClassManagement.vue'
import CompleteProfile from '../views/student/CompleteProfile.vue'
import TeacherAttendanceRecords from '../views/teacher/AttendanceRecords.vue'
import TeacherProfile from '../views/teacher/TeacherProfile.vue'
import StudentAttendanceRecords from '../views/student/AttendanceRecords.vue'
import StudentProfile from '../views/student/StudentProfile.vue'
import JoinClass from '../views/student/JoinClass.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
    },
    {
      path: '/student',
      redirect: '/student/dashboard',
    },
    {
      path: '/student/dashboard',
      name: 'student-dashboard',
      component: StudentDashboard,
    },
    {
      path: '/student/complete-profile',
      name: 'complete-profile',
      component: CompleteProfile,
    },
    {
      path: '/student/attendance',
      name: 'student-attendance',
      component: StudentAttendanceRecords,
    },
    {
      path: '/student/join-class',
      name: 'join-class',
      component: JoinClass,
    },
    {
      path: '/student/profile',
      name: 'student-profile',
      component: StudentProfile,
    },
    {
      path: '/teacher',
      redirect: '/teacher/dashboard',
    },
    {
      path: '/teacher/dashboard',
      name: 'teacher-dashboard',
      component: TeacherDashboard,
    },
    {
      path: '/teacher/class',
      name: 'class-management',
      component: ClassManagement,
    },
    {
      path: '/teacher/attendance',
      name: 'teacher-attendance',
      component: TeacherAttendanceRecords,
    },
    {
      path: '/teacher/profile',
      name: 'teacher-profile',
      component: TeacherProfile,
    },
    {
      path: '/',
      redirect: '/login',
    },
  ],
})

// 路由守卫 - 权限控制
router.beforeEach((to, from, next) => {
  const token = getToken()
  const user = getCurrentUser()

  // 需要登录的页面
  const authRequired = to.path.startsWith('/student') || to.path.startsWith('/teacher')

  // 学生专属页面
  const studentOnly = to.path.startsWith('/student')

  // 教师专属页面
  const teacherOnly = to.path.startsWith('/teacher')

  if (authRequired && !token) {
    // 未登录，跳转到登录页
    return next('/login')
  }

  if (studentOnly && user?.role !== 'student') {
    // 非学生访问学生页面
    return next('/login')
  }

  if (teacherOnly && user?.role !== 'teacher') {
    // 非教师访问教师页面
    return next('/login')
  }

  // 已登录用户访问登录页，跳转到对应首页
  if ((to.path === '/login' || to.path === '/register') && token) {
    if (user?.role === 'student') {
      return next('/student/dashboard')
    } else if (user?.role === 'teacher') {
      return next('/teacher/dashboard')
    }
  }

  next()
})

export default router

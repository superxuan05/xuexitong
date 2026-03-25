<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getToken, getCurrentUser, logout as storageLogout } from '../../utils/sessionStorage'
import wsClient from '../../utils/websocket'

const router = useRouter()
const loading = ref(false)

const userInfo = ref({
  name: '',
  teacherId: '',
  department: '',
  title: '',
  avatar: '',
})

const currentDate = computed(() => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }
  return now.toLocaleDateString('zh-CN', options)
})

// 今日课程
const todayCourses = ref<any[]>([])

// 统计
const stats = ref({
  totalCourses: 0,
  totalStudents: 0,
  todayCheckInRate: 0,
  monthCheckInRate: 96,
})

// 签到弹窗
const showCheckInModal = ref(false)
const selectedCourse = ref<any>(null)
const checkInDuration = ref(5)
const generatedCode = ref('')
const showCode = ref(false)
const currentCheckInId = ref<number | null>(null)

// 获取教师信息
const fetchUserInfo = async () => {
  try {
    const user = getCurrentUser()
    if (user) {
      userInfo.value.name = user.name || '教师'
      userInfo.value.teacherId = user.username || ''
    }

    const response = await fetch('http://localhost:3000/api/teacher/profile', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        userInfo.value = {
          ...userInfo.value,
          ...data.data,
          teacherId: data.data.username
        }
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 获取概览数据
const fetchDashboard = async () => {
  loading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/teacher/dashboard', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        stats.value.totalCourses = data.data.stats.courseCount
        stats.value.totalStudents = data.data.stats.studentCount

        // 使用今日课程数据（包含签到状态）
        if (data.data.todayCourses && data.data.todayCourses.length > 0) {
          todayCourses.value = data.data.todayCourses.map((item: any) => {
            // 处理时间格式，可能是 "08:00:00" 或完整日期时间
            const formatTime = (timeStr: string) => {
              if (!timeStr) return ''
              // 如果是完整时间格式 HH:MM:SS，取前5位 HH:MM
              if (timeStr.includes(':')) {
                return timeStr.substring(0, 5)
              }
              return timeStr
            }

            const startTime = formatTime(item.start_time)
            const endTime = formatTime(item.end_time)

            return {
              id: item.id,
              recordId: item.record_id,
              name: item.name,
              class: item.class_name,
              classroom: item.classroom || '待定',
              time: startTime && endTime
                ? `${startTime} - ${endTime}`
                : '08:00 - 09:40',
              studentCount: item.student_count || 0,
              checkedCount: 0,
              status: item.course_status || 'upcoming',
              checkInCode: item.check_in_code
            }
          })
        } else if (data.data.todayCheckIns && data.data.todayCheckIns.length > 0) {
          // 兼容旧数据格式
          todayCourses.value = data.data.todayCheckIns.map((item: any) => ({
            id: item.course_id,
            recordId: item.id,
            name: item.course_name,
            class: item.class_name,
            classroom: item.classroom || '待定',
            time: new Date(item.start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) + ' - ' +
                  new Date(item.end_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            studentCount: item.total_count,
            checkedCount: item.checked_count,
            status: item.status === 'ongoing' ? 'ongoing' : item.status === 'completed' ? 'completed' : 'upcoming',
            checkInCode: item.check_in_code
          }))
        } else {
          todayCourses.value = []
        }
      }
    }
  } catch (error) {
    console.error('获取概览数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 发起签到
const openCheckInModal = (course: any) => {
  selectedCourse.value = course
  checkInDuration.value = 5
  generatedCode.value = ''
  showCode.value = false
  currentCheckInId.value = null
  showCheckInModal.value = true
}

// 生成签到码
const generateCheckInCode = async () => {
  if (!selectedCourse.value) return

  try {
    const response = await fetch('http://localhost:3000/api/teacher/checkin/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        course_id: selectedCourse.value.id,
        duration: checkInDuration.value
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        generatedCode.value = data.data.check_in_code
        currentCheckInId.value = data.data.record_id
        showCode.value = true
        // 更新列表中对应课程的签到信息
        const courseIndex = todayCourses.value.findIndex(c => c.id === selectedCourse.value.id)
        if (courseIndex !== -1) {
          todayCourses.value[courseIndex].checkInCode = data.data.check_in_code
          todayCourses.value[courseIndex].recordId = data.data.record_id
        }
        // 同时更新选中课程
        selectedCourse.value.checkInCode = data.data.check_in_code
        selectedCourse.value.recordId = data.data.record_id
      }
    }
  } catch (error) {
    console.error('发起签到失败:', error)
    alert('发起签到失败，请重试')
  }
}

// 结束签到
const endCheckIn = async (course: any) => {
  if (!course.recordId) {
    alert('签到记录ID不存在')
    return
  }

  if (!confirm('确定要结束签到吗？结束后学生将无法签到。')) {
    return
  }

  try {
    const response = await fetch(`http://localhost:3000/api/teacher/checkin/${course.recordId}/end`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        alert('签到已结束')
        // 更新课程状态
        course.status = 'completed'
        course.checkInCode = null
        course.checkInStatus = 'completed'
        // 强制刷新列表
        await fetchDashboard()
      } else {
        alert(data.message || '结束签到失败')
      }
    } else {
      const errorData = await response.json()
      alert(errorData.message || '结束签到失败')
    }
  } catch (error) {
    console.error('结束签到失败:', error)
    alert('结束签到失败，请检查网络连接')
  }
}

// 导航到班级管理
const goToClassManagement = () => {
  router.push('/teacher/class')
}

// 导航到考勤记录
const goToAttendance = () => {
  router.push('/teacher/attendance')
}

// 导航到个人中心
const goToProfile = () => {
  router.push('/teacher/profile')
}

const logout = () => {
  storageLogout()
  router.push('/login')
}

// 实时通知
const notifications = ref<any[]>([])
const showNotification = ref(false)
const currentNotification = ref<any>(null)

// 显示通知
const displayNotification = (data: any) => {
  currentNotification.value = data
  showNotification.value = true
  notifications.value.unshift(data)
  
  // 3秒后自动隐藏
  setTimeout(() => {
    showNotification.value = false
  }, 5000)
}

onMounted(() => {
  fetchUserInfo()
  fetchDashboard()
  
  // 连接WebSocket
  wsClient.connect()
  
  // 监听学生加入事件
  wsClient.on('student_joined', (data) => {
    console.log('学生加入班级:', data)
    displayNotification({
      type: 'success',
      title: '新学生加入',
      message: data.message,
      data: data.data
    })
    // 刷新数据
    fetchDashboard()
  })
  
  // 监听学生签到事件
  wsClient.on('student_checked_in', (data) => {
    console.log('学生签到:', data)
    displayNotification({
      type: 'info',
      title: '学生签到',
      message: data.message,
      data: data.data
    })
    // 刷新数据
    fetchDashboard()
  })
})

onUnmounted(() => {
  // 断开WebSocket连接
  wsClient.disconnect()
})
</script>

<template>
  <div class="teacher-dashboard">
    <!-- 实时通知 -->
    <transition name="notification">
      <div v-if="showNotification && currentNotification" class="notification-toast" :class="currentNotification.type">
        <div class="notification-icon">
          <svg v-if="currentNotification.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>
        <div class="notification-content">
          <h4>{{ currentNotification.title }}</h4>
          <p>{{ currentNotification.message }}</p>
        </div>
        <button class="notification-close" @click="showNotification = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </transition>

    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>智签 - 教师端</span>
        </div>
      </div>
      <div class="header-right">
        <div class="user-info">
          <div class="avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span class="user-name">{{ userInfo.name }}</span>
        </div>
        <button class="logout-btn" @click="logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>

    <div class="main-container">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <a href="#" class="nav-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>今日课程</span>
          </a>
          <a href="#" class="nav-item" @click.prevent="goToClassManagement">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span>班级管理</span>
          </a>
          <a href="#" class="nav-item" @click.prevent="goToAttendance">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>考勤记录</span>
          </a>
          <a href="#" class="nav-item" @click.prevent="goToProfile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>个人中心</span>
          </a>
        </nav>
      </aside>

      <!-- 主内容区 -->
      <main class="main-content">
        <!-- 欢迎区域 -->
        <div class="welcome-section">
          <div class="welcome-text">
            <h1>早上好，{{ userInfo.name }} 👋</h1>
            <p>{{ currentDate }}</p>
          </div>
          <div class="teacher-info">
            <p>工号：{{ userInfo.teacherId }}</p>
            <p>{{ userInfo.department || '计算机学院' }} · {{ userInfo.title || '教师' }}</p>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalCourses }}</span>
              <span class="stat-label">授课课程</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalStudents }}</span>
              <span class="stat-label">学生总数</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.todayCheckInRate }}%</span>
              <span class="stat-label">今日出勤率</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.monthCheckInRate }}%</span>
              <span class="stat-label">本月出勤率</span>
            </div>
          </div>
        </div>

        <!-- 今日课程 -->
        <div class="courses-section">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            今日签到
          </h2>
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="todayCourses.length === 0" class="empty-state">
            <p>今日暂无签到记录</p>
          </div>
          <div v-else class="courses-list">
              <div v-for="course in todayCourses" :key="course.recordId" class="course-card"
                :class="course.status">
                <div class="course-time">
                  <span class="time">{{ course.time }}</span>
                  <span class="status-badge" :class="course.status">
                    {{ course.status === 'completed' ? '已结束' : course.status === 'ongoing' ? '进行中' : '未开始' }}
                  </span>
                </div>
                <div class="course-info">
                  <h3 class="course-name">{{ course.name }}</h3>
                  <p class="course-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    {{ course.class }}
                  </p>
                  <p class="course-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {{ course.classroom }}
                  </p>
                </div>
                <div class="course-stats">
                  <div class="stat-row">
                    <span class="stat-label">应到</span>
                    <span class="stat-value">{{ course.studentCount }}人</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">实到</span>
                    <span class="stat-value"
                      :class="{ 'text-green': course.checkedCount > 0 }">{{ course.checkedCount }}人</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">出勤率</span>
                    <span class="stat-value">{{ course.studentCount > 0 ? Math.round((course.checkedCount /
                      course.studentCount) * 100) : 0 }}%</span>
                  </div>
                </div>
                <div class="course-action">
                  <button v-if="course.status === 'ongoing' && !course.checkInCode" class="start-check-in-btn"
                    @click="openCheckInModal(course)">
                    发起签到
                  </button>
                  <button v-else-if="course.status === 'ongoing' && course.checkInCode" class="end-check-in-btn"
                    @click="endCheckIn(course)">
                    结束签到
                  </button>
                  <span v-else-if="course.status === 'completed' || course.checkInStatus === 'completed'" class="view-detail">
                    已结束
                  </span>
                  <span v-else class="waiting">
                    {{ course.time }}
                  </span>
                </div>
              </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            快捷操作
          </h2>
          <div class="actions-grid">
            <div class="action-card" @click="goToAttendance">
              <div class="action-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span class="action-name">导出考勤</span>
            </div>
            <div class="action-card" @click="goToClassManagement">
              <div class="action-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <span class="action-name">学生管理</span>
            </div>
            <div class="action-card" @click="goToAttendance">
              <div class="action-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.21 15.89A10 10 0 118 2.83" />
                  <path d="M22 12A10 10 0 0012 2v10z" />
                </svg>
              </div>
              <span class="action-name">考勤统计</span>
            </div>
            <div class="action-card" @click="goToProfile">
              <div class="action-icon orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </div>
              <span class="action-name">系统设置</span>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 发起签到弹窗 -->
    <div v-if="showCheckInModal" class="modal-overlay" @click.self="showCheckInModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>发起签到</h3>
          <button class="close-btn" @click="showCheckInModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="course-info-modal">
            <h4>{{ selectedCourse?.name }}</h4>
            <p>{{ selectedCourse?.class }} · {{ selectedCourse?.classroom }}</p>
          </div>

          <div v-if="!showCode" class="check-in-config">
            <label>签到时长</label>
            <div class="duration-options">
              <button v-for="min in [3, 5, 10, 15]" :key="min" class="duration-btn"
                :class="{ active: checkInDuration === min }" @click="checkInDuration = min">
                {{ min }}分钟
              </button>
            </div>
            <button class="generate-btn" @click="generateCheckInCode">
              生成签到码
            </button>
          </div>

          <div v-else class="code-display">
            <p class="code-label">签到码</p>
            <div class="code-numbers">
              <span v-for="(digit, index) in generatedCode" :key="index" class="code-digit">
                {{ digit }}
              </span>
            </div>
            <p class="code-hint">请告诉学生输入此签到码</p>
            <p class="code-timer">签到将在 {{ checkInDuration }} 分钟后自动结束</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.teacher-dashboard {
  min-height: 100vh;
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 顶部导航 */
.header {
  height: 64px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.header-left .logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #0f766e;
}

.header-left .logo svg {
  width: 28px;
  height: 28px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 36px;
  height: 36px;
  background: #f0fdfa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #14b8a6;
}

.avatar svg {
  width: 20px;
  height: 20px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.logout-btn {
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.logout-btn svg {
  width: 18px;
  height: 18px;
}

/* 主容器 */
.main-container {
  display: flex;
  padding-top: 64px;
  min-height: 100vh;
}

/* 侧边栏 */
.sidebar {
  width: 220px;
  background: white;
  border-right: 1px solid #e5e7eb;
  padding: 24px 16px;
  position: fixed;
  top: 64px;
  bottom: 0;
  left: 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
  cursor: pointer;
}

.nav-item svg {
  width: 20px;
  height: 20px;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-item.active {
  background: #f0fdfa;
  color: #14b8a6;
  font-weight: 500;
}

/* 主内容区 */
.main-content {
  flex: 1;
  margin-left: 220px;
  padding: 32px;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, #0f766e 0%, #134e4a 100%);
  border-radius: 16px;
  padding: 32px;
  color: white;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.welcome-text p {
  font-size: 14px;
  opacity: 0.9;
}

.teacher-info {
  text-align: right;
  font-size: 13px;
  opacity: 0.9;
  line-height: 1.8;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.blue {
  background: #dbeafe;
  color: #3b82f6;
}

.stat-icon.green {
  background: #d1fae5;
  color: #10b981;
}

.stat-icon.purple {
  background: #ede9fe;
  color: #8b5cf6;
}

.stat-icon.orange {
  background: #ffedd5;
  color: #f97316;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  display: block;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
}

/* 课程区域 */
.courses-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title svg {
  width: 22px;
  height: 22px;
  color: #14b8a6;
}

.loading,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  border: 1.5px solid #e5e7eb;
  transition: all 0.2s;
}

.course-card:hover {
  border-color: #14b8a6;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.1);
}

.course-card.ongoing {
  border-color: #14b8a6;
  background: #f0fdfa;
}

.course-time {
  width: 140px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.time {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.status-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
  width: fit-content;
}

.status-badge.completed {
  background: #e5e7eb;
  color: #6b7280;
}

.status-badge.ongoing {
  background: #14b8a6;
  color: white;
}

.status-badge.upcoming {
  background: #dbeafe;
  color: #3b82f6;
}

.course-info {
  flex: 1;
  padding: 0 24px;
}

.course-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.course-detail {
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.course-detail svg {
  width: 14px;
  height: 14px;
}

.course-stats {
  width: 120px;
  padding: 0 16px;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}

.stat-row .stat-label {
  color: #9ca3af;
}

.stat-row .stat-value {
  font-weight: 600;
  color: #374151;
}

.stat-row .stat-value.text-green {
  color: #10b981;
}

.course-action {
  width: 100px;
  text-align: center;
}

.start-check-in-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.start-check-in-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
}

.end-check-in-btn {
  padding: 10px 20px;
  background: #fee2e2;
  border: none;
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.end-check-in-btn:hover {
  background: #fecaca;
}

.view-detail {
  color: #14b8a6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.view-detail:hover {
  text-decoration: underline;
}

.waiting {
  color: #9ca3af;
  font-size: 14px;
}

/* 快捷操作 */
.quick-actions {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border-radius: 12px;
  border: 1.5px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.action-card:hover {
  border-color: #14b8a6;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.1);
  transform: translateY(-2px);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon svg {
  width: 24px;
  height: 24px;
}

.action-icon.blue {
  background: #dbeafe;
  color: #3b82f6;
}

.action-icon.green {
  background: #d1fae5;
  color: #10b981;
}

.action-icon.purple {
  background: #ede9fe;
  color: #8b5cf6;
}

.action-icon.orange {
  background: #ffedd5;
  color: #f97316;
}

.action-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.modal-body {
  padding: 24px;
}

.course-info-modal {
  text-align: center;
  margin-bottom: 24px;
}

.course-info-modal h4 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.course-info-modal p {
  font-size: 14px;
  color: #6b7280;
}

.check-in-config {
  text-align: center;
}

.check-in-config label {
  display: block;
  font-size: 14px;
  color: #374151;
  margin-bottom: 16px;
}

.duration-options {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}

.duration-btn {
  padding: 10px 20px;
  background: #f3f4f6;
  border: 2px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.duration-btn:hover {
  background: #e5e7eb;
}

.duration-btn.active {
  background: #f0fdfa;
  border-color: #14b8a6;
  color: #14b8a6;
}

.generate-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.generate-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(20, 184, 166, 0.35);
}

.code-display {
  text-align: center;
}

.code-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.code-numbers {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.code-digit {
  width: 56px;
  height: 72px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  color: white;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

.code-hint {
  font-size: 14px;
  color: #374151;
  margin-bottom: 8px;
}

.code-timer {
  font-size: 13px;
  color: #6b7280;
}

/* 响应式 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .main-content {
    margin-left: 0;
  }

  .header {
    padding: 0 16px;
  }

  .main-content {
    padding: 16px;
  }

  .welcome-section {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .teacher-info {
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .course-card {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .course-time {
    width: 100%;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  .course-info {
    padding: 0;
  }

  .course-stats {
    width: 100%;
    border: none;
    border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    padding: 16px 0;
  }

  .course-action {
    width: 100%;
  }
}

/* 通知样式 */
.notification-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
  min-width: 300px;
  max-width: 400px;
}

.notification-toast.success {
  border-left-color: #10b981;
}

.notification-toast.info {
  border-left-color: #3b82f6;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-toast.success .notification-icon {
  background: #d1fae5;
  color: #059669;
}

.notification-toast.info .notification-icon {
  background: #dbeafe;
  color: #2563eb;
}

.notification-icon svg {
  width: 20px;
  height: 20px;
}

.notification-content {
  flex: 1;
}

.notification-content h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.notification-content p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.notification-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: all 0.2s;
}

.notification-close:hover {
  background: #f3f4f6;
  color: #4b5563;
}

.notification-close svg {
  width: 16px;
  height: 16px;
}

/* 通知动画 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
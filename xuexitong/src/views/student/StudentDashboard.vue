<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { logout as storageLogout, getCurrentUser, getToken } from '../../utils/sessionStorage'
import AccountSwitcher from '../../components/AccountSwitcher.vue'
import wsClient from '../../utils/websocket'

const router = useRouter()

const userInfo = ref({
  name: '',
  studentId: '',
  class: '',
  avatar: '',
})

// 获取用户信息
const fetchUserInfo = async () => {
  // 先从 sessionStorage 获取基本信息
  const user = getCurrentUser()
  if (user) {
    userInfo.value.name = user.name || '未知用户'
    userInfo.value.studentId = user.username || ''
  }

  // 然后从后端获取详细信息
  try {
    const response = await fetch('http://localhost:3000/api/student/profile', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data) {
        userInfo.value.name = data.data.name || userInfo.value.name
        userInfo.value.studentId = data.data.username || userInfo.value.studentId
        userInfo.value.class = data.data.class_name || ''
        userInfo.value.avatar = data.data.avatar || ''
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

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
const todayCourses = ref([
  {
    id: 1,
    name: '数据结构与算法',
    teacher: '李老师',
    classroom: 'A101',
    time: '08:00 - 09:40',
    status: 'completed', // completed, ongoing, upcoming
    checkedIn: true,
  },
  {
    id: 2,
    name: '操作系统原理',
    teacher: '王老师',
    classroom: 'B203',
    time: '10:00 - 11:40',
    status: 'ongoing',
    checkedIn: false,
    checkInCode: '1234',
  },
  {
    id: 3,
    name: '计算机网络',
    teacher: '张老师',
    classroom: 'C305',
    time: '14:00 - 15:40',
    status: 'upcoming',
    checkedIn: false,
  },
])

// 签到统计
const checkInStats = ref({
  total: 45,
  checked: 42,
  late: 2,
  absent: 1,
})

const checkInCode = ref('')
const showCheckInModal = ref(false)
const selectedCourse = ref<any>(null)
const checkInSuccess = ref(false)

const openCheckInModal = (course: any) => {
  selectedCourse.value = course
  checkInCode.value = ''
  checkInSuccess.value = false
  showCheckInModal.value = true
}

const submitCheckIn = async () => {
  if (checkInCode.value.length !== 4) {
    alert('请输入4位签到码')
    return
  }

  if (!selectedCourse.value?.recordId) {
    alert('课程信息不完整，无法签到')
    return
  }

  try {
    const response = await fetch('http://localhost:3000/api/student/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        record_id: selectedCourse.value.recordId,
        check_in_code: checkInCode.value
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      checkInSuccess.value = true
      selectedCourse.value.checkedIn = true
      checkInStats.value.checked++
      alert('签到成功！')
      setTimeout(() => {
        showCheckInModal.value = false
      }, 1500)
    } else {
      alert(data.message || '签到失败')
    }
  } catch (error) {
    console.error('签到错误:', error)
    alert('签到失败，请检查网络连接')
  }
}

const logout = () => {
  storageLogout()
  router.push('/login')
}

// 获取今日课程
const fetchTodayCourses = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/student/dashboard', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        // 转换课程数据
        todayCourses.value = data.data.courses.map((course: any) => ({
          id: course.id,
          name: course.name,
          teacher: course.teacher_name,
          classroom: course.classroom || '未设置',
          time: `${course.start_time?.substring(0, 5) || '08:00'} - ${course.end_time?.substring(0, 5) || '09:40'}`,
          status: getCourseStatus(course.start_time, course.end_time),
          checkedIn: course.check_in_status === 'checked',
          recordId: course.record_id,
          checkInCode: course.check_in_code
        }))
        // 更新统计
        if (data.data.stats) {
          checkInStats.value = data.data.stats
        }
      }
    }
  } catch (error) {
    console.error('获取课程失败:', error)
  }
}

// 根据时间判断课程状态
const getCourseStatus = (startTime: string, endTime: string) => {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const start = startTime ? parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]) : 480
  const end = endTime ? parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]) : 580

  if (currentTime < start) return 'upcoming'
  if (currentTime > end) return 'completed'
  return 'ongoing'
}

// WebSocket消息处理
const handleWebSocketMessage = (message: any) => {
  console.log('收到WebSocket消息:', message)

  if (message.type === 'check_in_started') {
    // 教师发起了签到，刷新课程列表
    alert(`课程 "${message.data?.course_name || ''}" 开始签到了！签到码: ${message.data?.check_in_code || ''}`)
    fetchTodayCourses()
  } else if (message.type === 'check_in_ended') {
    // 教师结束了签到
    alert(`课程 "${message.data?.course_name || ''}" 签到已结束`)
    fetchTodayCourses()
  } else if (message.type === 'new_course') {
    // 新课程
    fetchTodayCourses()
  }
}

onMounted(() => {
  fetchUserInfo()
  fetchTodayCourses()

  // 连接WebSocket
  const user = getCurrentUser()
  if (user) {
    wsClient.connect(user.id, 'student')
    wsClient.onMessage(handleWebSocketMessage)
  }
})

onUnmounted(() => {
  // 断开WebSocket连接
  wsClient.disconnect()
})
</script>

<template>
  <div class="student-dashboard">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>智签 - 学生端</span>
        </div>
      </div>
      <div class="header-right">
        <AccountSwitcher />
        <button class="logout-btn" @click="logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>

    <div class="main-container">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <router-link to="/student" class="nav-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>今日课程</span>
          </router-link>
          <router-link to="/student/join-class" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>加入课堂</span>
          </router-link>
          <router-link to="/student/attendance" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>考勤记录</span>
          </router-link>
          <router-link to="/student/profile" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>个人中心</span>
          </router-link>
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
          <div class="student-info">
            <p>学号：{{ userInfo.studentId }}</p>
            <p>{{ userInfo.class }}</p>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ checkInStats.checked }}</span>
              <span class="stat-label">已签到</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon yellow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ checkInStats.late }}</span>
              <span class="stat-label">迟到</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ checkInStats.absent }}</span>
              <span class="stat-label">缺勤</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ Math.round((checkInStats.checked / checkInStats.total) * 100) }}%</span>
              <span class="stat-label">出勤率</span>
            </div>
          </div>
        </div>

        <!-- 今日课程 -->
        <div class="courses-section">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            今日课程
          </h2>
          <div class="courses-list">
            <div 
              v-for="course in todayCourses" 
              :key="course.id" 
              class="course-card"
              :class="course.status"
            >
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
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {{ course.teacher }}
                </p>
                <p class="course-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {{ course.classroom }}
                </p>
              </div>
              <div class="course-action">
                <button 
                  v-if="course.status === 'ongoing' && !course.checkedIn"
                  class="check-in-btn"
                  @click="openCheckInModal(course)"
                >
                  立即签到
                </button>
                <span v-else-if="course.checkedIn" class="checked-in">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  已签到
                </span>
                <span v-else-if="course.status === 'completed' && !course.checkedIn" class="missed">
                  缺勤
                </span>
                <span v-else class="waiting">等待中</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 签到弹窗 -->
    <div v-if="showCheckInModal" class="modal-overlay" @click.self="showCheckInModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>课程签到</h3>
          <button class="close-btn" @click="showCheckInModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="!checkInSuccess" class="check-in-form">
            <div class="course-info-modal">
              <h4>{{ selectedCourse?.name }}</h4>
              <p>{{ selectedCourse?.teacher }} · {{ selectedCourse?.classroom }}</p>
            </div>
            <div class="code-input-section">
              <label>请输入4位签到码</label>
              <input 
                v-model="checkInCode" 
                type="text" 
                maxlength="4" 
                class="code-input"
                placeholder="0000"
              />
            </div>
            <button class="submit-btn" @click="submitCheckIn">确认签到</button>
          </div>
          <div v-else class="success-message">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h4>签到成功！</h4>
            <p>您已成功签到 {{ selectedCourse?.name }}</p>
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

.student-dashboard {
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

.nav-item:hover,
a.nav-item:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-item.active,
a.nav-item.active {
  background: #f0fdfa;
  color: #14b8a6;
  font-weight: 500;
}

a.nav-item {
  color: #6b7280;
  text-decoration: none;
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

.student-info {
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

.stat-icon.yellow {
  background: #fef3c7;
  color: #f59e0b;
}

.stat-icon.red {
  background: #fee2e2;
  color: #ef4444;
}

.stat-icon.green {
  background: #d1fae5;
  color: #10b981;
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

.course-action {
  width: 100px;
  text-align: center;
}

.check-in-btn {
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

.check-in-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
}

.checked-in {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #10b981;
  font-size: 14px;
  font-weight: 500;
}

.checked-in svg {
  width: 18px;
  height: 18px;
}

.missed {
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
}

.waiting {
  color: #9ca3af;
  font-size: 14px;
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

.code-input-section {
  margin-bottom: 24px;
}

.code-input-section label {
  display: block;
  font-size: 14px;
  color: #374151;
  margin-bottom: 12px;
  text-align: center;
}

.code-input {
  width: 100%;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 32px;
  text-align: center;
  letter-spacing: 8px;
  font-weight: 600;
  color: #1f2937;
  transition: all 0.2s;
}

.code-input:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

.submit-btn {
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

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(20, 184, 166, 0.35);
}

.success-message {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  animation: successPop 0.5s ease;
}

.success-icon svg {
  width: 32px;
  height: 32px;
}

@keyframes successPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.success-message h4 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.success-message p {
  font-size: 14px;
  color: #6b7280;
}

/* 响应式 */
@media (max-width: 1024px) {
  .stats-grid {
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

  .student-info {
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

  .course-action {
    width: 100%;
  }
}
</style>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getToken, getCurrentUser, logout as storageLogout } from '../../utils/sessionStorage'

const router = useRouter()

const userInfo = ref({
  name: '',
  studentId: '',
})

const inviteCode = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref('') // 'success' | 'error'

const myClasses = ref<any[]>([])

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const user = getCurrentUser()
    if (user) {
      userInfo.value.name = user.name || '学生'
      userInfo.value.studentId = user.username || ''
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 获取已加入的班级
const fetchMyClasses = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/student/classes', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        myClasses.value = data.data
      }
    }
  } catch (error) {
    console.error('获取班级列表失败:', error)
  }
}

// 加入班级
const joinClass = async () => {
  if (!inviteCode.value.trim()) {
    message.value = '请输入邀请码'
    messageType.value = 'error'
    return
  }

  loading.value = true
  message.value = ''

  try {
    const response = await fetch('http://localhost:3000/api/student/join-class', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ invite_code: inviteCode.value.trim() })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      message.value = `成功加入班级：${data.data.class_name}`
      messageType.value = 'success'
      inviteCode.value = ''
      fetchMyClasses() // 刷新班级列表
    } else {
      // 处理权限不足错误
      if (response.status === 403) {
        message.value = '登录已过期或权限不足，请重新登录'
        messageType.value = 'error'
        // 3秒后跳转到登录页
        setTimeout(() => {
          logout()
        }, 3000)
      } else {
        message.value = data.message || '加入失败，请检查邀请码'
        messageType.value = 'error'
      }
    }
  } catch (error) {
    console.error('加入班级失败:', error)
    message.value = '网络错误，请稍后重试'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

// 退出班级
const leaveClass = async (classId: number) => {
  if (!confirm('确定要退出这个班级吗？')) return

  try {
    const response = await fetch(`http://localhost:3000/api/student/classes/${classId}/leave`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        message.value = '已退出班级'
        messageType.value = 'success'
        fetchMyClasses()
      }
    }
  } catch (error) {
    console.error('退出班级失败:', error)
    message.value = '退出失败'
    messageType.value = 'error'
  }
}

const logout = () => {
  storageLogout()
  router.push('/login')
}

onMounted(() => {
  fetchUserInfo()
  fetchMyClasses()
})
</script>

<template>
  <div class="join-class">
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
        <div class="user-info">
          <div class="avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span class="user-name">{{ userInfo.name }}</span>
        </div>
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
          <router-link to="/student" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>今日课程</span>
          </router-link>
          <router-link to="/student/join-class" class="nav-item active">
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
        <div class="page-header">
          <h1>加入课堂</h1>
        </div>

        <!-- 加入班级卡片 -->
        <div class="join-card">
          <div class="join-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <h2>输入邀请码加入班级</h2>
          <p>向老师获取班级邀请码，输入后即可加入班级</p>
          
          <div class="input-group">
            <input 
              v-model="inviteCode" 
              type="text" 
              placeholder="请输入6位邀请码"
              maxlength="10"
              @keyup.enter="joinClass"
            />
            <button 
              class="join-btn" 
              @click="joinClass"
              :disabled="loading"
            >
              {{ loading ? '加入中...' : '加入班级' }}
            </button>
          </div>

          <!-- 提示消息 -->
          <div v-if="message" class="message" :class="messageType">
            {{ message }}
          </div>
        </div>

        <!-- 已加入的班级 -->
        <div class="my-classes">
          <h3 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
            我的班级
          </h3>
          
          <div v-if="myClasses.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <p>还没有加入任何班级</p>
            <p class="sub-text">输入邀请码加入第一个班级吧</p>
          </div>

          <div v-else class="class-list">
            <div v-for="cls in myClasses" :key="cls.id" class="class-card">
              <div class="class-info">
                <h4 class="class-name">{{ cls.name }}</h4>
                <p class="class-course">{{ cls.course_name }}</p>
                <div class="class-meta">
                  <span class="teacher">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {{ cls.teacher_name }}
                  </span>
                  <span class="join-time">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ cls.join_time }}
                  </span>
                </div>
              </div>
              <button class="leave-btn" @click="leaveClass(cls.id)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                退出
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.join-class {
  min-height: 100vh;
  background: #f8fafc;
}

/* 顶部导航 */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: #14b8a6;
}

.logo svg {
  width: 28px;
  height: 28px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0fdfa;
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
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
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
  position: fixed;
  left: 0;
  top: 64px;
  bottom: 0;
  width: 200px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  padding: 16px 12px;
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
  margin-left: 200px;
  padding: 32px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

/* 加入卡片 */
.join-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.join-icon {
  width: 80px;
  height: 80px;
  background: #f0fdfa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: #14b8a6;
}

.join-icon svg {
  width: 40px;
  height: 40px;
}

.join-card h2 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.join-card p {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
}

.input-group {
  display: flex;
  gap: 12px;
  max-width: 400px;
  margin: 0 auto;
}

.input-group input {
  flex: 1;
  padding: 14px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  text-align: center;
  letter-spacing: 4px;
  transition: all 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1);
}

.input-group input::placeholder {
  letter-spacing: normal;
}

.join-btn {
  padding: 14px 28px;
  background: #14b8a6;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.join-btn:hover:not(:disabled) {
  background: #0d9488;
}

.join-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 消息提示 */
.message {
  margin-top: 16px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.message.success {
  background: #f0fdf4;
  color: #22c55e;
}

.message.error {
  background: #fef2f2;
  color: #ef4444;
}

/* 我的班级 */
.my-classes {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
}

.section-title svg {
  width: 22px;
  height: 22px;
  color: #14b8a6;
}

.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: #9ca3af;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
}

.empty-state .sub-text {
  font-size: 12px;
  margin-top: 4px;
}

.class-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.class-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.class-info {
  flex: 1;
}

.class-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.class-course {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.class-meta {
  display: flex;
  gap: 16px;
}

.class-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #9ca3af;
}

.class-meta svg {
  width: 14px;
  height: 14px;
}

.leave-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fef2f2;
  color: #ef4444;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.leave-btn:hover {
  background: #fecaca;
}

.leave-btn svg {
  width: 16px;
  height: 16px;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .main-content {
    margin-left: 0;
  }

  .input-group {
    flex-direction: column;
  }

  .join-btn {
    width: 100%;
  }

  .class-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .leave-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

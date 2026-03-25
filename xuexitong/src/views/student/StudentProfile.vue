<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getToken, logout as storageLogout } from '../../utils/sessionStorage'

const router = useRouter()

const userInfo = ref({
  name: '',
  studentId: '',
  email: '',
  phone: '',
  class: '',
  major: '',
  joinDate: '',
})

const form = reactive({
  name: '',
  email: '',
  phone: '',
  major: '',
})

const isEditing = ref(false)
const isLoading = ref(false)

// 获取学生信息
const fetchProfile = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/student/profile', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        const profile = data.data
        userInfo.value = {
          name: profile.name || '',
          studentId: profile.username || '',
          email: profile.email || '',
          phone: profile.phone || '',
          class: profile.profile?.class_name || '',
          major: profile.profile?.major || '',
          joinDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString('zh-CN') : '',
        }

        // 同步表单数据
        form.name = userInfo.value.name
        form.email = userInfo.value.email
        form.phone = userInfo.value.phone
        form.major = userInfo.value.major
      }
    }
  } catch (error) {
    console.error('获取学生信息失败:', error)
  }
}

const handleSave = async () => {
  isLoading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/student/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(form)
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        userInfo.value = { ...userInfo.value, ...form }
        isEditing.value = false
        alert('保存成功')
      } else {
        alert(data.message || '保存失败')
      }
    } else {
      alert('保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败')
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  form.name = userInfo.value.name
  form.email = userInfo.value.email
  form.phone = userInfo.value.phone
  form.major = userInfo.value.major
  isEditing.value = false
}

const logout = () => {
  storageLogout()
  router.push('/login')
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="student-profile">
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
          <router-link to="/student/profile" class="nav-item active">
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
          <h1>个人中心</h1>
        </div>

        <div class="profile-content">
          <!-- 左侧：头像和基本信息 -->
          <div class="profile-left">
            <div class="avatar-card">
              <div class="avatar-large">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3 class="student-name">{{ userInfo.name }}</h3>
              <p class="student-id">学号：{{ userInfo.studentId }}</p>
              <p class="join-date">加入时间：{{ userInfo.joinDate }}</p>
            </div>

            <div class="info-card">
              <h4>班级信息</h4>
              <div class="info-item">
                <span class="label">所属班级</span>
                <span class="value">{{ userInfo.class || '未分配' }}</span>
              </div>
              <div class="info-item">
                <span class="label">专业</span>
                <span class="value">{{ userInfo.major || '未设置' }}</span>
              </div>
            </div>
          </div>

          <!-- 右侧：编辑表单 -->
          <div class="profile-right">
            <div class="form-card">
              <div class="form-header">
                <h3>个人信息</h3>
                <button v-if="!isEditing" class="edit-btn" @click="isEditing = true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  编辑
                </button>
              </div>

              <div v-if="!isEditing" class="info-display">
                <div class="info-row">
                  <span class="label">姓名</span>
                  <span class="value">{{ userInfo.name }}</span>
                </div>
                <div class="info-row">
                  <span class="label">学号</span>
                  <span class="value">{{ userInfo.studentId }}</span>
                </div>
                <div class="info-row">
                  <span class="label">邮箱</span>
                  <span class="value">{{ userInfo.email || '未设置' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">手机号</span>
                  <span class="value">{{ userInfo.phone || '未设置' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">专业</span>
                  <span class="value">{{ userInfo.major || '未设置' }}</span>
                </div>
              </div>

              <form v-else class="edit-form" @submit.prevent="handleSave">
                <div class="form-group">
                  <label>姓名</label>
                  <input v-model="form.name" type="text" placeholder="请输入姓名" />
                </div>
                <div class="form-group">
                  <label>学号</label>
                  <input :value="userInfo.studentId" type="text" disabled />
                </div>
                <div class="form-group">
                  <label>邮箱</label>
                  <input v-model="form.email" type="email" placeholder="请输入邮箱" />
                </div>
                <div class="form-group">
                  <label>手机号</label>
                  <input v-model="form.phone" type="tel" placeholder="请输入手机号" />
                </div>
                <div class="form-group">
                  <label>专业</label>
                  <input v-model="form.major" type="text" placeholder="请输入专业" />
                </div>
                <div class="form-actions">
                  <button type="button" class="cancel-btn" @click="handleCancel">取消</button>
                  <button type="submit" class="save-btn" :disabled="isLoading">
                    {{ isLoading ? '保存中...' : '保存' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- 修改密码卡片 -->
            <div class="form-card" style="margin-top: 20px;">
              <div class="form-header">
                <h3>账号安全</h3>
              </div>
              <div class="security-item">
                <div class="security-info">
                  <span class="security-title">修改密码</span>
                  <span class="security-desc">定期修改密码可以保护账号安全</span>
                </div>
                <button class="security-btn" @click="router.push('/forgot-password')">修改</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.student-profile {
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

/* 个人资料内容 */
.profile-content {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
}

/* 左侧卡片 */
.profile-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.avatar-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #f0fdfa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #14b8a6;
}

.avatar-large svg {
  width: 48px;
  height: 48px;
}

.student-name {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.student-id {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.join-date {
  font-size: 12px;
  color: #9ca3af;
}

.info-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.info-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  font-size: 14px;
  color: #6b7280;
}

.info-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

/* 右侧表单 */
.profile-right {
  display: flex;
  flex-direction: column;
}

.form-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.form-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f0fdfa;
  color: #14b8a6;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #ccfbf1;
}

.edit-btn svg {
  width: 16px;
  height: 16px;
}

/* 信息展示 */
.info-display {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 10px;
}

.info-row .label {
  font-size: 14px;
  color: #6b7280;
}

.info-row .value {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

/* 编辑表单 */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

.form-group input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.cancel-btn {
  flex: 1;
  padding: 12px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.save-btn {
  flex: 1;
  padding: 12px;
  background: #14b8a6;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #0d9488;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 安全设置 */
.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.security-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.security-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.security-desc {
  font-size: 12px;
  color: #9ca3af;
}

.security-btn {
  padding: 8px 16px;
  background: #f0fdfa;
  color: #14b8a6;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.security-btn:hover {
  background: #ccfbf1;
}

@media (max-width: 1024px) {
  .profile-content {
    grid-template-columns: 1fr;
  }

  .profile-left {
    flex-direction: row;
  }

  .avatar-card {
    flex: 0 0 280px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .main-content {
    margin-left: 0;
  }

  .profile-left {
    flex-direction: column;
  }

  .avatar-card {
    flex: none;
  }
}
</style>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getToken, getCurrentUser, logout as storageLogout } from '../../utils/sessionStorage'

const router = useRouter()

const userInfo = ref({
  name: '',
  teacherId: '',
  department: '',
  title: '',
  email: '',
  phone: '',
  joinDate: '',
})

const form = reactive({
  name: '',
  email: '',
  phone: '',
  department: '',
  title: '',
})

const isEditing = ref(false)
const isLoading = ref(false)

// 获取教师信息
const fetchProfile = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/teacher/profile', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        const profile = data.data
        userInfo.value = {
          name: profile.name || '',
          teacherId: profile.username || '',
          department: profile.profile?.department || '',
          title: profile.profile?.title || '',
          email: profile.email || '',
          phone: profile.phone || '',
          joinDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString('zh-CN') : '',
        }
        
        // 同步表单数据
        form.name = userInfo.value.name
        form.email = userInfo.value.email
        form.phone = userInfo.value.phone
        form.department = userInfo.value.department
        form.title = userInfo.value.title
      }
    }
  } catch (error) {
    console.error('获取教师信息失败:', error)
  }
}

const handleSave = async () => {
  isLoading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/teacher/profile', {
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

const handleChangePassword = () => {
  const oldPassword = prompt('请输入原密码：')
  if (!oldPassword) return
  
  const newPassword = prompt('请输入新密码（至少6位）：')
  if (!newPassword || newPassword.length < 6) {
    alert('密码长度至少6位')
    return
  }
  
  const confirmPassword = prompt('请再次输入新密码：')
  if (newPassword !== confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }
  
  // 这里可以调用修改密码API
  alert('密码修改功能需要后端支持')
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
  <div class="teacher-profile">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>智签 - 教师端</span>
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
          <span class="user-name">{{ userInfo.name || '教师' }}</span>
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
          <router-link to="/teacher" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>今日课程</span>
          </router-link>
          <router-link to="/teacher/class" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span>班级管理</span>
          </router-link>
          <router-link to="/teacher/attendance" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>考勤记录</span>
          </router-link>
          <router-link to="/teacher/profile" class="nav-item active">
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
              <h2 class="user-name-large">{{ userInfo.name || '教师' }}</h2>
              <p class="user-title">{{ userInfo.title || '暂无职称' }}</p>
              <p class="user-department">{{ userInfo.department || '暂无学院信息' }}</p>
              <button class="change-avatar-btn">更换头像</button>
            </div>

            <div class="info-card">
              <h3>账户信息</h3>
              <div class="info-item">
                <span class="label">工号</span>
                <span class="value">{{ userInfo.teacherId || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">入职时间</span>
                <span class="value">{{ userInfo.joinDate || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">账户状态</span>
                <span class="value status-active">正常</span>
              </div>
            </div>
          </div>

          <!-- 右侧：编辑表单 -->
          <div class="profile-right">
            <div class="form-card">
              <div class="form-header">
                <h3>基本信息</h3>
                <button 
                  v-if="!isEditing" 
                  class="edit-btn"
                  @click="isEditing = true"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  编辑
                </button>
              </div>

              <form @submit.prevent="handleSave">
                <div class="form-group">
                  <label>姓名</label>
                  <input 
                    v-model="form.name" 
                    type="text" 
                    :disabled="!isEditing"
                    placeholder="请输入姓名"
                  />
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>邮箱</label>
                    <input 
                      v-model="form.email" 
                      type="email" 
                      :disabled="!isEditing"
                      placeholder="请输入邮箱"
                    />
                  </div>
                  <div class="form-group">
                    <label>手机号</label>
                    <input 
                      v-model="form.phone" 
                      type="tel" 
                      :disabled="!isEditing"
                      placeholder="请输入手机号"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>学院</label>
                    <input 
                      v-model="form.department" 
                      type="text" 
                      :disabled="!isEditing"
                      placeholder="请输入学院"
                    />
                  </div>
                  <div class="form-group">
                    <label>职称</label>
                    <input 
                      v-model="form.title" 
                      type="text" 
                      :disabled="!isEditing"
                      placeholder="请输入职称"
                    />
                  </div>
                </div>

                <div v-if="isEditing" class="form-actions">
                  <button type="button" class="cancel-btn" @click="isEditing = false">
                    取消
                  </button>
                  <button type="submit" class="save-btn" :disabled="isLoading">
                    <span v-if="isLoading" class="btn-loader"></span>
                    <span v-else>保存</span>
                  </button>
                </div>
              </form>
            </div>

            <div class="form-card">
              <h3>安全设置</h3>
              <div class="security-item">
                <div class="security-info">
                  <span class="security-title">登录密码</span>
                  <span class="security-desc">定期修改密码可以保护账户安全</span>
                </div>
                <button class="change-btn" @click="handleChangePassword">
                  修改
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.teacher-profile {
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

/* router-link 样式 */
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

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

/* 个人资料内容 */
.profile-content {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
}

/* 左侧 */
.profile-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.avatar-card {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.avatar-large {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
}

.avatar-large svg {
  width: 50px;
  height: 50px;
}

.user-name-large {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.user-title {
  font-size: 14px;
  color: #14b8a6;
  font-weight: 500;
  margin-bottom: 4px;
}

.user-department {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
}

.change-avatar-btn {
  padding: 8px 20px;
  background: #f0fdfa;
  border: 1px solid #14b8a6;
  border-radius: 8px;
  color: #14b8a6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.change-avatar-btn:hover {
  background: #14b8a6;
  color: white;
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.info-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.status-active {
  color: #10b981;
  background: #d1fae5;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
}

/* 右侧 */
.profile-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  color: #1f2937;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f0fdfa;
  border: 1px solid #14b8a6;
  border-radius: 8px;
  color: #14b8a6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #14b8a6;
  color: white;
}

.edit-btn svg {
  width: 16px;
  height: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #e5e7eb;
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
  background: #f9fafb;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-btn {
  padding: 12px 24px;
  background: #f3f4f6;
  border: none;
  border-radius: 10px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.save-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
}

.save-btn:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.btn-loader {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

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
  font-size: 15px;
  font-weight: 500;
  color: #374151;
}

.security-desc {
  font-size: 13px;
  color: #9ca3af;
}

.change-btn {
  padding: 8px 20px;
  background: #f0fdfa;
  border: 1px solid #14b8a6;
  border-radius: 8px;
  color: #14b8a6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.change-btn:hover {
  background: #14b8a6;
  color: white;
}

/* 响应式 */
@media (max-width: 1024px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .main-content {
    margin-left: 0;
    padding: 16px;
  }

  .header {
    padding: 0 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-btn,
  .save-btn {
    width: 100%;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getToken, getCurrentUser, logout as storageLogout } from '../../utils/sessionStorage'

const router = useRouter()

const userInfo = ref({
  name: '',
  studentId: '',
  class: '',
})

// 筛选条件
const filters = ref({
  course: '',
  status: '',
  dateRange: 'all', // all, week, month
})

// 课程选项
const courseOptions = ref(['全部课程'])

// 考勤记录
const attendanceRecords = ref<any[]>([])
const loading = ref(false)

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 统计
const stats = ref({
  total: 0,
  checked: 0,
  late: 0,
  absent: 0,
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const user = getCurrentUser()
    if (user) {
      userInfo.value.name = user.name || '学生'
      userInfo.value.studentId = user.username || ''
    }

    const response = await fetch('http://localhost:3000/api/student/profile', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        userInfo.value = {
          ...userInfo.value,
          ...data.data,
          studentId: data.data.username
        }
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 获取课程列表
const fetchCourses = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/student/courses', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        courseOptions.value = ['全部课程', ...data.data.map((c: any) => c.name)]
      }
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
  }
}

// 获取考勤记录
const fetchAttendanceRecords = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
      ...(filters.value.course && filters.value.course !== '全部课程' ? { course: filters.value.course } : {}),
      ...(filters.value.status ? { status: filters.value.status } : {}),
      ...(filters.value.dateRange !== 'all' ? { dateRange: filters.value.dateRange } : {}),
    })

    const response = await fetch(`http://localhost:3000/api/student/attendance?${params}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        attendanceRecords.value = data.data.list
        total.value = data.data.total
        stats.value = data.data.stats
      }
    }
  } catch (error) {
    console.error('获取考勤记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 筛选后的记录
const filteredRecords = computed(() => {
  return attendanceRecords.value
})

// 获取状态样式
const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    checked: 'status-checked',
    late: 'status-late',
    absent: 'status-absent',
  }
  return map[status] || ''
}

// 获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    checked: '已签到',
    late: '迟到',
    absent: '缺勤',
  }
  return map[status] || status
}

const logout = () => {
  storageLogout()
  router.push('/login')
}

onMounted(() => {
  fetchUserInfo()
  fetchCourses()
  fetchAttendanceRecords()
})
</script>

<template>
  <div class="attendance-records">
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
          <router-link to="/student/attendance" class="nav-item active">
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
          <h1>考勤记录</h1>
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
              <span class="stat-value">{{ stats.checked }}</span>
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
              <span class="stat-value">{{ stats.late }}</span>
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
              <span class="stat-value">{{ stats.absent }}</span>
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
              <span class="stat-value">{{ stats.total > 0 ? Math.round((stats.checked / stats.total) * 100) : 0 }}%</span>
              <span class="stat-label">出勤率</span>
            </div>
          </div>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <div class="filter-item">
            <label>课程</label>
            <select v-model="filters.course" @change="fetchAttendanceRecords">
              <option v-for="course in courseOptions" :key="course" :value="course">{{ course }}</option>
            </select>
          </div>
          <div class="filter-item">
            <label>状态</label>
            <select v-model="filters.status" @change="fetchAttendanceRecords">
              <option value="">全部状态</option>
              <option value="checked">已签到</option>
              <option value="late">迟到</option>
              <option value="absent">缺勤</option>
            </select>
          </div>
          <div class="filter-item">
            <label>时间范围</label>
            <select v-model="filters.dateRange" @change="fetchAttendanceRecords">
              <option value="all">全部</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
            </select>
          </div>
        </div>

        <!-- 考勤记录表格 -->
        <div class="records-section">
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="filteredRecords.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <p>暂无考勤记录</p>
          </div>
          <table v-else class="records-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>课程</th>
                <th>教师</th>
                <th>时间</th>
                <th>签到时间</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in filteredRecords" :key="record.id">
                <td>{{ record.date }}</td>
                <td>{{ record.course }}</td>
                <td>{{ record.teacher }}</td>
                <td>{{ record.time }}</td>
                <td>{{ record.checkInTime || '-' }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(record.status)">
                    {{ getStatusText(record.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 分页 -->
          <div v-if="total > pageSize" class="pagination">
            <button 
              :disabled="currentPage === 1" 
              @click="currentPage--; fetchAttendanceRecords()"
            >
              上一页
            </button>
            <span>第 {{ currentPage }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页</span>
            <button 
              :disabled="currentPage >= Math.ceil(total / pageSize)" 
              @click="currentPage++; fetchAttendanceRecords()"
            >
              下一页
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.attendance-records {
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

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  background: #eff6ff;
  color: #3b82f6;
}

.stat-icon.yellow {
  background: #fef3c7;
  color: #f59e0b;
}

.stat-icon.red {
  background: #fef2f2;
  color: #ef4444;
}

.stat-icon.green {
  background: #f0fdf4;
  color: #22c55e;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 12px;
  color: #6b7280;
}

.filter-item select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  min-width: 120px;
}

/* 记录区域 */
.records-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
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

/* 表格 */
.records-table {
  width: 100%;
  border-collapse: collapse;
}

.records-table th,
.records-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.records-table th {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  background: #f9fafb;
}

.records-table td {
  font-size: 14px;
  color: #374151;
}

.records-table tr:hover {
  background: #f9fafb;
}

/* 状态标签 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.status-checked {
  background: #f0fdf4;
  color: #22c55e;
}

.status-badge.status-late {
  background: #fef3c7;
  color: #f59e0b;
}

.status-badge.status-absent {
  background: #fef2f2;
  color: #ef4444;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination span {
  font-size: 14px;
  color: #6b7280;
}

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

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-bar {
    flex-direction: column;
  }
}
</style>

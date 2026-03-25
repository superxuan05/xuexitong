<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getToken, getCurrentUser, logout as storageLogout } from '../../utils/sessionStorage'

const router = useRouter()
const loading = ref(false)

const userInfo = ref({
  name: '',
  teacherId: '',
  department: '',
  title: '',
})

// 筛选条件
const filters = ref({
  class: '',
  course: '',
  dateRange: 'week', // week, month, semester
})

// 班级和课程选项
const classOptions = ref(['全部班级'])
const courseOptions = ref(['全部课程'])

// 考勤记录数据
const attendanceRecords = ref<any[]>([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取用户信息
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

// 获取班级列表
const fetchClasses = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/teacher/classes', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        classOptions.value = ['全部班级', ...data.data.map((cls: any) => cls.name)]
      }
    }
  } catch (error) {
    console.error('获取班级列表失败:', error)
  }
}

// 获取课程列表
const fetchCourses = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/teacher/courses', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        courseOptions.value = ['全部课程', ...data.data.map((course: any) => course.name)]
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
      pageSize: pageSize.value.toString()
    })
    
    const response = await fetch(`http://localhost:3000/api/teacher/checkin-records?${params}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        attendanceRecords.value = data.data.list.map((record: any) => ({
          id: record.id,
          date: new Date(record.start_time).toLocaleDateString('zh-CN'),
          course: record.course_name,
          class: record.class_name,
          studentCount: record.total_count || 0,
          checkedCount: record.checked_count || 0,
          lateCount: record.late_count || 0,
          absentCount: (record.total_count || 0) - (record.checked_count || 0) - (record.late_count || 0),
          checkInRate: record.total_count > 0 
            ? Number(((record.checked_count / record.total_count) * 100).toFixed(1)) 
            : 0,
        }))
        total.value = data.data.total
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
  return attendanceRecords.value.filter(record => {
    if (filters.value.class && filters.value.class !== '全部班级' && record.class !== filters.value.class) {
      return false
    }
    if (filters.value.course && filters.value.course !== '全部课程' && record.course !== filters.value.course) {
      return false
    }
    return true
  })
})

// 统计数据
const statistics = computed(() => {
  const records = filteredRecords.value
  const totalClasses = records.length
  const totalStudents = records.reduce((sum, r) => sum + r.studentCount, 0)
  const totalChecked = records.reduce((sum, r) => sum + r.checkedCount, 0)
  const totalLate = records.reduce((sum, r) => sum + r.lateCount, 0)
  const totalAbsent = records.reduce((sum, r) => sum + r.absentCount, 0)
  const avgRate = totalStudents > 0 ? ((totalChecked / totalStudents) * 100).toFixed(1) : '0'

  return {
    totalClasses,
    totalStudents,
    totalChecked,
    totalLate,
    totalAbsent,
    avgRate,
  }
})

// 导出考勤
const exportAttendance = () => {
  // 创建CSV内容
  const headers = ['日期', '课程', '班级', '应到', '实到', '迟到', '缺勤', '出勤率']
  const rows = filteredRecords.value.map(r => [
    r.date,
    r.course,
    r.class,
    r.studentCount,
    r.checkedCount,
    r.lateCount,
    r.absentCount,
    r.checkInRate + '%'
  ])
  
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
  
  // 下载文件
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `考勤记录_${new Date().toLocaleDateString('zh-CN')}.csv`
  link.click()
  
  alert('考勤数据导出成功！')
}

// 查看详情
const viewDetail = async (record: any) => {
  try {
    const response = await fetch(`http://localhost:3000/api/teacher/checkin-records/${record.id}/details`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        const details = data.data.details
        const stats = data.data.stats
        
        // 显示详情弹窗
        const detailText = details.map((d: any) => 
          `${d.student_name} (${d.username}) - ${d.status === 'checked' ? '已签到' : d.status === 'late' ? '迟到' : '缺勤'}`
        ).join('\n')
        
        alert(`签到详情 - ${record.date} ${record.course}\n\n统计: 应到${stats.total}人, 实到${stats.checked}人, 迟到${stats.late}人, 缺勤${stats.absent}人\n\n学生列表:\n${detailText}`)
      }
    }
  } catch (error) {
    console.error('获取签到详情失败:', error)
    alert('获取详情失败')
  }
}

// 分页处理
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchAttendanceRecords()
}

const logout = () => {
  storageLogout()
  router.push('/login')
}

onMounted(() => {
  fetchUserInfo()
  fetchClasses()
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
          <router-link to="/teacher/attendance" class="nav-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>考勤记录</span>
          </router-link>
          <router-link to="/teacher/profile" class="nav-item">
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
          <button class="export-btn" @click="exportAttendance" :disabled="filteredRecords.length === 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            导出考勤
          </button>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <div class="filter-group">
            <label>班级</label>
            <select v-model="filters.class">
              <option v-for="option in classOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label>课程</label>
            <select v-model="filters.course">
              <option v-for="option in courseOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label>时间范围</label>
            <div class="date-range-tabs">
              <button 
                :class="{ active: filters.dateRange === 'week' }"
                @click="filters.dateRange = 'week'"
              >
                本周
              </button>
              <button 
                :class="{ active: filters.dateRange === 'month' }"
                @click="filters.dateRange = 'month'"
              >
                本月
              </button>
              <button 
                :class="{ active: filters.dateRange === 'semester' }"
                @click="filters.dateRange = 'semester'"
              >
                本学期
              </button>
            </div>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ statistics.totalClasses }}</span>
              <span class="stat-label">考勤次数</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ statistics.totalChecked }}</span>
              <span class="stat-label">实到人次</span>
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
              <span class="stat-value">{{ statistics.totalLate }}</span>
              <span class="stat-label">迟到人次</span>
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
              <span class="stat-value">{{ statistics.totalAbsent }}</span>
              <span class="stat-label">缺勤人次</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ statistics.avgRate }}%</span>
              <span class="stat-label">平均出勤率</span>
            </div>
          </div>
        </div>

        <!-- 考勤记录表格 -->
        <div class="records-section">
          <h2 class="section-title">考勤明细</h2>
          <div class="table-wrapper" v-loading="loading">
            <table class="records-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>课程</th>
                  <th>班级</th>
                  <th>应到</th>
                  <th>实到</th>
                  <th>迟到</th>
                  <th>缺勤</th>
                  <th>出勤率</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in filteredRecords" :key="record.id">
                  <td>{{ record.date }}</td>
                  <td>{{ record.course }}</td>
                  <td>{{ record.class }}</td>
                  <td>{{ record.studentCount }}</td>
                  <td class="text-green">{{ record.checkedCount }}</td>
                  <td class="text-yellow">{{ record.lateCount }}</td>
                  <td class="text-red">{{ record.absentCount }}</td>
                  <td>
                    <div class="rate-cell">
                      <div class="rate-bar">
                        <div 
                          class="rate-fill" 
                          :style="{ width: record.checkInRate + '%' }"
                          :class="{ 
                            high: record.checkInRate >= 95, 
                            medium: record.checkInRate >= 85 && record.checkInRate < 95,
                            low: record.checkInRate < 85 
                          }"
                        ></div>
                      </div>
                      <span class="rate-value">{{ record.checkInRate }}%</span>
                    </div>
                  </td>
                  <td>
                    <button class="detail-btn" @click="viewDetail(record)">查看详情</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredRecords.length === 0" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <p>暂无考勤记录</p>
            </div>
          </div>
          
          <!-- 分页 -->
          <div class="pagination" v-if="total > 0">
            <button 
              class="page-btn" 
              :disabled="currentPage === 1"
              @click="handlePageChange(currentPage - 1)"
            >
              上一页
            </button>
            <span class="page-info">第 {{ currentPage }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页</span>
            <button 
              class="page-btn" 
              :disabled="currentPage >= Math.ceil(total / pageSize)"
              @click="handlePageChange(currentPage + 1)"
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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.attendance-records {
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

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
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

.export-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
}

.export-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.export-btn svg {
  width: 18px;
  height: 18px;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.filter-group select {
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  min-width: 160px;
  cursor: pointer;
}

.date-range-tabs {
  display: flex;
  gap: 8px;
}

.date-range-tabs button {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.date-range-tabs button:hover {
  border-color: #14b8a6;
  color: #14b8a6;
}

.date-range-tabs button.active {
  background: #f0fdfa;
  border-color: #14b8a6;
  color: #14b8a6;
  font-weight: 500;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  background: #eff6ff;
  color: #3b82f6;
}

.stat-icon.green {
  background: #f0fdf4;
  color: #22c55e;
}

.stat-icon.yellow {
  background: #fefce8;
  color: #eab308;
}

.stat-icon.red {
  background: #fef2f2;
  color: #ef4444;
}

.stat-icon.purple {
  background: #faf5ff;
  color: #a855f7;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
}

/* 考勤记录 */
.records-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
}

.table-wrapper {
  overflow-x: auto;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
}

.records-table th,
.records-table td {
  padding: 14px 16px;
  text-align: left;
  font-size: 14px;
}

.records-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.records-table td {
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
}

.records-table tr:hover td {
  background: #f9fafb;
}

.text-green {
  color: #22c55e;
  font-weight: 500;
}

.text-yellow {
  color: #eab308;
  font-weight: 500;
}

.text-red {
  color: #ef4444;
  font-weight: 500;
}

.rate-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rate-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.rate-fill.high {
  background: #22c55e;
}

.rate-fill.medium {
  background: #eab308;
}

.rate-fill.low {
  background: #ef4444;
}

.rate-value {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  min-width: 45px;
}

.detail-btn {
  padding: 6px 14px;
  background: #f0fdfa;
  border: 1px solid #14b8a6;
  border-radius: 6px;
  color: #14b8a6;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-btn:hover {
  background: #14b8a6;
  color: white;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  font-size: 15px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #14b8a6;
  color: #14b8a6;
}

.page-btn:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6b7280;
}

/* 响应式 */
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .main-content {
    margin-left: 0;
    padding: 20px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-bar {
    flex-direction: column;
  }
}
</style>

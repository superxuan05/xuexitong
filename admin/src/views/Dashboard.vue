<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in statistics" :key="item.title">
        <el-card class="stat-card">
          <div class="stat-icon" :style="{ background: item.color }">
            <el-icon size="24" color="#fff">
              <component :is="item.icon" />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value">{{ item.value }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近注册用户</span>
          </template>
          <el-table :data="recentUsers" style="width: 100%">
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="role" label="角色">
              <template #default="{ row }">
                <el-tag :type="row.role === 'teacher' ? 'success' : 'primary'">
                  {{ row.role === 'teacher' ? '教师' : '学生' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="注册时间" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近签到记录</span>
          </template>
          <el-table :data="recentCheckIns" style="width: 100%">
            <el-table-column prop="course_name" label="课程" />
            <el-table-column prop="student_name" label="学生" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statistics = ref([
  { title: '总用户数', value: 0, icon: 'User', color: '#409EFF' },
  { title: '教师数', value: 0, icon: 'UserFilled', color: '#67C23A' },
  { title: '学生数', value: 0, icon: 'User', color: '#E6A23C' },
  { title: '班级数', value: 0, icon: 'School', color: '#F56C6C' }
])

const recentUsers = ref([])
const recentCheckIns = ref([])

const getStatusType = (status) => {
  const map = { checked: 'success', late: 'warning', absent: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { checked: '已签到', late: '迟到', absent: '缺勤' }
  return map[status] || status
}

const fetchData = async () => {
  try {
    // 获取统计数据
    const response = await fetch('http://localhost:3000/api/admin/statistics')
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        statistics.value[0].value = data.data.totalUsers
        statistics.value[1].value = data.data.teacherCount
        statistics.value[2].value = data.data.studentCount
        statistics.value[3].value = data.data.classCount
      }
    }

    // 获取最近用户
    const usersResponse = await fetch('http://localhost:3000/api/admin/recent-users')
    if (usersResponse.ok) {
      const data = await usersResponse.json()
      if (data.success) {
        recentUsers.value = data.data
      }
    }
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.stat-info {
  flex: 1;
}

.stat-title {
  color: #909399;
  font-size: 14px;
  margin-bottom: 5px;
}

.stat-value {
  color: #303133;
  font-size: 24px;
  font-weight: bold;
}
</style>
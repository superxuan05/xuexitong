<template>
  <div class="checkin-records">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>签到记录</span>
          <div>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="margin-right: 10px"
            />
            <el-button type="primary" @click="fetchRecords">查询</el-button>
          </div>
        </div>
      </template>

      <el-table :data="records" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="course_name" label="课程" />
        <el-table-column prop="teacher_name" label="教师" />
        <el-table-column prop="check_in_code" label="签到码" />
        <el-table-column prop="start_time" label="开始时间" />
        <el-table-column prop="end_time" label="结束时间" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetails(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
        @current-change="fetchRecords"
      />
    </el-card>

    <!-- 签到详情对话框 -->
    <el-dialog v-model="showDetailsDialog" title="签到详情" width="700px">
      <div class="stats-row">
        <el-statistic title="总人数" :value="stats.total" />
        <el-statistic title="已签到" :value="stats.checked" />
        <el-statistic title="迟到" :value="stats.late" />
        <el-statistic title="缺勤" :value="stats.absent" />
      </div>
      <el-table :data="details" style="width: 100%; margin-top: 20px">
        <el-table-column prop="student_name" label="学生姓名" />
        <el-table-column prop="check_in_time" label="签到时间" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const records = ref([])
const details = ref([])
const stats = ref({ total: 0, checked: 0, late: 0, absent: 0 })
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dateRange = ref(null)
const showDetailsDialog = ref(false)

const getStatusType = (status) => {
  const map = { ongoing: 'primary', completed: 'success', cancelled: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { ongoing: '进行中', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const fetchRecords = async () => {
  loading.value = true
  try {
    let url = `http://localhost:3000/api/admin/checkin-records?page=${page.value}&pageSize=${pageSize.value}`
    if (dateRange.value && dateRange.value.length === 2) {
      url += `&startDate=${dateRange.value[0].toISOString()}&endDate=${dateRange.value[1].toISOString()}`
    }
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        records.value = data.data.list
        total.value = data.data.total
      }
    }
  } catch (error) {
    console.error('获取记录失败:', error)
  } finally {
    loading.value = false
  }
}

const viewDetails = async (row) => {
  try {
    const response = await fetch(`http://localhost:3000/api/admin/checkin-records/${row.id}/details`)
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        details.value = data.data.details
        stats.value = data.data.stats
        showDetailsDialog.value = true
      }
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}
</style>
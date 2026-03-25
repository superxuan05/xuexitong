<template>
  <div class="classes">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>班级管理</span>
          <el-button type="primary" @click="showAddDialog = true">添加班级</el-button>
        </div>
      </template>

      <el-table :data="classes" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="班级名称" />
        <el-table-column prop="course_name" label="课程名称" />
        <el-table-column prop="teacher_name" label="教师" />
        <el-table-column prop="student_count" label="学生人数" />
        <el-table-column prop="invite_code" label="邀请码" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewStudents(row)">查看学生</el-button>
            <el-button type="danger" size="small" @click="deleteClass(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加班级对话框 -->
    <el-dialog v-model="showAddDialog" title="添加班级" width="500px">
      <el-form :model="classForm" label-width="100px">
        <el-form-item label="班级名称">
          <el-input v-model="classForm.name" />
        </el-form-item>
        <el-form-item label="课程名称">
          <el-input v-model="classForm.course_name" />
        </el-form-item>
        <el-form-item label="教师">
          <el-select v-model="classForm.teacher_id" style="width: 100%">
            <el-option
              v-for="teacher in teachers"
              :key="teacher.id"
              :label="teacher.name"
              :value="teacher.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邀请码">
          <el-input v-model="classForm.invite_code" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveClass">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看学生对话框 -->
    <el-dialog v-model="showStudentsDialog" title="班级学生" width="600px">
      <el-table :data="students" style="width: 100%">
        <el-table-column prop="student_id" label="学号" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="join_time" label="加入时间" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const classes = ref([])
const teachers = ref([])
const students = ref([])
const loading = ref(false)
const showAddDialog = ref(false)
const showStudentsDialog = ref(false)

const classForm = ref({
  name: '',
  course_name: '',
  teacher_id: '',
  invite_code: ''
})

const fetchClasses = async () => {
  loading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/admin/classes')
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        classes.value = data.data
      }
    }
  } catch (error) {
    console.error('获取班级失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchTeachers = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/admin/teachers')
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        teachers.value = data.data
      }
    }
  } catch (error) {
    console.error('获取教师失败:', error)
  }
}

const saveClass = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/admin/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classForm.value)
    })
    if (response.ok) {
      ElMessage.success('添加成功')
      showAddDialog.value = false
      fetchClasses()
    }
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const viewStudents = async (row) => {
  try {
    const response = await fetch(`http://localhost:3000/api/admin/classes/${row.id}/students`)
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        students.value = data.data
        showStudentsDialog.value = true
      }
    }
  } catch (error) {
    ElMessage.error('获取学生列表失败')
  }
}

const deleteClass = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该班级吗？', '提示', { type: 'warning' })
    const response = await fetch(`http://localhost:3000/api/admin/classes/${row.id}`, {
      method: 'DELETE'
    })
    if (response.ok) {
      ElMessage.success('删除成功')
      fetchClasses()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchClasses()
  fetchTeachers()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
<template>
  <div class="courses">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>课程管理</span>
          <el-button type="primary" @click="showAddDialog = true">添加课程</el-button>
        </div>
      </template>

      <el-table :data="courses" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="课程名称" />
        <el-table-column prop="teacher_name" label="教师" />
        <el-table-column prop="class_name" label="班级" />
        <el-table-column prop="classroom" label="教室" />
        <el-table-column prop="schedule" label="上课时间" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editCourse(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteCourse(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑课程对话框 -->
    <el-dialog v-model="showAddDialog" title="添加课程" width="500px">
      <el-form :model="courseForm" label-width="100px">
        <el-form-item label="课程名称">
          <el-input v-model="courseForm.name" />
        </el-form-item>
        <el-form-item label="教师">
          <el-select v-model="courseForm.teacher_id" style="width: 100%">
            <el-option
              v-for="teacher in teachers"
              :key="teacher.id"
              :label="teacher.name"
              :value="teacher.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="班级">
          <el-select v-model="courseForm.class_id" style="width: 100%">
            <el-option
              v-for="cls in classes"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="教室">
          <el-input v-model="courseForm.classroom" />
        </el-form-item>
        <el-form-item label="上课时间">
          <el-input v-model="courseForm.schedule" placeholder="如：周一 08:00-09:40" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCourse">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const courses = ref([])
const teachers = ref([])
const classes = ref([])
const loading = ref(false)
const showAddDialog = ref(false)

const courseForm = ref({
  name: '',
  teacher_id: '',
  class_id: '',
  classroom: '',
  schedule: ''
})

const fetchCourses = async () => {
  loading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/admin/courses')
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        courses.value = data.data
      }
    }
  } catch (error) {
    console.error('获取课程失败:', error)
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

const fetchClasses = async () => {
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
  }
}

const saveCourse = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseForm.value)
    })
    if (response.ok) {
      ElMessage.success('添加成功')
      showAddDialog.value = false
      fetchCourses()
    }
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const editCourse = (row) => {
  courseForm.value = { ...row }
  showAddDialog.value = true
}

const deleteCourse = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该课程吗？', '提示', { type: 'warning' })
    const response = await fetch(`http://localhost:3000/api/admin/courses/${row.id}`, {
      method: 'DELETE'
    })
    if (response.ok) {
      ElMessage.success('删除成功')
      fetchCourses()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchCourses()
  fetchTeachers()
  fetchClasses()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
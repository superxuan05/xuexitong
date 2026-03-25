<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getToken, getCurrentUser, logout as storageLogout } from '../../utils/sessionStorage'

const router = useRouter()
const loading = ref(false)
const userInfo = ref({
  name: '李老师',
  teacherId: 'T2021001',
  department: '计算机学院',
  title: '副教授',
})

// 班级列表
const classes = ref<any[]>([])

// 当前选中的班级
const selectedClass = ref<any>(null)

// 学生列表
const students = ref<any[]>([])

// 搜索关键词
const searchKeyword = ref('')

// 筛选后的学生列表
const filteredStudents = computed(() => {
  if (!searchKeyword.value) return students.value
  return students.value.filter(s =>
    s.name?.includes(searchKeyword.value) ||
    s.student_id?.includes(searchKeyword.value)
  )
})

// 弹窗控制
const showAddStudentModal = ref(false)
const showBatchAddModal = ref(false)
const showCreateClassModal = ref(false)
const showInviteCodeModal = ref(false)
const inviteCodeToShow = ref('')

// 添加学生表单
const addStudentForm = ref({
  studentId: '',
  name: '',
  phone: '',
})

// 批量添加
const batchStudentIds = ref('')

// 创建班级表单
const createClassForm = ref({
  name: '',
  courseName: '',
  weekDay: 1,
  startTime: '08:00',
  endTime: '09:40',
  classroom: '',
})

// 编辑课程弹窗
const showEditCourseModal = ref(false)
const editingCourse = ref<any>(null)
const editCourseForm = ref({
  id: null as number | null,
  name: '',
  weekDay: 1,
  startTime: '08:00',
  endTime: '09:40',
  classroom: '',
})

// 签到设置弹窗
const showCheckInSettingsModal = ref(false)
const checkInSettings = ref({
  allowLate: true,
  lateMinutes: 15,
  allowMakeup: false,
  makeupHours: 24,
})

// 获取班级列表
const fetchClasses = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/teacher/classes', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        classes.value = data.data.map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          courseName: cls.course_name,
          studentCount: cls.actual_count || 0,
          inviteCode: cls.invite_code,
          createdAt: new Date(cls.created_at).toLocaleDateString('zh-CN')
        }))
      }
    }
  } catch (error) {
    console.error('获取班级列表失败:', error)
  }
}

// 获取班级学生
const fetchStudents = async (classId: number) => {
  try {
    const response = await fetch(`http://localhost:3000/api/teacher/classes/${classId}/students`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        students.value = data.data.map((s: any) => ({
          id: s.student_id || s.id,
          userId: s.id,
          name: s.name,
          phone: s.phone || '未填写',
          joinTime: new Date(s.join_time).toLocaleDateString('zh-CN'),
          status: s.status
        }))
      }
    }
  } catch (error) {
    console.error('获取学生列表失败:', error)
  }
}

// 选择班级
const selectClass = (cls: any) => {
  selectedClass.value = cls
  fetchStudents(cls.id)
}

// 打开添加学生弹窗
const openAddStudentModal = () => {
  if (!selectedClass.value) {
    alert('请先选择一个班级')
    return
  }
  addStudentForm.value = { studentId: '', name: '', phone: '' }
  showAddStudentModal.value = true
}

// 提交添加学生
const submitAddStudent = () => {
  if (!addStudentForm.value.studentId || !addStudentForm.value.name) {
    alert('请填写完整信息')
    return
  }

  // 这里应该调用后端API添加学生
  alert('添加学生功能需要通过邀请码让学生自行加入')
  showAddStudentModal.value = false
}

// 打开批量添加弹窗
const openBatchAddModal = () => {
  if (!selectedClass.value) {
    alert('请先选择一个班级')
    return
  }
  batchStudentIds.value = ''
  showBatchAddModal.value = true
}

// 提交批量添加
const submitBatchAdd = () => {
  if (!batchStudentIds.value.trim()) {
    alert('请输入学号')
    return
  }
  alert('批量添加功能需要通过邀请码让学生自行加入')
  showBatchAddModal.value = false
}

// 删除学生
const removeStudent = async (student: any) => {
  if (!confirm(`确定要移除学生 ${student.name} 吗？`)) return

  try {
    const response = await fetch(
      `http://localhost:3000/api/teacher/classes/${selectedClass.value.id}/students/${student.userId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      }
    )

    if (response.ok) {
      students.value = students.value.filter(s => s.userId !== student.userId)
      selectedClass.value.studentCount--
      alert('移除成功')
    }
  } catch (error) {
    console.error('移除学生失败:', error)
    alert('移除失败')
  }
}

// 创建班级
const submitCreateClass = async () => {
  if (!createClassForm.value.name || !createClassForm.value.courseName) {
    alert('请填写完整信息')
    return
  }

  try {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const response = await fetch('http://localhost:3000/api/teacher/classes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        name: createClassForm.value.name,
        course_name: createClassForm.value.courseName,
        invite_code: inviteCode,
        week_day: createClassForm.value.weekDay,
        start_time: createClassForm.value.startTime,
        end_time: createClassForm.value.endTime,
        classroom: createClassForm.value.classroom
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        showCreateClassModal.value = false
        createClassForm.value = { name: '', courseName: '', weekDay: 1, startTime: '08:00', endTime: '09:40', classroom: '' }
        alert(`创建成功！\n班级邀请码：${inviteCode}`)
        fetchClasses()
      }
    }
  } catch (error) {
    console.error('创建班级失败:', error)
    alert('创建失败')
  }
}

// 复制文本到剪贴板（兼容性处理）
const copyToClipboard = async (text: string): Promise<boolean> => {
  // 方法1: 使用现代的 Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.log('Clipboard API 失败，尝试备用方法')
    }
  }
  
  // 方法2: 使用传统的 execCommand 方法
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  
  try {
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error('execCommand 复制失败:', err)
    document.body.removeChild(textArea)
    return false
  }
}

// 显示邀请码弹窗
const generateInviteCode = () => {
  if (!selectedClass.value) {
    alert('请先选择一个班级')
    return
  }
  inviteCodeToShow.value = selectedClass.value.inviteCode
  showInviteCodeModal.value = true
}

// 编辑课程
const editCourse = (course: any) => {
  editingCourse.value = course
  editCourseForm.value = {
    id: course.id,
    name: course.name,
    weekDay: course.weekDay || 1,
    startTime: course.startTime || '08:00',
    endTime: course.endTime || '09:40',
    classroom: course.classroom || '',
  }
  showEditCourseModal.value = true
}

// 提交编辑课程
const submitEditCourse = async () => {
  if (!editCourseForm.value.name) {
    alert('请填写课程名称')
    return
  }

  try {
    const response = await fetch(`http://localhost:3000/api/teacher/courses/${editCourseForm.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        name: editCourseForm.value.name,
        week_day: editCourseForm.value.weekDay,
        start_time: editCourseForm.value.startTime,
        end_time: editCourseForm.value.endTime,
        classroom: editCourseForm.value.classroom
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        showEditCourseModal.value = false
        alert('课程更新成功')
        fetchClasses()
      }
    }
  } catch (error) {
    console.error('更新课程失败:', error)
    alert('更新失败')
  }
}

// 打开签到设置
const openCheckInSettings = () => {
  if (!selectedClass.value) {
    alert('请先选择一个班级')
    return
  }
  showCheckInSettingsModal.value = true
}

// 保存签到设置
const saveCheckInSettings = async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/teacher/classes/${selectedClass.value.id}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        allow_late: checkInSettings.value.allowLate,
        late_minutes: checkInSettings.value.lateMinutes,
        allow_makeup: checkInSettings.value.allowMakeup,
        makeup_hours: checkInSettings.value.makeupHours
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        showCheckInSettingsModal.value = false
        alert('设置保存成功')
      }
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    alert('保存失败')
  }
}

// 复制邀请码
const copyInviteCode = async () => {
  const code = inviteCodeToShow.value
  
  // 尝试多种复制方法
  // 方法1: Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(code)
      alert('邀请码已复制到剪贴板！')
      return
    } catch (err) {
      console.log('Clipboard API 失败')
    }
  }
  
  // 方法2: 使用 range 和 selection
  try {
    const codeElement = document.getElementById('invite-code-text')
    if (codeElement) {
      const range = document.createRange()
      range.selectNode(codeElement)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
        document.execCommand('copy')
        selection.removeAllRanges()
        alert('邀请码已复制到剪贴板！')
        return
      }
    }
  } catch (err) {
    console.error('Range 复制失败:', err)
  }
  
  // 方法3: 传统 textarea 方法
  try {
    const textArea = document.createElement('textarea')
    textArea.value = code
    textArea.style.cssText = 'position:fixed;left:-9999px;top:0;'
    document.body.appendChild(textArea)
    textArea.select()
    const result = document.execCommand('copy')
    document.body.removeChild(textArea)
    if (result) {
      alert('邀请码已复制到剪贴板！')
      return
    }
  } catch (err) {
    console.error('Textarea 复制失败:', err)
  }
  
  // 所有方法都失败
  alert('自动复制失败，请手动选中并复制邀请码')
}

const logout = () => {
  storageLogout()
  router.push('/login')
}

onMounted(() => {
  fetchClasses()
})
</script>

<template>
  <div class="class-management">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>智签 - 教师端</span>
        </div>
      </div>
      <div class="header-right">
        <div class="user-info">
          <div class="avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span class="user-name">{{ userInfo.name }}</span>
        </div>
        <button class="logout-btn" @click="logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
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
          <router-link to="/teacher/class" class="nav-item active">
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
          <h1>班级管理</h1>
          <button class="create-class-btn" @click="showCreateClassModal = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            创建班级
          </button>
        </div>

        <div class="content-layout">
          <!-- 班级列表 -->
          <div class="class-list-section">
            <h2 class="section-title">我的班级</h2>
            <div v-if="classes.length === 0" class="empty-state">
              <p>暂无班级，点击创建班级</p>
            </div>
            <div v-else class="class-list">
              <div v-for="cls in classes" :key="cls.id" class="class-card"
                :class="{ active: selectedClass?.id === cls.id }" @click="selectClass(cls)">
                <div class="class-info">
                  <h3 class="class-name">{{ cls.name }}</h3>
                  <p class="class-course">{{ cls.courseName }}</p>
                  <div class="class-meta">
                    <span class="student-count">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                      {{ cls.studentCount }}人
                    </span>
                    <span class="create-time">创建于 {{ cls.createdAt }}</span>
                  </div>
                </div>
                <button class="edit-btn" @click.stop="editCourse(cls)" title="编辑课程">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 学生列表 -->
          <div class="student-list-section">
            <div class="student-list-header">
              <h2 class="section-title">
                {{ selectedClass ? selectedClass.name + ' - 学生列表' : '请选择班级' }}
              </h2>
              <div v-if="selectedClass" class="header-actions">
                <div class="search-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input v-model="searchKeyword" type="text" placeholder="搜索学号或姓名" />
                </div>
                <button class="action-btn invite" @click="generateInviteCode">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                  邀请码
                </button>
              </div>
            </div>

            <div v-if="selectedClass" class="student-table-wrapper">
              <table class="student-table">
                <thead>
                  <tr>
                    <th>学号</th>
                    <th>姓名</th>
                    <th>手机号</th>
                    <th>加入时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in filteredStudents" :key="student.userId">
                    <td>{{ student.id }}</td>
                    <td>{{ student.name }}</td>
                    <td>{{ student.phone }}</td>
                    <td>{{ student.joinTime }}</td>
                    <td>
                      <span class="status-badge" :class="student.status">
                        {{ student.status === 'active' ? '正常' : '已停用' }}
                      </span>
                    </td>
                    <td>
                      <button class="delete-btn" @click="removeStudent(student)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="filteredStudents.length === 0" class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
                <p>暂无学生，分享邀请码让学生加入</p>
              </div>
            </div>

            <div v-else class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <p>请从左侧选择一个班级</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 创建班级弹窗 -->
    <div v-if="showCreateClassModal" class="modal-overlay" @click.self="showCreateClassModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>创建班级</h3>
          <button class="close-btn" @click="showCreateClassModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>班级名称 <span class="required">*</span></label>
            <input v-model="createClassForm.name" type="text" placeholder="例如：计算机科学与技术2101班" />
          </div>
          <div class="form-group">
            <label>课程名称 <span class="required">*</span></label>
            <input v-model="createClassForm.courseName" type="text" placeholder="例如：数据结构与算法" />
          </div>
          <div class="form-group">
            <label>教室</label>
            <input v-model="createClassForm.classroom" type="text" placeholder="例如：A101" />
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>星期 <span class="required">*</span></label>
              <select v-model="createClassForm.weekDay">
                <option :value="1">星期一</option>
                <option :value="2">星期二</option>
                <option :value="3">星期三</option>
                <option :value="4">星期四</option>
                <option :value="5">星期五</option>
                <option :value="6">星期六</option>
                <option :value="7">星期日</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>开始时间 <span class="required">*</span></label>
              <input v-model="createClassForm.startTime" type="time" />
            </div>
            <div class="form-group half">
              <label>结束时间 <span class="required">*</span></label>
              <input v-model="createClassForm.endTime" type="time" />
            </div>
          </div>
          <button class="submit-btn" @click="submitCreateClass">创建班级</button>
        </div>
      </div>
    </div>

    <!-- 邀请码弹窗 -->
    <div v-if="showInviteCodeModal" class="modal-overlay" @click.self="showInviteCodeModal = false">
      <div class="modal-content invite-modal">
        <div class="modal-header">
          <h3>班级邀请码</h3>
          <button class="close-btn" @click="showInviteCodeModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="invite-desc">将邀请码分享给学生，学生可在加入课堂页面输入此码加入班级</p>
          <div class="invite-code-display">
            <span id="invite-code-text" class="code-text">{{ inviteCodeToShow }}</span>
          </div>
          <button class="submit-btn copy-btn" @click="copyInviteCode">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            复制邀请码
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑课程弹窗 -->
    <div v-if="showEditCourseModal" class="modal-overlay" @click.self="showEditCourseModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑课程</h3>
          <button class="close-btn" @click="showEditCourseModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>课程名称 <span class="required">*</span></label>
            <input v-model="editCourseForm.name" type="text" placeholder="例如：数据结构与算法" />
          </div>
          <div class="form-group">
            <label>教室</label>
            <input v-model="editCourseForm.classroom" type="text" placeholder="例如：A101" />
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>星期 <span class="required">*</span></label>
              <select v-model="editCourseForm.weekDay">
                <option :value="1">星期一</option>
                <option :value="2">星期二</option>
                <option :value="3">星期三</option>
                <option :value="4">星期四</option>
                <option :value="5">星期五</option>
                <option :value="6">星期六</option>
                <option :value="7">星期日</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>开始时间 <span class="required">*</span></label>
              <input v-model="editCourseForm.startTime" type="time" />
            </div>
            <div class="form-group half">
              <label>结束时间 <span class="required">*</span></label>
              <input v-model="editCourseForm.endTime" type="time" />
            </div>
          </div>
          <button class="submit-btn" @click="submitEditCourse">保存修改</button>
        </div>
      </div>
    </div>

    <!-- 签到设置弹窗 -->
    <div v-if="showCheckInSettingsModal" class="modal-overlay" @click.self="showCheckInSettingsModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>签到设置</h3>
          <button class="close-btn" @click="showCheckInSettingsModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="checkInSettings.allowLate" type="checkbox" />
              <span>允许迟到签到</span>
            </label>
          </div>
          <div v-if="checkInSettings.allowLate" class="form-group">
            <label>迟到时间限制（分钟）</label>
            <input v-model.number="checkInSettings.lateMinutes" type="number" min="1" max="60" />
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="checkInSettings.allowMakeup" type="checkbox" />
              <span>允许补签</span>
            </label>
          </div>
          <div v-if="checkInSettings.allowMakeup" class="form-group">
            <label>补签时间限制（小时）</label>
            <input v-model.number="checkInSettings.makeupHours" type="number" min="1" max="72" />
          </div>
          <button class="submit-btn" @click="saveCheckInSettings">保存设置</button>
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

.class-management {
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

/* router-link 样式 */
a.nav-item {
  color: #6b7280;
  text-decoration: none;
}

a.nav-item:hover {
  background: #f3f4f6;
  color: #374151;
}

a.nav-item.active {
  background: #f0fdfa;
  color: #14b8a6;
  font-weight: 500;
}

.nav-item svg {
  width: 20px;
  height: 20px;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-item.active {
  background: #f0fdfa;
  color: #14b8a6;
  font-weight: 500;
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

.create-class-btn {
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

.create-class-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
}

.create-class-btn svg {
  width: 18px;
  height: 18px;
}

/* 内容布局 */
.content-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
}

/* 班级列表区域 */
.class-list-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.class-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.class-card {
  padding: 16px;
  border-radius: 12px;
  border: 1.5px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.class-card:hover {
  border-color: #14b8a6;
}

.class-card:hover .edit-btn {
  opacity: 1;
}

.class-card.active {
  border-color: #14b8a6;
  background: #f0fdfa;
}

.class-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.class-course {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.class-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #9ca3af;
}

.student-count {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #14b8a6;
  font-weight: 500;
}

.student-count svg {
  width: 14px;
  height: 14px;
}

.edit-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: #f3f4f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #14b8a6;
  color: white;
}

.edit-btn svg {
  width: 14px;
  height: 14px;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #14b8a6;
}

/* 学生列表区域 */
.student-list-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.student-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

.search-box input {
  padding: 8px 12px 8px 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  width: 200px;
}

.search-box input:focus {
  outline: none;
  border-color: #14b8a6;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.action-btn.invite {
  background: #dbeafe;
  color: #3b82f6;
}

.action-btn.invite:hover {
  background: #bfdbfe;
}

.action-btn.batch {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.batch:hover {
  background: #e5e7eb;
}

.action-btn.primary {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* 学生表格 */
.student-table-wrapper {
  overflow-x: auto;
}

.student-table {
  width: 100%;
  border-collapse: collapse;
}

.student-table th,
.student-table td {
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
}

.student-table th {
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.student-table td {
  color: #4b5563;
  border-bottom: 1px solid #f3f4f6;
}

.student-table tr:hover td {
  background: #f9fafb;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #d1fae5;
  color: #059669;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #dc2626;
}

.delete-btn {
  width: 32px;
  height: 32px;
  background: #fee2e2;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ef4444;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #fecaca;
}

.delete-btn svg {
  width: 16px;
  height: 16px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-state svg {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-group .required {
  color: #ef4444;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #14b8a6;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group .hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 6px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(20, 184, 166, 0.35);
}

/* 响应式 */
@media (max-width: 1024px) {
  .content-layout {
    grid-template-columns: 1fr;
  }

  .class-list-section {
    max-height: 300px;
    overflow-y: auto;
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

  .student-list-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-box input {
    width: 100%;
  }
}
</style>
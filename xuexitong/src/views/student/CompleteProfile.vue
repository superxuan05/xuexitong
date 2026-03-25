<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive({
  studentId: '',
  name: '',
  phone: '',
  class: '',
  department: '',
})

const errors = reactive({
  studentId: '',
  name: '',
  phone: '',
  class: '',
  department: '',
})

const isLoading = ref(false)
const isSuccess = ref(false)

const validateForm = () => {
  let isValid = true
  errors.studentId = ''
  errors.name = ''
  errors.phone = ''
  errors.class = ''
  errors.department = ''

  if (!form.studentId.trim()) {
    errors.studentId = '请输入学号'
    isValid = false
  }

  if (!form.name.trim()) {
    errors.name = '请输入姓名'
    isValid = false
  }

  if (!form.phone.trim()) {
    errors.phone = '请输入手机号'
    isValid = false
  } else {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(form.phone)) {
      errors.phone = '请输入有效的手机号'
      isValid = false
    }
  }

  if (!form.class.trim()) {
    errors.class = '请输入班级'
    isValid = false
  }

  if (!form.department.trim()) {
    errors.department = '请输入学院'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    isSuccess.value = true
    
    setTimeout(() => {
      router.push('/student')
    }, 2000)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="complete-profile-page">
    <div class="background-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="container">
      <div class="card">
        <div class="card-header">
          <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>智签</span>
          </div>
          <h1>完善个人信息</h1>
          <p class="subtitle">首次登录，请完善您的个人信息</p>
        </div>

        <div v-if="!isSuccess" class="form-container">
          <form @submit.prevent="handleSubmit">
            <div class="form-row">
              <div class="form-group">
                <label>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                  </svg>
                  学号
                </label>
                <input
                  v-model="form.studentId"
                  type="text"
                  placeholder="请输入学号"
                  :class="{ error: errors.studentId }"
                />
                <span v-if="errors.studentId" class="error-message">{{ errors.studentId }}</span>
              </div>

              <div class="form-group">
                <label>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  姓名
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="请输入姓名"
                  :class="{ error: errors.name }"
                />
                <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  手机号
                </label>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="请输入手机号"
                  :class="{ error: errors.phone }"
                />
                <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
              </div>

              <div class="form-group">
                <label>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  班级
                </label>
                <input
                  v-model="form.class"
                  type="text"
                  placeholder="例如：计算机2101班"
                  :class="{ error: errors.class }"
                />
                <span v-if="errors.class" class="error-message">{{ errors.class }}</span>
              </div>
            </div>

            <div class="form-group full-width">
              <label>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                学院
              </label>
              <input
                v-model="form.department"
                type="text"
                placeholder="例如：计算机学院"
                :class="{ error: errors.department }"
              />
              <span v-if="errors.department" class="error-message">{{ errors.department }}</span>
            </div>

            <button type="submit" class="submit-btn" :disabled="isLoading">
              <span v-if="isLoading" class="btn-loader"></span>
              <span v-else>完成</span>
            </button>
          </form>
        </div>

        <div v-else class="success-container">
          <div class="success-animation">
            <div class="checkmark">
              <svg viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="25" fill="none"/>
                <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
          </div>
          <h2>信息完善成功！</h2>
          <p>正在跳转到学生端首页...</p>
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

.complete-profile-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #99f6e4 100%);
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 背景装饰 */
.background-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(20, 184, 166, 0.1);
}

.circle-1 {
  width: 600px;
  height: 600px;
  top: -200px;
  right: -200px;
  animation: float 20s infinite ease-in-out;
}

.circle-2 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  left: -100px;
  animation: float 15s infinite ease-in-out reverse;
}

.circle-3 {
  width: 300px;
  height: 300px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(20, 184, 166, 0.05);
  animation: pulse 10s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -30px) rotate(120deg); }
  66% { transform: translate(-20px, 20px) rotate(240deg); }
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
}

/* 容器 */
.container {
  width: 100%;
  max-width: 640px;
  padding: 20px;
  position: relative;
  z-index: 1;
}

/* 卡片 */
.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

/* 卡片头部 */
.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 700;
  color: #0f766e;
  margin-bottom: 20px;
}

.logo svg {
  width: 32px;
  height: 32px;
}

.card-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 15px;
  color: #6b7280;
}

/* 表单 */
.form-container form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group label svg {
  width: 16px;
  height: 16px;
  color: #14b8a6;
}

.form-group input {
  padding: 14px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.2s;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1);
}

.form-group input.error {
  border-color: #ef4444;
}

.form-group input.error:focus {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.error-message {
  font-size: 13px;
  color: #ef4444;
  min-height: 18px;
}

/* 提交按钮 */
.submit-btn {
  padding: 16px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(20, 184, 166, 0.4);
}

.submit-btn:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.btn-loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 成功状态 */
.success-container {
  text-align: center;
  padding: 40px 20px;
}

.success-animation {
  margin-bottom: 24px;
}

.checkmark {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  border-radius: 50%;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: successPop 0.5s ease;
}

.checkmark svg {
  width: 48px;
  height: 48px;
}

.checkmark circle {
  stroke: white;
  stroke-width: 3;
}

.checkmark path {
  stroke: white;
  stroke-width: 3;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: checkmarkDraw 0.3s ease forwards 0.3s;
}

@keyframes successPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes checkmarkDraw {
  to { stroke-dashoffset: 0; }
}

.success-container h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.success-container p {
  font-size: 15px;
  color: #6b7280;
}

/* 响应式 */
@media (max-width: 640px) {
  .card {
    padding: 28px 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .card-header h1 {
    font-size: 22px;
  }
}
</style>
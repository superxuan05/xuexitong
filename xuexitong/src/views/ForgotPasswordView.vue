<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 步骤：1-输入邮箱 2-验证邮箱 3-设置新密码 4-完成
const currentStep = ref(1)

const form = reactive({
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: '',
})

const errors = reactive({
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: '',
})

const isLoading = ref(false)
const countdown = ref(0)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const canSendCode = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(form.email) && countdown.value === 0
})

const sendCodeText = computed(() => {
  if (countdown.value > 0) return `${countdown.value}s后重发`
  return '获取验证码'
})

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const sendVerificationCode = async () => {
  if (!canSendCode.value) return
  
  isLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    form.verificationCode = code
    alert(`您的验证码是：${code}\n（实际项目中会通过邮件发送）`)
    startCountdown()
  } catch {
    alert('发送失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const validateStep1 = () => {
  let isValid = true
  errors.email = ''

  if (!form.email.trim()) {
    errors.email = '请输入邮箱地址'
    isValid = false
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      errors.email = '请输入有效的邮箱地址'
      isValid = false
    }
  }

  return isValid
}

const validateStep2 = () => {
  let isValid = true
  errors.verificationCode = ''

  if (!form.verificationCode.trim()) {
    errors.verificationCode = '请输入验证码'
    isValid = false
  } else if (form.verificationCode.length !== 6) {
    errors.verificationCode = '验证码为6位数字'
    isValid = false
  }

  return isValid
}

const validateStep3 = () => {
  let isValid = true
  errors.newPassword = ''
  errors.confirmPassword = ''

  if (!form.newPassword) {
    errors.newPassword = '请输入新密码'
    isValid = false
  } else if (form.newPassword.length < 6) {
    errors.newPassword = '密码长度至少6位'
    isValid = false
  } else if (form.newPassword.length > 20) {
    errors.newPassword = '密码长度不超过20位'
    isValid = false
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认新密码'
    isValid = false
  } else if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  return isValid
}

const handleNext = async () => {
  if (currentStep.value === 1) {
    if (!validateStep1()) return
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      currentStep.value = 2
    } finally {
      isLoading.value = false
    }
  } else if (currentStep.value === 2) {
    if (!validateStep2()) return
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      currentStep.value = 3
    } finally {
      isLoading.value = false
    }
  } else if (currentStep.value === 3) {
    if (!validateStep3()) return
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      currentStep.value = 4
    } finally {
      isLoading.value = false
    }
  }
}

const goToLogin = () => {
  router.push('/login')
}

const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <div class="forgot-page">
    <!-- 左侧品牌区 -->
    <div class="left-side">
      <div class="brand-wrapper">
        <div class="logo-area">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span class="brand-name">智签</span>
        </div>
        <div class="hero-content">
          <h1 class="hero-title">找回密码<br/>安全无忧</h1>
          <p class="hero-subtitle">通过邮箱验证，快速重置您的密码</p>
        </div>
      </div>
      <div class="feature-grid">
        <div class="feature-item">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="feature-text">
            <span class="feature-title">安全验证</span>
            <span class="feature-desc">邮箱验证</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div class="feature-text">
            <span class="feature-title">密码保护</span>
            <span class="feature-desc">加密存储</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="feature-text">
            <span class="feature-title">快速重置</span>
            <span class="feature-desc">即时生效</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div class="feature-text">
            <span class="feature-title">实时通知</span>
            <span class="feature-desc">邮件提醒</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="right-side">
      <div class="forgot-card">
        <!-- 返回按钮 -->
        <button class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div class="forgot-header">
          <h2 class="forgot-title">忘记密码</h2>
          <p class="forgot-subtitle">{{ currentStep === 1 ? '输入您的邮箱地址' : currentStep === 2 ? '验证您的邮箱' : currentStep === 3 ? '设置新密码' : '密码重置成功' }}</p>
        </div>

        <!-- 步骤指示器 -->
        <div class="step-indicator" v-if="currentStep < 4">
          <div class="step-item" :class="{ active: currentStep >= 1, current: currentStep === 1 }">
            <div class="step-number">1</div>
            <span class="step-text">输入邮箱</span>
          </div>
          <div class="step-line" :class="{ active: currentStep >= 2 }"></div>
          <div class="step-item" :class="{ active: currentStep >= 2, current: currentStep === 2 }">
            <div class="step-number">2</div>
            <span class="step-text">验证邮箱</span>
          </div>
          <div class="step-line" :class="{ active: currentStep >= 3 }"></div>
          <div class="step-item" :class="{ active: currentStep >= 3, current: currentStep === 3 }">
            <div class="step-number">3</div>
            <span class="step-text">重置密码</span>
          </div>
        </div>

        <!-- 步骤1：输入邮箱 -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              邮箱地址
            </label>
            <input
              v-model="form.email"
              type="email"
              class="form-input"
              :class="{ error: errors.email }"
              placeholder="请输入注册时的邮箱地址"
            />
            <span v-if="errors.email" class="error-msg">{{ errors.email }}</span>
          </div>

          <button class="submit-btn" @click="handleNext" :disabled="isLoading">
            <span v-if="isLoading" class="btn-loader"></span>
            <span v-else>下一步</span>
          </button>
        </div>

        <!-- 步骤2：验证邮箱 -->
        <div v-if="currentStep === 2" class="step-content">
          <div class="email-hint">
            <p>验证码已发送至</p>
            <p class="email-address">{{ form.email }}</p>
          </div>

          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              验证码
            </label>
            <div class="code-input-wrap">
              <input
                v-model="form.verificationCode"
                type="text"
                class="form-input code-input"
                :class="{ error: errors.verificationCode }"
                placeholder="请输入6位验证码"
                maxlength="6"
              />
              <button 
                type="button" 
                class="send-code-btn" 
                :disabled="!canSendCode || isLoading"
                @click="sendVerificationCode"
              >
                {{ sendCodeText }}
              </button>
            </div>
            <span v-if="errors.verificationCode" class="error-msg">{{ errors.verificationCode }}</span>
          </div>

          <button class="submit-btn" @click="handleNext" :disabled="isLoading">
            <span v-if="isLoading" class="btn-loader"></span>
            <span v-else>验证</span>
          </button>
        </div>

        <!-- 步骤3：设置新密码 -->
        <div v-if="currentStep === 3" class="step-content">
          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              新密码
            </label>
            <div class="password-wrap">
              <input
                v-model="form.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ error: errors.newPassword }"
                placeholder="设置新密码（6-20位）"
              />
              <button type="button" class="eye-btn" @click="showNewPassword = !showNewPassword">
                <svg v-if="showNewPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <span v-if="errors.newPassword" class="error-msg">{{ errors.newPassword }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              确认新密码
            </label>
            <div class="password-wrap">
              <input
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ error: errors.confirmPassword }"
                placeholder="再次输入新密码"
              />
              <button type="button" class="eye-btn" @click="showConfirmPassword = !showConfirmPassword">
                <svg v-if="showConfirmPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <span v-if="errors.confirmPassword" class="error-msg">{{ errors.confirmPassword }}</span>
          </div>

          <button class="submit-btn" @click="handleNext" :disabled="isLoading">
            <span v-if="isLoading" class="btn-loader"></span>
            <span v-else>重置密码</span>
          </button>
        </div>

        <!-- 步骤4：完成 -->
        <div v-if="currentStep === 4" class="step-content success-step">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h3 class="success-title">密码重置成功</h3>
          <p class="success-desc">您的密码已成功重置，请使用新密码登录</p>
          <button class="submit-btn" @click="goToLogin">
            返回登录
          </button>
        </div>

        <div class="login-link" v-if="currentStep < 4">
          想起密码了？<a @click="goToLogin">返回登录</a>
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
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.forgot-page {
  min-height: 100vh;
  display: flex;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 左侧品牌区 */
.left-side {
  flex: 0 0 44%;
  background: linear-gradient(135deg, #0f766e 0%, #134e4a 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  color: white;
  position: relative;
  overflow: hidden;
}

.left-side::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -30%;
  width: 80%;
  height: 150%;
  background: radial-gradient(ellipse, rgba(94, 234, 212, 0.15) 0%, transparent 70%);
  animation: float 8s ease-in-out infinite;
}

.left-side::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -20%;
  width: 60%;
  height: 100%;
  background: radial-gradient(ellipse, rgba(20, 184, 166, 0.2) 0%, transparent 60%);
  animation: float 10s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(20px, -20px) rotate(5deg); }
}

.brand-wrapper {
  position: relative;
  z-index: 1;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 48px;
}

.logo-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logo-icon svg {
  width: 24px;
  height: 24px;
  color: #5eead4;
}

.brand-name {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 2px;
}

.hero-content {
  margin-bottom: 48px;
}

.hero-title {
  font-size: 42px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #5eead4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.feature-icon {
  width: 40px;
  height: 40px;
  background: rgba(94, 234, 212, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon svg {
  width: 20px;
  height: 20px;
  color: #5eead4;
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-title {
  font-size: 14px;
  font-weight: 600;
}

.feature-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* 右侧表单区 */
.right-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: #f8fafc;
}

.forgot-card {
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  position: relative;
}

.back-btn {
  position: absolute;
  top: 24px;
  left: 24px;
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.back-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.forgot-header {
  text-align: center;
  margin-bottom: 32px;
  padding-top: 20px;
}

.forgot-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.forgot-subtitle {
  font-size: 14px;
  color: #6b7280;
}

/* 步骤指示器 */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.step-item.active .step-number {
  background: #14b8a6;
  color: white;
}

.step-item.current .step-number {
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
}

.step-text {
  font-size: 12px;
  color: #9ca3af;
  transition: all 0.3s;
}

.step-item.active .step-text {
  color: #14b8a6;
  font-weight: 500;
}

.step-line {
  width: 40px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 8px;
  margin-bottom: 20px;
  transition: all 0.3s;
}

.step-line.active {
  background: #14b8a6;
}

/* 表单 */
.step-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-label svg {
  width: 18px;
  height: 18px;
  color: #14b8a6;
}

.form-input {
  padding: 14px 18px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  background: white;
  transition: all 0.2s;
  width: 100%;
}

.form-input:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.form-input.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.code-input-wrap {
  display: flex;
  gap: 12px;
}

.code-input {
  flex: 1;
  text-align: center;
  letter-spacing: 4px;
  font-size: 18px;
}

.send-code-btn {
  padding: 0 20px;
  background: #f0fdfa;
  border: 1.5px solid #99f6e4;
  border-radius: 10px;
  color: #14b8a6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.send-code-btn:hover:not(:disabled) {
  background: #ccfbf1;
  border-color: #14b8a6;
}

.send-code-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.email-hint {
  text-align: center;
  padding: 16px;
  background: #f0fdfa;
  border-radius: 10px;
  margin-bottom: 8px;
}

.email-hint p {
  font-size: 14px;
  color: #6b7280;
}

.email-hint .email-address {
  font-size: 16px;
  font-weight: 600;
  color: #14b8a6;
  margin-top: 4px;
}

.password-wrap {
  position: relative;
}

.password-wrap .form-input {
  padding-right: 52px;
}

.eye-btn {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: #9ca3af;
  transition: color 0.2s;
}

.eye-btn:hover {
  color: #6b7280;
}

.eye-btn svg {
  width: 20px;
  height: 20px;
}

.error-msg {
  font-size: 12px;
  color: #ef4444;
  min-height: 18px;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-top: 8px;
  box-shadow: 0 4px 14px rgba(20, 184, 166, 0.35);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.45);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-loader {
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

/* 成功步骤 */
.success-step {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: white;
  animation: successPop 0.5s ease;
}

.success-icon svg {
  width: 40px;
  height: 40px;
}

@keyframes successPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.success-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.success-desc {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
}

.login-link {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin-top: 16px;
}

.login-link a {
  color: #14b8a6;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.login-link a:hover {
  color: #0d9488;
  text-decoration: underline;
}

/* 响应式 */
@media (max-width: 1024px) {
  .left-side {
    flex: 0 0 40%;
    padding: 40px 36px;
  }

  .hero-title {
    font-size: 36px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .forgot-page {
    flex-direction: column;
  }

  .left-side {
    flex: none;
    padding: 32px 24px;
    min-height: auto;
  }

  .brand-wrapper {
    text-align: center;
  }

  .logo-area {
    justify-content: center;
    margin-bottom: 24px;
  }

  .hero-content {
    margin-bottom: 24px;
  }

  .hero-title {
    font-size: 30px;
  }

  .feature-grid {
    display: none;
  }

  .right-side {
    padding: 32px 24px;
  }

  .forgot-card {
    padding: 32px 24px;
  }

  .step-indicator {
    transform: scale(0.9);
  }

  .code-input-wrap {
    flex-direction: column;
  }

  .send-code-btn {
    padding: 12px;
  }
}
</style>
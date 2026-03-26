<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive({
  username: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'student',
  agreeTerms: false
})

const errors = reactive({
  username: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  agreeTerms: ''
})

const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// 拼图验证码
const showCaptcha = ref(false)
const captchaVerified = ref(false)
const puzzleX = ref(0)
const targetX = ref(180)
const isDragging = ref(false)
const sliderRef = ref<HTMLDivElement | null>(null)
const sliderWidth = ref(0)
const startX = ref(0)
const startSliderPos = ref(0)

// 拼图形状配置（凹凸形状）
const puzzleShape = ref({
  top: Math.random() > 0.5 ? 1 : -1, // 1=凸, -1=凹, 0=平
  right: Math.random() > 0.5 ? 1 : -1,
  bottom: Math.random() > 0.5 ? 1 : -1,
  left: 0 // 左边保持平直，作为起始边
})

const generatePuzzleShape = () => {
  puzzleShape.value = {
    top: Math.random() > 0.5 ? 1 : -1,
    right: Math.random() > 0.5 ? 1 : -1,
    bottom: Math.random() > 0.5 ? 1 : -1,
    left: 0
  }
}

const openCaptcha = () => {
  if (!validateForm()) return
  showCaptcha.value = true
  captchaVerified.value = false
  puzzleX.value = 0
  targetX.value = 160 + Math.random() * 80
  generatePuzzleShape()
  setTimeout(() => {
    if (sliderRef.value) {
      sliderWidth.value = sliderRef.value.offsetWidth - 44
    }
  }, 100)
}

const startDrag = (e: MouseEvent | TouchEvent) => {
  if (captchaVerified.value) return
  isDragging.value = true
  const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
  startX.value = clientX
  startSliderPos.value = puzzleX.value
}

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value || captchaVerified.value) return
  const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
  const diff = clientX - startX.value
  const maxPuzzleX = 220
  // 直接映射：滑块移动多少，拼图就移动多少（1:1比例）
  const sensitivity = 1.2 // 灵敏度系数，大于1更灵敏
  puzzleX.value = Math.max(0, Math.min(startSliderPos.value + diff * sensitivity, maxPuzzleX))
}

const endDrag = () => {
  if (!isDragging.value) return
  isDragging.value = false
  const tolerance = 8
  if (Math.abs(puzzleX.value - targetX.value) <= tolerance) {
    puzzleX.value = targetX.value
    captchaVerified.value = true
    setTimeout(() => {
      showCaptcha.value = false
      doRegister()
    }, 600)
  } else {
    puzzleX.value = 0
  }
}

const doRegister = async () => {
  isLoading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: form.username,
        password: form.password,
        role: form.role,
        name: form.name || form.username,
        email: form.email,
        phone: ''
      })
    })

    const data = await response.json()

    if (data.success) {
      alert('注册成功！')
      router.push('/login')
    } else {
      alert(data.message || '注册失败，请检查填写信息')
    }
  } catch (error) {
    console.error('注册错误:', error)
    alert('注册失败，请检查网络连接')
  } finally {
    isLoading.value = false
  }
}

const validateForm = () => {
  let isValid = true

  errors.username = ''
  errors.name = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.role = ''
  errors.agreeTerms = ''

  if (!form.username.trim()) {
    errors.username = '请输入用户名'
    isValid = false
  } else if (form.username.length < 3) {
    errors.username = '用户名至少需要3个字符'
    isValid = false
  }

  if (!form.name.trim()) {
    errors.name = '请输入姓名'
    isValid = false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email.trim()) {
    errors.email = '请输入邮箱'
    isValid = false
  } else if (!emailRegex.test(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }

  if (!form.password) {
    errors.password = '请输入密码'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = '密码至少需要6个字符'
    isValid = false
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认密码'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  if (!form.agreeTerms) {
    errors.agreeTerms = '请同意服务条款'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  openCaptcha()
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-page">
    <div class="left-side">
      <div class="brand-wrapper">
        <div class="logo-area">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M9 16l2 2 4-4"/>
            </svg>
          </div>
          <span class="brand-name">智签</span>
        </div>
        
        <div class="hero-content">
          <h1 class="hero-title">智能签到系统</h1>
          <p class="hero-desc">
            让签到更简单，让管理更高效<br />
            支持多种签到方式，实时统计考勤数据
          </p>
        </div>

        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon location">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <span class="feature-name">定位签到</span>
          </div>
          <div class="feature-card">
            <div class="feature-icon qrcode">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <span class="feature-name">扫码签到</span>
          </div>
          <div class="feature-card">
            <div class="feature-icon wifi">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                <line x1="12" y1="20" x2="12.01" y2="20"/>
              </svg>
            </div>
            <span class="feature-name">WiFi签到</span>
          </div>
          <div class="feature-card">
            <div class="feature-icon face">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span class="feature-name">人脸识别</span>
          </div>
        </div>
      </div>

      <div class="footer-stats">
        <div class="stat">
          <span class="stat-value">500万+</span>
          <span class="stat-name">签到次数</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-value">10万+</span>
          <span class="stat-name">课堂</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-value">99.9%</span>
          <span class="stat-name">准确率</span>
        </div>
      </div>
    </div>

    <div class="right-side">
      <div class="form-container">
        <div class="form-header">
          <h2>创建账户</h2>
          <p>选择您的身份开始使用</p>
        </div>

        <div class="role-selector">
          <label 
            class="role-option" 
            :class="{ active: form.role === 'student' }"
            @click="form.role = 'student'"
          >
            <div class="role-icon-wrapper student">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div class="role-info">
              <span class="role-title">我是学生</span>
              <span class="role-desc">快速签到，查看考勤</span>
            </div>
            <div class="role-check">
              <svg v-if="form.role === 'student'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </label>
          <label 
            class="role-option" 
            :class="{ active: form.role === 'teacher' }"
            @click="form.role = 'teacher'"
          >
            <div class="role-icon-wrapper teacher">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="role-info">
              <span class="role-title">我是老师</span>
              <span class="role-desc">发起签到，管理班级</span>
            </div>
            <div class="role-check">
              <svg v-if="form.role === 'teacher'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </label>
        </div>

        <form class="register-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              用户名
            </label>
            <input
              v-model="form.username"
              type="text"
              class="form-input"
              :class="{ error: errors.username }"
              placeholder="请输入用户名/学号/工号"
            />
            <span v-if="errors.username" class="error-msg">{{ errors.username }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              姓名
            </label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              :class="{ error: errors.name }"
              placeholder="请输入真实姓名"
            />
            <span v-if="errors.name" class="error-msg">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              邮箱
            </label>
            <input
              v-model="form.email"
              type="email"
              class="form-input"
              :class="{ error: errors.email }"
              placeholder="请输入邮箱地址"
            />
            <span v-if="errors.email" class="error-msg">{{ errors.email }}</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                密码
              </label>
              <div class="password-wrap">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  :class="{ error: errors.password }"
                  placeholder="设置密码"
                />
                <button type="button" class="eye-btn" @click="showPassword = !showPassword">
                  <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
              <span v-if="errors.password" class="error-msg">{{ errors.password }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                确认密码
              </label>
              <div class="password-wrap">
                <input
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="form-input"
                  :class="{ error: errors.confirmPassword }"
                  placeholder="确认密码"
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
          </div>

          <div class="agreement">
            <label class="checkbox-label">
              <input v-model="form.agreeTerms" type="checkbox" />
              <span class="checkbox-custom"></span>
              <span class="agree-text">
                我已阅读并同意 <a href="#">用户协议</a> 和 <a href="#">隐私政策</a>
              </span>
            </label>
            <span v-if="errors.agreeTerms" class="error-msg">{{ errors.agreeTerms }}</span>
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="isLoading" class="btn-loader"></span>
            <span v-else>立即注册</span>
          </button>
        </form>

        <div class="form-footer">
          <span>已有账户？</span>
          <a href="#" @click.prevent="goToLogin">直接登录</a>
        </div>
      </div>
    </div>

    <!-- 拼图验证码弹窗 -->
    <div v-if="showCaptcha" class="captcha-overlay" @click.self="showCaptcha = false">
      <div class="captcha-modal">
        <div class="captcha-header">
          <h3>安全验证</h3>
          <p>拖动拼图块到正确位置</p>
          <button class="captcha-close" @click="showCaptcha = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="captcha-content">
          <!-- 拼图区域 -->
          <div class="puzzle-container">
            <!-- 背景图 -->
            <div class="puzzle-image">
              <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#0f766e"/>
                    <stop offset="100%" style="stop-color:#134e4a"/>
                  </linearGradient>
                </defs>
                <rect width="280" height="160" fill="url(#bgGrad)"/>
                <!-- 装饰图案 -->
                <circle cx="40" cy="40" r="20" fill="rgba(255,255,255,0.1)"/>
                <circle cx="240" cy="120" r="30" fill="rgba(255,255,255,0.08)"/>
                <rect x="100" y="20" width="80" height="8" rx="4" fill="rgba(255,255,255,0.1)"/>
                <rect x="60" y="130" width="60" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
                <circle cx="200" cy="50" r="15" fill="rgba(255,255,255,0.06)"/>
                <rect x="20" y="90" width="40" height="4" rx="2" fill="rgba(255,255,255,0.1)"/>
                <!-- 文字 -->
                <text x="140" y="85" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="24" font-weight="bold">智签</text>
              </svg>
            </div>
            
            <!-- 目标位置缺口提示 -->
            <div 
              class="puzzle-target"
              :style="{ left: targetX + 'px', top: '58px' }"
            >
              <svg viewBox="0 0 60 60" fill="none">
                <defs>
                  <clipPath id="targetClip">
                    <path :d="`M 8 ${puzzleShape.top === 1 ? 0 : (puzzleShape.top === -1 ? 12 : 0)} 
                      Q 8 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)} 20 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)}
                      Q 32 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)} 32 ${puzzleShape.top === 1 ? 0 : (puzzleShape.top === -1 ? 12 : 0)}
                      L ${puzzleShape.right === 1 ? 48 : (puzzleShape.right === -1 ? 36 : 52)} 8
                      Q ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 8 ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 20
                      Q ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 32 ${puzzleShape.right === 1 ? 48 : (puzzleShape.right === -1 ? 36 : 52)} 32
                      L 32 ${puzzleShape.bottom === 1 ? 48 : (puzzleShape.bottom === -1 ? 36 : 52)}
                      Q 32 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)} 20 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)}
                      Q 8 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)} 8 ${puzzleShape.bottom === 1 ? 48 : (puzzleShape.bottom === -1 ? 36 : 52)}
                      L 8 32 Z`"/>
                  </clipPath>
                </defs>
                <path :d="`M 8 ${puzzleShape.top === 1 ? 0 : (puzzleShape.top === -1 ? 12 : 0)} 
                  Q 8 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)} 20 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)}
                  Q 32 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)} 32 ${puzzleShape.top === 1 ? 0 : (puzzleShape.top === -1 ? 12 : 0)}
                  L ${puzzleShape.right === 1 ? 48 : (puzzleShape.right === -1 ? 36 : 52)} 8
                  Q ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 8 ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 20
                  Q ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 32 ${puzzleShape.right === 1 ? 48 : (puzzleShape.right === -1 ? 36 : 52)} 32
                  L 32 ${puzzleShape.bottom === 1 ? 48 : (puzzleShape.bottom === -1 ? 36 : 52)}
                  Q 32 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)} 20 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)}
                  Q 8 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)} 8 ${puzzleShape.bottom === 1 ? 48 : (puzzleShape.bottom === -1 ? 36 : 52)}
                  L 8 32 Z`" 
                  fill="rgba(255,255,255,0.25)" 
                  stroke="rgba(255,255,255,0.6)" 
                  stroke-width="2" 
                  stroke-dasharray="4 2"/>
              </svg>
            </div>
            
            <!-- 拼图块（只显示，不直接拖动） -->
            <div 
              class="puzzle-block"
              :style="{ left: puzzleX + 'px', top: '58px' }"
              :class="{ verified: captchaVerified }"
            >
              <svg viewBox="0 0 60 60" fill="none">
                <defs>
                  <clipPath id="puzzleClip">
                    <path :d="`M 8 ${puzzleShape.top === 1 ? 0 : (puzzleShape.top === -1 ? 12 : 0)} 
                      Q 8 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)} 20 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)}
                      Q 32 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)} 32 ${puzzleShape.top === 1 ? 0 : (puzzleShape.top === -1 ? 12 : 0)}
                      L ${puzzleShape.right === 1 ? 48 : (puzzleShape.right === -1 ? 36 : 52)} 8
                      Q ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 8 ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 20
                      Q ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 32 ${puzzleShape.right === 1 ? 48 : (puzzleShape.right === -1 ? 36 : 52)} 32
                      L 32 ${puzzleShape.bottom === 1 ? 48 : (puzzleShape.bottom === -1 ? 36 : 52)}
                      Q 32 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)} 20 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)}
                      Q 8 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)} 8 ${puzzleShape.bottom === 1 ? 48 : (puzzleShape.bottom === -1 ? 36 : 52)}
                      L 8 32 Z`"/>
                  </clipPath>
                </defs>
                <!-- 拼图块阴影背景 -->
                <path :d="`M 8 ${puzzleShape.top === 1 ? 0 : (puzzleShape.top === -1 ? 12 : 0)} 
                  Q 8 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)} 20 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)}
                  Q 32 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)} 32 ${puzzleShape.top === 1 ? 0 : (puzzleShape.top === -1 ? 12 : 0)}
                  L ${puzzleShape.right === 1 ? 48 : (puzzleShape.right === -1 ? 36 : 52)} 8
                  Q ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 8 ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 20
                  Q ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 32 ${puzzleShape.right === 1 ? 48 : (puzzleShape.right === -1 ? 36 : 52)} 32
                  L 32 ${puzzleShape.bottom === 1 ? 48 : (puzzleShape.bottom === -1 ? 36 : 52)}
                  Q 32 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)} 20 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)}
                  Q 8 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)} 8 ${puzzleShape.bottom === 1 ? 48 : (puzzleShape.bottom === -1 ? 36 : 52)}
                  L 8 32 Z`" 
                  fill="#14b8a6"/>
                <!-- 拼图图案（与背景对应） -->
                <g clip-path="url(#puzzleClip)">
                  <rect x="-10" y="-10" width="80" height="80" fill="url(#bgGrad)"/>
                  <circle :cx="40 - puzzleX" cy="40" r="20" fill="rgba(255,255,255,0.1)"/>
                  <circle :cx="240 - puzzleX" cy="120" r="30" fill="rgba(255,255,255,0.08)"/>
                  <rect :x="100 - puzzleX" y="20" width="80" height="8" rx="4" fill="rgba(255,255,255,0.1)"/>
                  <rect :x="60 - puzzleX" y="130" width="60" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
                  <circle :cx="200 - puzzleX" cy="50" r="15" fill="rgba(255,255,255,0.06)"/>
                  <rect :x="20 - puzzleX" y="90" width="40" height="4" rx="2" fill="rgba(255,255,255,0.1)"/>
                  <text :x="140 - puzzleX" y="85" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="24" font-weight="bold">智签</text>
                </g>
                <!-- 边框 -->
                <path :d="`M 8 ${puzzleShape.top === 1 ? 0 : (puzzleShape.top === -1 ? 12 : 0)} 
                  Q 8 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)} 20 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)}
                  Q 32 ${puzzleShape.top === 1 ? 12 : (puzzleShape.top === -1 ? 0 : 0)} 32 ${puzzleShape.top === 1 ? 0 : (puzzleShape.top === -1 ? 12 : 0)}
                  L ${puzzleShape.right === 1 ? 48 : (puzzleShape.right === -1 ? 36 : 52)} 8
                  Q ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 8 ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 20
                  Q ${puzzleShape.right === 1 ? 36 : (puzzleShape.right === -1 ? 48 : 52)} 32 ${puzzleShape.right === 1 ? 48 : (puzzleShape.right === -1 ? 36 : 52)} 32
                  L 32 ${puzzleShape.bottom === 1 ? 48 : (puzzleShape.bottom === -1 ? 36 : 52)}
                  Q 32 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)} 20 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)}
                  Q 8 ${puzzleShape.bottom === 1 ? 36 : (puzzleShape.bottom === -1 ? 48 : 52)} 8 ${puzzleShape.bottom === 1 ? 48 : (puzzleShape.bottom === -1 ? 36 : 52)}
                  L 8 32 Z`" 
                  fill="none" stroke="white" stroke-width="2"/>
              </svg>
            </div>
          </div>
          
          <!-- 滑动轨道 -->
          <div 
            ref="sliderRef"
            class="puzzle-slider-track"
            @mousemove="onDrag"
            @mouseup="endDrag"
            @mouseleave="endDrag"
            @touchmove="onDrag"
            @touchend="endDrag"
          >
            <div class="puzzle-slider-bg">
              <span v-if="!captchaVerified">→ 按住滑块拖动完成拼图</span>
              <span v-else class="verified-text">✓ 验证成功</span>
            </div>
            <div 
              class="puzzle-slider-progress"
              :style="{ width: (puzzleX / 236 * (sliderWidth || 200)) + 22 + 'px' }"
            ></div>
            <div 
              class="puzzle-slider-btn"
              :style="{ left: (puzzleX / 236 * (sliderWidth || 200)) + 'px' }"
              :class="{ verified: captchaVerified, dragging: isDragging }"
              @mousedown="startDrag"
              @touchstart="startDrag"
            >
              <svg v-if="!captchaVerified" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
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

.register-page {
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
  padding: 36px 48px;
  color: white;
  position: relative;
  overflow: hidden;
}

.left-side::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
}

.brand-wrapper {
  position: relative;
  z-index: 1;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon svg {
  width: 28px;
  height: 28px;
}

.brand-name {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 2px;
}

.hero-content {
  margin-bottom: 28px;
}

.hero-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.3;
}

.hero-desc {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 400;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon svg {
  width: 20px;
  height: 20px;
}

.feature-icon.location {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.feature-icon.qrcode {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}

.feature-icon.wifi {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.feature-icon.face {
  background: rgba(249, 115, 22, 0.2);
  color: #fb923c;
}

.feature-name {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.footer-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #2dd4bf;
}

.stat-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.15);
}

/* 右侧表单区 */
.right-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 48px;
  background: #f0fdfa;
}

.form-container {
  width: 100%;
  max-width: 420px;
}

.form-header {
  margin-bottom: 20px;
}

.form-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #134e4a;
  margin-bottom: 4px;
}

.form-header p {
  font-size: 13px;
  color: #5eead4;
}

/* 角色选择 */
.role-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.role-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border: 2px solid #ccfbf1;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-option:hover {
  border-color: #99f6e4;
}

.role-option.active {
  border-color: #14b8a6;
  background: #f0fdfa;
}

.role-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.role-icon-wrapper svg {
  width: 24px;
  height: 24px;
}

.role-icon-wrapper.student {
  background: #dbeafe;
  color: #3b82f6;
}

.role-icon-wrapper.teacher {
  background: #fce7f3;
  color: #ec4899;
}

.role-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.role-desc {
  font-size: 13px;
  color: #6b7280;
}

.role-check {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #14b8a6;
  color: white;
}

.role-check svg {
  width: 16px;
  height: 16px;
}

/* 表单 */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
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

/* 协议 */
.agreement {
  margin-top: 4px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
  color: #4b5563;
}

.checkbox-label input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  transition: all 0.2s;
}

.checkbox-label input:checked + .checkbox-custom {
  background: #14b8a6;
  border-color: #14b8a6;
}

.checkbox-label input:checked + .checkbox-custom::after {
  content: '';
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-bottom: 2px;
}

.agree-text a {
  color: #14b8a6;
  text-decoration: none;
  font-weight: 500;
}

.agree-text a:hover {
  text-decoration: underline;
}

/* 提交按钮 */
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

/* 底部 */
.form-footer {
  text-align: center;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  color: #6b7280;
}

.form-footer a {
  color: #14b8a6;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
}

.form-footer a:hover {
  text-decoration: underline;
}

/* 滑动验证码 */
.captcha-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.captcha-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 360px;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.captcha-header {
  padding: 20px 20px 12px;
  text-align: center;
  position: relative;
  border-bottom: 1px solid #f3f4f6;
}

.captcha-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.captcha-header p {
  font-size: 13px;
  color: #6b7280;
}

.captcha-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.captcha-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.captcha-close svg {
  width: 14px;
  height: 14px;
}

.captcha-content {
  padding: 20px;
}

.puzzle-area {
  position: relative;
  width: 280px;
  height: 160px;
  margin: 0 auto 16px;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
}

.puzzle-bg {
  width: 100%;
  height: 100%;
}

.puzzle-bg svg {
  width: 100%;
  height: 100%;
}

/* 拼图验证码样式 */
.puzzle-container {
  position: relative;
  width: 280px;
  height: 160px;
  margin: 0 auto 16px;
  border-radius: 8px;
  overflow: hidden;
  user-select: none;
  touch-action: none;
}

.puzzle-image {
  width: 100%;
  height: 100%;
}

.puzzle-image svg {
  width: 100%;
  height: 100%;
}

.puzzle-target {
  position: absolute;
  width: 60px;
  height: 60px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.puzzle-target svg {
  width: 100%;
  height: 100%;
}

.puzzle-block {
  position: absolute;
  width: 60px;
  height: 60px;
  transition: left 0.1s ease;
  z-index: 10;
}

.puzzle-block.verified {
  animation: successPop 0.5s ease;
}

@keyframes successPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.puzzle-block svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
}

.puzzle-slider-track {
  position: relative;
  height: 44px;
  background: #f3f4f6;
  border-radius: 22px;
  overflow: hidden;
  user-select: none;
  touch-action: none;
}

.puzzle-slider-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #9ca3af;
}

.puzzle-slider-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #ccfbf1 0%, #99f6e4 100%);
  border-radius: 22px;
  transition: width 0.1s ease;
}

.puzzle-slider-btn {
  position: absolute;
  top: 2px;
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: left 0.1s ease, background 0.2s;
  z-index: 10;
}

.puzzle-slider-btn:active,
.puzzle-slider-btn.dragging {
  cursor: grabbing;
  transform: scale(1.05);
}

.puzzle-slider-btn.verified {
  background: #14b8a6;
  cursor: default;
}

.puzzle-slider-btn svg {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.puzzle-slider-btn.verified svg {
  color: white;
}

/* 响应式 */
@media (max-width: 1024px) {
  .left-side {
    flex: 0 0 40%;
    padding: 40px 36px;
  }

  .hero-title {
    font-size: 30px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .register-page {
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
    font-size: 26px;
  }

  .feature-grid {
    display: none;
  }

  .footer-stats {
    justify-content: center;
  }

  .right-side {
    padding: 32px 24px;
  }

  .form-row {
    flex-direction: column;
    gap: 18px;
  }
}
</style>

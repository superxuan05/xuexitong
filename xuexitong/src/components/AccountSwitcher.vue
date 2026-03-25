<template>
  <div class="account-switcher">
    <div class="current-account" @click="toggleDropdown">
      <div class="avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div class="account-info">
        <span class="name">{{ currentAccount?.name || '未登录' }}</span>
        <span class="role">{{ currentAccount?.role === 'teacher' ? '教师' : '学生' }}</span>
      </div>
      <svg class="dropdown-arrow" :class="{ open: showDropdown }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>

    <div v-if="showDropdown" class="dropdown-menu">
      <div class="dropdown-header">
        <span>已登录账号</span>
        <span class="account-count">{{ allAccounts.length }}个</span>
      </div>
      
      <div class="account-list">
        <div
          v-for="account in allAccounts"
          :key="account.id"
          class="account-item"
          :class="{ active: account.id === currentAccount?.id }"
          @click="switchToAccount(account)"
        >
          <div class="avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="account-info">
            <span class="name">{{ account.name }}</span>
            <span class="username">{{ account.username }}</span>
          </div>
          <div class="role-badge" :class="account.role">
            {{ account.role === 'teacher' ? '教师' : '学生' }}
          </div>
          <button class="remove-btn" @click.stop="removeAccount(account.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="dropdown-footer">
        <button class="add-account-btn" @click="goToLogin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          添加新账号
        </button>
        <button class="logout-all-btn" @click="logoutAll">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          退出所有
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  getCurrentAccount, 
  getAllAccounts, 
  switchAccount, 
  removeAccount as removeAccountFromStorage,
  logoutAll,
  type Account
} from '../utils/multiAccountStorage'

const router = useRouter()
const showDropdown = ref(false)
const currentAccount = ref<Account | null>(null)
const allAccounts = ref<Account[]>([])

// 刷新账号列表
const refreshAccounts = () => {
  currentAccount.value = getCurrentAccount()
  allAccounts.value = getAllAccounts()
}

// 切换账号
const switchToAccount = (account: Account) => {
  if (account.id === currentAccount.value?.id) {
    showDropdown.value = false
    return
  }
  
  switchAccount(account.id)
  refreshAccounts()
  showDropdown.value = false
  
  // 根据角色跳转到对应页面
  if (account.role === 'teacher') {
    router.push('/teacher/dashboard')
  } else {
    router.push('/student/dashboard')
  }
  
  // 刷新页面以应用新账号
  window.location.reload()
}

// 移除账号
const removeAccount = (accountId: string) => {
  if (confirm('确定要移除这个账号吗？')) {
    removeAccountFromStorage(accountId)
    refreshAccounts()
    
    // 如果移除的是当前账号，跳转到登录页
    if (accountId === currentAccount.value?.id) {
      router.push('/login')
    }
  }
}

// 退出所有账号
const logoutAllAccounts = () => {
  if (confirm('确定要退出所有账号吗？')) {
    logoutAll()
    router.push('/login')
  }
}

// 跳转到登录页添加新账号
const goToLogin = () => {
  showDropdown.value = false
  router.push('/login')
}

// 切换下拉菜单
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    refreshAccounts()
  }
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.account-switcher')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  refreshAccounts()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.account-switcher {
  position: relative;
}

.current-account {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.current-account:hover {
  background: rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar svg {
  width: 20px;
  height: 20px;
  color: white;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.role {
  font-size: 12px;
  color: #6b7280;
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  color: #6b7280;
  transition: transform 0.2s;
  margin-left: 4px;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.account-count {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 10px;
}

.account-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.account-item:hover {
  background: #f3f4f6;
}

.account-item.active {
  background: #ecfdf5;
  border: 1px solid #14b8a6;
}

.account-item.active .name {
  color: #0d9488;
}

.account-item .account-info {
  flex: 1;
}

.account-item .username {
  font-size: 12px;
  color: #9ca3af;
}

.role-badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.role-badge.teacher {
  background: #dbeafe;
  color: #1d4ed8;
}

.role-badge.student {
  background: #d1fae5;
  color: #047857;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
}

.account-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: #fee2e2;
}

.remove-btn svg {
  width: 14px;
  height: 14px;
  color: #ef4444;
}

.dropdown-footer {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.add-account-btn,
.logout-all-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.add-account-btn {
  background: #14b8a6;
  color: white;
}

.add-account-btn:hover {
  background: #0d9488;
}

.logout-all-btn {
  background: #fee2e2;
  color: #ef4444;
}

.logout-all-btn:hover {
  background: #fecaca;
}

.add-account-btn svg,
.logout-all-btn svg {
  width: 16px;
  height: 16px;
}

/* 滚动条样式 */
.account-list::-webkit-scrollbar {
  width: 6px;
}

.account-list::-webkit-scrollbar-track {
  background: transparent;
}

.account-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.account-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>

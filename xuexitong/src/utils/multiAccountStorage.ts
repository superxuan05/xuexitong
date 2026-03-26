// 多账号管理系统 - 支持同时登录多个账号并快速切换

const ACCOUNTS_KEY = 'multi_accounts'
const CURRENT_ACCOUNT_KEY = 'current_account_id'

export interface Account {
  id: string
  username: string
  name: string
  role: 'student' | 'teacher'
  token: string
  avatar?: string
  lastLogin: string
}

// 获取所有已登录的账号
export const getAllAccounts = (): Account[] => {
  const accountsStr = localStorage.getItem(ACCOUNTS_KEY)
  if (accountsStr) {
    try {
      return JSON.parse(accountsStr)
    } catch {
      return []
    }
  }
  return []
}

// 保存所有账号
export const saveAllAccounts = (accounts: Account[]) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

// 添加或更新账号
export const addAccount = (accountData: Omit<Account, 'id' | 'lastLogin'>): Account => {
  const accounts = getAllAccounts()
  
  // 检查是否已存在该账号
  const existingIndex = accounts.findIndex(a => a.username === accountData.username)
  
  const newAccount: Account = {
    ...accountData,
    id: existingIndex >= 0 ? accounts[existingIndex]!.id : Date.now().toString(),
    lastLogin: new Date().toISOString()
  }
  
  if (existingIndex >= 0) {
    // 更新现有账号
    accounts[existingIndex] = newAccount
  } else {
    // 添加新账号
    accounts.push(newAccount)
  }
  
  saveAllAccounts(accounts)
  return newAccount
}

// 移除账号
export const removeAccount = (accountId: string) => {
  const accounts = getAllAccounts()
  const filtered = accounts.filter(a => a.id !== accountId)
  saveAllAccounts(filtered)
  
  // 如果删除的是当前账号，清除当前账号
  const currentId = getCurrentAccountId()
  if (currentId === accountId) {
    localStorage.removeItem(CURRENT_ACCOUNT_KEY)
  }
}

// 设置当前账号
export const setCurrentAccount = (accountId: string) => {
  localStorage.setItem(CURRENT_ACCOUNT_KEY, accountId)
}

// 获取当前账号ID
export const getCurrentAccountId = (): string | null => {
  return localStorage.getItem(CURRENT_ACCOUNT_KEY)
}

// 获取当前账号信息
export const getCurrentAccount = (): Account | null => {
  const currentId = getCurrentAccountId()
  if (!currentId) return null
  
  const accounts = getAllAccounts()
  return accounts.find(a => a.id === currentId) || null
}

// 获取当前账号的token
export const getToken = (): string | null => {
  const current = getCurrentAccount()
  return current?.token || null
}

// 获取当前用户信息（兼容旧代码）
export const getCurrentUser = () => {
  const current = getCurrentAccount()
  if (!current) return null
  
  return {
    id: current.id,
    username: current.username,
    name: current.name,
    role: current.role,
    token: current.token
  }
}

// 登录新账号
export const login = (userData: any) => {
  const account = addAccount({
    username: userData.username,
    name: userData.name,
    role: userData.role,
    token: userData.token,
    avatar: userData.avatar
  })
  
  // 设置为当前账号
  setCurrentAccount(account.id)
  return account
}

// 登出当前账号
export const logout = () => {
  const currentId = getCurrentAccountId()
  if (currentId) {
    removeAccount(currentId)
  }
}

// 登出所有账号
export const logoutAll = () => {
  localStorage.removeItem(ACCOUNTS_KEY)
  localStorage.removeItem(CURRENT_ACCOUNT_KEY)
}

// 切换到其他账号
export const switchAccount = (accountId: string): boolean => {
  const accounts = getAllAccounts()
  const account = accounts.find(a => a.id === accountId)
  if (account) {
    setCurrentAccount(accountId)
    return true
  }
  return false
}

// 获取其他已登录的账号（排除当前账号）
export const getOtherAccounts = (): Account[] => {
  const currentId = getCurrentAccountId()
  const accounts = getAllAccounts()
  return accounts.filter(a => a.id !== currentId)
}

// 更新账号token
export const updateAccountToken = (accountId: string, newToken: string) => {
  const accounts = getAllAccounts()
  const account = accounts.find(a => a.id === accountId)
  if (account) {
    account.token = newToken
    saveAllAccounts(accounts)
  }
}

// 多账号存储管理工具
const CURRENT_USER_KEY = 'current_user'

// 获取当前登录用户
export const getCurrentUser = () => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY)
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

// 设置当前登录用户
export const setCurrentUser = (user: any) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
}

// 获取当前用户的token
export const getToken = () => {
  const user = getCurrentUser()
  return user?.token || null
}

// 获取当前用户的用户名
export const getCurrentUsername = () => {
  const user = getCurrentUser()
  return user?.username || null
}

// 登录 - 保存用户信息
export const login = (userData: any) => {
  // 保存当前用户信息
  setCurrentUser({
    id: userData.id,
    username: userData.username,
    role: userData.role,
    name: userData.name,
    token: userData.token
  })
  
  // 同时保存到用户历史列表
  const userHistory = getUserHistory()
  const existingIndex = userHistory.findIndex((u: any) => u.username === userData.username)
  
  if (existingIndex >= 0) {
    // 更新已有用户
    userHistory[existingIndex] = {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      name: userData.name,
      lastLogin: new Date().toISOString()
    }
  } else {
    // 添加新用户
    userHistory.push({
      id: userData.id,
      username: userData.username,
      role: userData.role,
      name: userData.name,
      lastLogin: new Date().toISOString()
    })
  }
  
  localStorage.setItem('user_history', JSON.stringify(userHistory))
}

// 登出
export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY)
}

// 获取用户登录历史
export const getUserHistory = () => {
  const historyStr = localStorage.getItem('user_history')
  if (historyStr) {
    try {
      return JSON.parse(historyStr)
    } catch {
      return []
    }
  }
  return []
}

// 切换到其他账号
export const switchAccount = (username: string) => {
  const userHistory = getUserHistory()
  const user = userHistory.find((u: any) => u.username === username)
  if (user) {
    setCurrentUser(user)
    return true
  }
  return false
}

// 清除所有登录信息
export const clearAllAccounts = () => {
  localStorage.removeItem(CURRENT_USER_KEY)
  localStorage.removeItem('user_history')
}

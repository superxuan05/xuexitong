// 使用 sessionStorage 实现标签页级别的登录隔离
// 每个浏览器标签页可以独立登录不同账号，不会互相覆盖

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

// 获取token
export const getToken = (): string | null => {
  return sessionStorage.getItem(TOKEN_KEY)
}

// 设置token
export const setToken = (token: string) => {
  sessionStorage.setItem(TOKEN_KEY, token)
}

// 获取用户信息
export const getCurrentUser = () => {
  const userStr = sessionStorage.getItem(USER_KEY)
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

// 设置用户信息
export const setCurrentUser = (user: any) => {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

// 登录
export const login = (userData: any) => {
  setToken(userData.token)
  setCurrentUser({
    id: userData.id,
    username: userData.username,
    name: userData.name,
    role: userData.role,
    avatar: userData.avatar
  })
}

// 登出
export const logout = () => {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

// 清除所有登录信息
export const clearAll = () => {
  sessionStorage.clear()
}


import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/vue/login.vue'
import Ele from '@/vue/ele.vue'
import Dep from '@/vue/dep.vue'
import Student from '@/vue/student.vue'
import Class from '@/vue/class.vue'
import AdminManager from '@/vue/adminManager.vue'
import { ElMessage } from 'element-plus'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login, meta: { requiresAuth: false } },
  
  // 系统管理员（admin）专属页面
  { 
    path: '/adminManager', 
    component: AdminManager, 
    meta: { 
      requiresAuth: true, 
      requiredRoles: ['admin'] // 仅admin可访问
    } 
  },
  
  // 普通管理员（normal）专属页面，admin禁止访问（避免403）
  { path: '/dep', component: Dep, meta: { requiresAuth: true, requiredRoles: ['normal'] } },
  { path: '/ele', component: Ele, meta: { requiresAuth: true, requiredRoles: ['normal'] } },
  { path: '/student', component: Student, meta: { requiresAuth: true, requiredRoles: ['normal'] } },
  { path: '/class', component: Class, meta: { requiresAuth: true, requiredRoles: ['normal'] } },
   {
        path: '/personalCenter',
        name: 'PersonalCenter',
        component: () => import('@/vue/PersonalCenter.vue'),
        meta: { title: '个人中心' }
      },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫：最终版权限控制
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta?.requiresAuth === true
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')

  // 调试日志
  console.log('===== 路由守卫 =====')
  console.log('当前token：', token)
  console.log('当前用户角色：', userRole)
  console.log('目标路径：', to.path)
  console.log('目标页面需要的角色：', to.meta.requiredRoles)

  // 1. 无需登录的页面：直接放行（如登录页）
  if (!requiresAuth) {
    next()
    return
  }

  // 2. 未登录：跳登录页
  if (!token || token === 'undefined' || token === 'null') {
    ElMessage.warning('请先登录！')
    next({ path: '/login', replace: true })
    return
  }

  // 3. 已登录但无角色：强制登出
  if (!userRole || userRole === 'undefined' || userRole === 'null') {
    ElMessage.error('未获取到用户角色，请重新登录！')
    localStorage.clear()
    next({ path: '/login', replace: true })
    return
  }

  // 4. 核心权限校验
  const requiredRoles = to.meta.requiredRoles || []
  if (requiredRoles.includes(userRole)) {
    // 权限匹配，放行
    next()
  } else {
    // 权限不匹配：精准提示+跳转
    ElMessage.error(`当前角色【${userRole}】无权限访问【${to.path}】，已自动跳转至专属页面`)
    if (userRole === 'admin') {
      // 系统管理员跳专属页面
      next({ path: '/adminManager', replace: true })
    } else if (userRole === 'normal') {
      // 普通管理员跳业务首页
      next({ path: '/student', replace: true })
    } else {
      // 未知角色登出
      localStorage.clear()
      next({ path: '/login', replace: true })
    }
  }
})

export default router
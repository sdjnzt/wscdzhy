<template>
  <el-container class="app-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <span>微山创达智慧园区</span>
      </div>
      
      <el-menu
        :default-active="route.path"
        class="el-menu-vertical"
        router
        background-color="#001529"
        text-color="rgba(255,255,255,0.65)"
        active-text-color="#fff">
        <el-menu-item index="/welcome">
          <el-icon><HomeFilled /></el-icon>
          <span>欢迎</span>
        </el-menu-item>
        <el-menu-item index="/command">
          <el-icon><Operation /></el-icon>
          <span>指挥调度</span>
        </el-menu-item>
        <el-menu-item index="/video">
          <el-icon><VideoCamera /></el-icon>
          <span>视频监控</span>
        </el-menu-item>
        <el-menu-item index="/face">
          <el-icon><User /></el-icon>
          <span>人脸识别</span>
        </el-menu-item>
        <el-menu-item index="/access">
          <el-icon><Key /></el-icon>
          <span>门禁管理</span>
        </el-menu-item>
        <el-menu-item index="/vehicle">
          <el-icon><Van /></el-icon>
          <span>车辆道闸</span>
        </el-menu-item>
        <el-menu-item index="/visitor">
          <el-icon><UserFilled /></el-icon>
          <span>访客系统</span>
        </el-menu-item>
        <el-menu-item index="/broadcast">
          <el-icon><Microphone /></el-icon>
          <span>公共广播</span>
        </el-menu-item>
        <el-menu-item index="/card">
          <el-icon><CreditCard /></el-icon>
          <span>刷卡识别</span>
        </el-menu-item>
        <el-menu-item index="/patrol">
          <el-icon><Position /></el-icon>
          <span>电子巡更</span>
        </el-menu-item>
        <el-menu-item index="/meeting">
          <el-icon><Connection /></el-icon>
          <span>智慧会议</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="toggle-sidebar" @click="toggleSidebar">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentRoute }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
              <span>管理员</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人信息</el-dropdown-item>
                <el-dropdown-item>修改密码</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view :key="route.path"></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  DataBoard,
  VideoCamera,
  Connection,
  Warning,
  Fold,
  Expand,
  Share,
  Document,
  Operation,
  DataAnalysis,
  HomeFilled,
  User,
  Key,
  Van,
  UserFilled,
  Microphone,
  CreditCard,
  Position
} from '@element-plus/icons-vue'

const route = useRoute()
const isCollapse = ref(false)

const currentRoute = computed(() => {
  const routeMap = {
    '/welcome': '欢迎',
    '/command': '指挥调度',
    '/video': '视频监控',
    '/face': '人脸识别',
    '/access': '门禁管理',
    '/vehicle': '车辆道闸',
    '/visitor': '访客系统',
    '/broadcast': '公共广播',
    '/card': '刷卡识别',
    '/patrol': '电子巡更',
    '/meeting': '智慧会议'
  }
  return routeMap[route.path] || '首页'
})

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style>
:root {
  --primary-color: #409EFF;
  --menu-bg-color: #001529;
  --header-height: 60px;
  --aside-width: 220px;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

#app {
  height: 100%;
}

.app-container {
  height: 100%;
}

.aside {
  background-color: var(--menu-bg-color);
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #001529;
  border-bottom: 1px solid #101f3c;
}

.logo img {
  height: 32px;
  margin-right: 12px;
}

.header {
  background: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: var(--header-height);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toggle-sidebar {
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}

.el-menu {
  border-right: none;
}

.el-menu-item {
  height: 50px;
  line-height: 50px;
}

.el-menu-item.is-active {
  background-color: var(--primary-color) !important;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 菜单样式优化 */
.side-menu {
  border-right: none;
}

.side-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
  margin: 4px 0;
}

.side-menu .el-menu-item:hover {
  background-color: #1890ff15 !important;
  color: #fff !important;
}

/* 选中状态样式 */
.side-menu .el-menu-item.is-active {
  background: linear-gradient(90deg, #1890ff 0%, #1890ff15 100%) !important;
  border-right: 3px solid #1890ff;
  color: #fff !important;
}

.side-menu .el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #1890ff;
}

/* 图标样式 */
.side-menu .el-menu-item .el-icon {
  margin-right: 10px;
  font-size: 18px;
  vertical-align: middle;
}

/* 优化过渡效果 */
.el-menu-item {
  transition: all 0.3s ease !important;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: #1890ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-right: 12px;
}
</style>

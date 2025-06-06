<template>
  <div class="system-settings">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="settings-menu">
          <template #header>
            <div class="card-header">
              <span>系统设置</span>
            </div>
          </template>
          <el-menu
            :default-active="activeMenu"
            @select="handleMenuSelect">
            <el-menu-item index="basic">
              <el-icon><Setting /></el-icon>
              <span>基本设置</span>
            </el-menu-item>
            <el-menu-item index="security">
              <el-icon><Lock /></el-icon>
              <span>安全设置</span>
            </el-menu-item>
            <el-menu-item index="notification">
              <el-icon><Bell /></el-icon>
              <span>通知设置</span>
            </el-menu-item>
            <el-menu-item index="backup">
              <el-icon><Download /></el-icon>
              <span>备份设置</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>
      
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ settingTitle }}</span>
            </div>
          </template>
          
          <!-- 基本设置 -->
          <div v-if="activeMenu === 'basic'" class="setting-content">
            <el-form :model="basicForm" label-width="120px">
              <el-form-item label="系统名称">
                <el-input v-model="basicForm.systemName" />
              </el-form-item>
              <el-form-item label="系统Logo">
                <el-upload
                  class="logo-uploader"
                  action="#"
                  :show-file-list="false"
                  :auto-upload="false">
                  <img v-if="basicForm.logo" :src="basicForm.logo" class="logo" />
                  <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
                </el-upload>
              </el-form-item>
              <el-form-item label="系统主题">
                <el-color-picker v-model="basicForm.theme" />
              </el-form-item>
              <el-form-item label="系统语言">
                <el-select v-model="basicForm.language">
                  <el-option label="中文" value="zh" />
                  <el-option label="English" value="en" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <!-- 安全设置 -->
          <div v-if="activeMenu === 'security'" class="setting-content">
            <el-form :model="securityForm" label-width="120px">
              <el-form-item label="密码有效期">
                <el-input-number v-model="securityForm.passwordExpiry" :min="30" :max="180" />
                <span class="unit">天</span>
              </el-form-item>
              <el-form-item label="登录失败锁定">
                <el-switch v-model="securityForm.loginLock" />
              </el-form-item>
              <el-form-item label="失败次数">
                <el-input-number 
                  v-model="securityForm.maxFailures" 
                  :min="3" 
                  :max="10"
                  :disabled="!securityForm.loginLock" />
                <span class="unit">次</span>
              </el-form-item>
              <el-form-item label="锁定时间">
                <el-input-number 
                  v-model="securityForm.lockDuration" 
                  :min="5" 
                  :max="60"
                  :disabled="!securityForm.loginLock" />
                <span class="unit">分钟</span>
              </el-form-item>
            </el-form>
          </div>

          <!-- 通知设置 -->
          <div v-if="activeMenu === 'notification'" class="setting-content">
            <el-form :model="notificationForm" label-width="120px">
              <el-form-item label="告警通知">
                <el-switch v-model="notificationForm.alarmNotification" />
              </el-form-item>
              <el-form-item label="通知方式">
                <el-checkbox-group v-model="notificationForm.notifyMethods">
                  <el-checkbox label="email">邮件</el-checkbox>
                  <el-checkbox label="sms">短信</el-checkbox>
                  <el-checkbox label="weixin">微信</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="通知时间">
                <el-time-picker
                  v-model="notificationForm.notifyStartTime"
                  format="HH:mm"
                  placeholder="开始时间" />
                <span class="separator">至</span>
                <el-time-picker
                  v-model="notificationForm.notifyEndTime"
                  format="HH:mm"
                  placeholder="结束时间" />
              </el-form-item>
            </el-form>
          </div>

          <!-- 备份设置 -->
          <div v-if="activeMenu === 'backup'" class="setting-content">
            <el-form :model="backupForm" label-width="120px">
              <el-form-item label="自动备份">
                <el-switch v-model="backupForm.autoBackup" />
              </el-form-item>
              <el-form-item label="备份周期">
                <el-select 
                  v-model="backupForm.backupCycle"
                  :disabled="!backupForm.autoBackup">
                  <el-option label="每天" value="daily" />
                  <el-option label="每周" value="weekly" />
                  <el-option label="每月" value="monthly" />
                </el-select>
              </el-form-item>
              <el-form-item label="备份时间">
                <el-time-picker
                  v-model="backupForm.backupTime"
                  format="HH:mm"
                  :disabled="!backupForm.autoBackup"
                  placeholder="选择时间" />
              </el-form-item>
              <el-form-item label="保留时间">
                <el-input-number
                  v-model="backupForm.retentionDays"
                  :min="7"
                  :max="180"
                  :disabled="!backupForm.autoBackup" />
                <span class="unit">天</span>
              </el-form-item>
            </el-form>
          </div>

          <div class="form-footer">
            <el-button type="primary" @click="handleSave">保存设置</el-button>
            <el-button @click="handleReset">重置</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Setting,
  Lock,
  Bell,
  Download,
  Plus
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const activeMenu = ref('basic')

// 设置标题映射
const settingTitles = {
  basic: '基本设置',
  security: '安全设置',
  notification: '通知设置',
  backup: '备份设置'
}

const settingTitle = computed(() => settingTitles[activeMenu.value])

// 基本设置表单
const basicForm = ref({
  systemName: '智慧社区平台',
  logo: '',
  theme: '#409EFF',
  language: 'zh'
})

// 安全设置表单
const securityForm = ref({
  passwordExpiry: 90,
  loginLock: true,
  maxFailures: 5,
  lockDuration: 30
})

// 通知设置表单
const notificationForm = ref({
  alarmNotification: true,
  notifyMethods: ['email', 'sms'],
  notifyStartTime: new Date(2000, 0, 1, 8, 0),
  notifyEndTime: new Date(2000, 0, 1, 22, 0)
})

// 备份设置表单
const backupForm = ref({
  autoBackup: true,
  backupCycle: 'daily',
  backupTime: new Date(2000, 0, 1, 2, 0),
  retentionDays: 30
})

// 菜单选择
const handleMenuSelect = (index) => {
  activeMenu.value = index
}

// 保存设置
const handleSave = () => {
  ElMessage.success('设置已保存')
}

// 重置设置
const handleReset = () => {
  ElMessageBox.confirm(
    '确定要重置当前设置吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    ElMessage.success('设置已重置')
  })
}
</script>

<style scoped>
.system-settings {
  padding: 20px;
}

.settings-menu {
  margin-bottom: 20px;
}

.setting-content {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-footer {
  margin-top: 20px;
  text-align: center;
}

.logo-uploader {
  text-align: center;
}

.logo {
  width: 200px;
  height: 60px;
  object-fit: contain;
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 200px;
  height: 60px;
  line-height: 60px;
  text-align: center;
  border: 1px dashed #d9d9d9;
}

.logo-uploader-icon:hover {
  border-color: var(--el-color-primary);
}

.unit {
  margin-left: 8px;
  color: #666;
}

.separator {
  margin: 0 8px;
  color: #666;
}

.el-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style> 
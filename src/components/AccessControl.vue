<template>
  <div class="access-control">
    <el-row :gutter="20">
      <!-- 左侧设备列表 -->
      <el-col :span="6">
        <el-card class="device-list">
          <template #header>
            <div class="card-header">
              <span>门禁设备</span>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索设备"
                prefix-icon="Search"
                clearable
                @clear="handleSearch"
                @input="handleSearch"
              />
            </div>
          </template>
          <el-scrollbar height="calc(100vh - 200px)">
            <el-tree
              :data="deviceGroups"
              :props="defaultProps"
              @node-click="handleNodeClick"
              highlight-current
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <span v-if="data.type === 'device'" class="device-status">
                    <el-tag size="small" :type="data.status === 'online' ? 'success' : 'danger'">
                      {{ data.status === 'online' ? '在线' : '离线' }}
                    </el-tag>
                  </span>
                </div>
              </template>
            </el-tree>
          </el-scrollbar>
        </el-card>
      </el-col>

      <!-- 右侧内容区域 -->
      <el-col :span="18">
        <el-tabs v-model="activeTab" class="content-tabs">
          <!-- 设备信息 -->
          <el-tab-pane label="设备信息" name="device">
            <el-card v-if="currentDevice">
              <template #header>
                <div class="card-header">
                  <span>设备详情</span>
                  <div class="header-actions">
                    <el-button-group>
                      <el-button type="primary" :icon="VideoPlay" @click="handleRemoteOpen">远程开门</el-button>
                      <el-button type="warning" :icon="Setting" @click="showSettings = true">设备设置</el-button>
                    </el-button-group>
                  </div>
                </div>
              </template>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="设备名称">{{ currentDevice.name }}</el-descriptions-item>
                <el-descriptions-item label="设备编号">{{ currentDevice.id }}</el-descriptions-item>
                <el-descriptions-item label="设备类型">{{ currentDevice.type }}</el-descriptions-item>
                <el-descriptions-item label="安装位置">{{ currentDevice.location }}</el-descriptions-item>
                <el-descriptions-item label="在线状态">
                  <el-tag :type="currentDevice.status === 'online' ? 'success' : 'danger'">
                    {{ currentDevice.status === 'online' ? '在线' : '离线' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="最后心跳">{{ currentDevice.lastHeartbeat }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-tab-pane>

          <!-- 权限管理 -->
          <el-tab-pane label="权限管理" name="permission">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>权限列表</span>
                  <el-button type="primary" @click="handleAddPermission">添加权限</el-button>
                </div>
              </template>
              <el-table :data="permissionList" style="width: 100%">
                <el-table-column prop="name" label="人员姓名" />
                <el-table-column prop="type" label="人员类型" />
                <el-table-column prop="cardNo" label="卡号" />
                <el-table-column prop="validTime" label="有效期" />
                <el-table-column prop="accessTime" label="通行时段" />
                <el-table-column label="操作" width="200">
                  <template #default="scope">
                    <el-button-group>
                      <el-button type="primary" size="small" @click="handleEditPermission(scope.row)">编辑</el-button>
                      <el-button type="danger" size="small" @click="handleDeletePermission(scope.row)">删除</el-button>
                    </el-button-group>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>

          <!-- 开门记录 -->
          <el-tab-pane label="开门记录" name="records">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>开门记录</span>
                  <div class="header-actions">
                    <el-date-picker
                      v-model="dateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      @change="handleDateChange"
                    />
                    <el-button type="primary" :icon="Download" @click="handleExport">导出记录</el-button>
                  </div>
                </div>
              </template>
              <el-table :data="accessRecords" style="width: 100%">
                <el-table-column prop="time" label="开门时间" width="180" />
                <el-table-column prop="name" label="人员姓名" />
                <el-table-column prop="type" label="开门方式" />
                <el-table-column prop="device" label="设备名称" />
                <el-table-column prop="status" label="开门状态">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
                      {{ scope.row.status === 'success' ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="total"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>

    <!-- 设备设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="设备设置"
      width="50%"
      destroy-on-close
    >
      <el-form :model="deviceSettings" label-width="120px">
        <el-form-item label="设备名称">
          <el-input v-model="deviceSettings.name" />
        </el-form-item>
        <el-form-item label="开门方式">
          <el-checkbox-group v-model="deviceSettings.openMethods">
            <el-checkbox label="card">刷卡</el-checkbox>
            <el-checkbox label="face">人脸</el-checkbox>
            <el-checkbox label="password">密码</el-checkbox>
            <el-checkbox label="remote">远程</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="开门延时(秒)">
          <el-input-number v-model="deviceSettings.delay" :min="0" :max="30" />
        </el-form-item>
        <el-form-item label="报警设置">
          <el-switch v-model="deviceSettings.alarmEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  VideoPlay,
  Setting,
  Search,
  Download
} from '@element-plus/icons-vue'

// 搜索关键词
const searchKeyword = ref('')

// 当前选中的设备
const currentDevice = ref(null)

// 标签页
const activeTab = ref('device')

// 日期范围
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 对话框控制
const showSettings = ref(false)

// 设备分组数据
const deviceGroups = ref([
  {
    label: '行政楼门禁',
    children: [
      {
        label: '行政楼正门',
        type: 'device',
        status: 'online',
        id: 'XZ001',
        name: '行政楼正门门禁',
        location: '行政楼1层',
        lastHeartbeat: '2025-05-20 08:30:00'
      },
      {
        label: '行政楼侧门',
        type: 'device',
        status: 'online',
        id: 'XZ002',
        name: '行政楼侧门门禁',
        location: '行政楼1层',
        lastHeartbeat: '2025-05-20 08:30:00'
      },
      {
        label: '行政楼办公区',
        type: 'device',
        status: 'online',
        id: 'XZ003',
        name: '行政楼办公区门禁',
        location: '行政楼2层',
        lastHeartbeat: '2025-05-20 08:30:00'
      }
    ]
  },
  {
    label: '研发楼门禁',
    children: [
      {
        label: '研发楼正门',
        type: 'device',
        status: 'online',
        id: 'YF001',
        name: '研发楼正门门禁',
        location: '研发楼1层',
        lastHeartbeat: '2024-03-20 08:30:00'
      },
      {
        label: '研发中心',
        type: 'device',
        status: 'online',
        id: 'YF002',
        name: '研发中心门禁',
        location: '研发楼3层',
        lastHeartbeat: '2024-03-20 08:30:00'
      },
      {
        label: '实验室',
        type: 'device',
        status: 'online',
        id: 'YF003',
        name: '实验室门禁',
        location: '研发楼4层',
        lastHeartbeat: '2024-03-20 08:30:00'
      }
    ]
  },
  {
    label: '生产楼门禁',
    children: [
      {
        label: '生产楼正门',
        type: 'device',
        status: 'online',
        id: 'SC001',
        name: '生产楼正门门禁',
        location: '生产楼1层',
        lastHeartbeat: '2024-03-20 08:30:00'
      },
      {
        label: '生产车间',
        type: 'device',
        status: 'online',
        id: 'SC002',
        name: '生产车间门禁',
        location: '生产楼2层',
        lastHeartbeat: '2024-03-20 08:30:00'
      },
      {
        label: '物料仓库',
        type: 'device',
        status: 'online',
        id: 'SC003',
        name: '物料仓库门禁',
        location: '生产楼1层',
        lastHeartbeat: '2024-03-20 08:30:00'
      }
    ]
  }
])

// 树形配置
const defaultProps = {
  children: 'children',
  label: 'label'
}

// 权限列表
const permissionList = ref([
  {
    name: '张明',
    type: '正式员工',
    cardNo: 'EMP2025001',
    validTime: '2025-01-01 至 2025-12-31',
    accessTime: '工作日 08:30-18:00'
  },
  {
    name: '李华',
    type: '正式员工',
    cardNo: 'EMP2025002',
    validTime: '2025-01-01 至 2025-12-31',
    accessTime: '工作日 08:30-18:00'
  },
  {
    name: '王强',
    type: '研发主管',
    cardNo: 'EMP2024001',
    validTime: '2025-01-01 至 2025-12-31',
    accessTime: '全天'
  },
  {
    name: '赵敏',
    type: '生产主管',
    cardNo: 'EMP2024002',
    validTime: '2025-01-01 至 2025-12-31',
    accessTime: '全天'
  },
  {
    name: '陈工',
    type: '供应商',
    cardNo: 'SUP2025001',
    validTime: '2025-05-20 至 2025-05-20',
    accessTime: '09:00-17:00'
  },
  {
    name: '刘工',
    type: '供应商',
    cardNo: 'SUP2025002',
    validTime: '2025-05-20 至 2025-05-20',
    accessTime: '09:00-17:00'
  }
])

// 开门记录
const accessRecords = ref([
  {
    time: '2024-03-20 08:25:00',
    name: '张明',
    type: '人脸',
    device: '行政楼正门门禁',
    status: 'success'
  },
  {
    time: '2024-03-20 08:26:00',
    name: '李华',
    type: '人脸',
    device: '行政楼正门门禁',
    status: 'success'
  },
  {
    time: '2024-03-20 08:27:00',
    name: '王强',
    type: '人脸',
    device: '研发楼正门门禁',
    status: 'success'
  },
  {
    time: '2024-03-20 08:28:00',
    name: '赵敏',
    type: '人脸',
    device: '生产楼正门门禁',
    status: 'success'
  },
  {
    time: '2024-03-20 09:00:00',
    name: '陈工',
    type: '访客码',
    device: '行政楼正门门禁',
    status: 'success'
  },
  {
    time: '2024-03-20 09:05:00',
    name: '刘工',
    type: '访客码',
    device: '行政楼正门门禁',
    status: 'success'
  },
  {
    time: '2024-03-20 09:10:00',
    name: '未知人员',
    type: '人脸',
    device: '研发楼正门门禁',
    status: 'failed'
  },
  {
    time: '2024-03-20 09:15:00',
    name: '张明',
    type: '人脸',
    device: '行政楼办公区门禁',
    status: 'success'
  },
  {
    time: '2024-03-20 09:20:00',
    name: '王强',
    type: '人脸',
    device: '研发中心门禁',
    status: 'success'
  },
  {
    time: '2024-03-20 09:25:00',
    name: '赵敏',
    type: '人脸',
    device: '生产车间门禁',
    status: 'success'
  }
])

// 设备设置
const deviceSettings = ref({
  name: '',
  openMethods: ['card', 'face'],
  delay: 5,
  alarmEnabled: true
})

// 处理节点点击
const handleNodeClick = (data) => {
  if (data.type === 'device') {
    currentDevice.value = data
    deviceSettings.value.name = data.name
  }
}

// 处理搜索
const handleSearch = () => {
  console.log('搜索关键词:', searchKeyword.value)
}

// 远程开门
const handleRemoteOpen = () => {
  console.log('远程开门:', currentDevice.value)
}

// 添加权限
const handleAddPermission = () => {
  console.log('添加权限')
}

// 编辑权限
const handleEditPermission = (permission) => {
  console.log('编辑权限:', permission)
}

// 删除权限
const handleDeletePermission = (permission) => {
  console.log('删除权限:', permission)
}

// 处理日期变化
const handleDateChange = (val) => {
  console.log('日期范围:', val)
}

// 导出记录
const handleExport = () => {
  console.log('导出记录')
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  console.log('每页条数:', val)
}

// 处理页码变化
const handleCurrentChange = (val) => {
  console.log('当前页:', val)
}

// 保存设置
const saveSettings = () => {
  console.log('保存设置:', deviceSettings.value)
  showSettings.value = false
}
</script>

<style scoped>
.access-control {
  padding: 20px;
  background-color: #f5f7fa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.device-list {
  height: calc(100vh - 100px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.content-tabs {
  height: calc(100vh - 100px);
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
  transition: all 0.3s;
}

.custom-tree-node:hover {
  background-color: #f5f7fa;
}

.device-status {
  margin-left: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

:deep(.el-card) {
  margin-bottom: 20px;
  border-radius: 8px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-tabs__nav) {
  border-radius: 8px 8px 0 0;
}

:deep(.el-descriptions) {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
}
</style> 
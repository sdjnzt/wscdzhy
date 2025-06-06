<template>
  <div class="vehicle-control">
    <el-row :gutter="20">
      <!-- 左侧道闸设备列表 -->
      <el-col :span="6">
        <el-card class="device-list">
          <template #header>
            <div class="card-header">
              <span>道闸设备</span>
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
          <!-- 实时监控 -->
          <el-tab-pane label="实时监控" name="monitor">
            <el-row :gutter="20">
              <el-col :span="16">
                <el-card class="video-card">
                  <template #header>
                    <div class="card-header">
                      <span>实时画面</span>
                      <div class="header-actions">
                        <el-button-group>
                          <el-button type="primary" :icon="VideoPlay" @click="startMonitoring">开始监控</el-button>
                          <el-button type="danger" :icon="VideoPause" @click="stopMonitoring">停止监控</el-button>
                        </el-button-group>
                      </div>
                    </div>
                  </template>
                  <div class="video-container">
                    <div class="video-player">
                      <div class="video-placeholder">
                        <el-icon :size="48"><VideoCamera /></el-icon>
                        <p>实时监控画面</p>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="recognition-card">
                  <template #header>
                    <div class="card-header">
                      <span>识别结果</span>
                    </div>
                  </template>
                  <div class="recognition-content" v-if="currentRecognition">
                    <div class="plate-image">
                      <el-image :src="currentRecognition.plateImage" fit="cover" />
                    </div>
                    <div class="plate-info">
                      <p><strong>车牌号：</strong>{{ currentRecognition.plateNumber }}</p>
                      <p><strong>车辆类型：</strong>{{ currentRecognition.vehicleType }}</p>
                      <p><strong>识别时间：</strong>{{ currentRecognition.time }}</p>
                      <p><strong>通行状态：</strong>
                        <el-tag :type="currentRecognition.status === 'success' ? 'success' : 'danger'">
                          {{ currentRecognition.status === 'success' ? '允许通行' : '禁止通行' }}
                        </el-tag>
                      </p>
                    </div>
                  </div>
                  <div v-else class="no-recognition">
                    <el-empty description="等待识别" />
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>

          <!-- 车辆管理 -->
          <el-tab-pane label="车辆管理" name="vehicles">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>车辆列表</span>
                  <div class="header-actions">
                    <el-button type="primary" @click="handleAddVehicle">添加车辆</el-button>
                    <el-button type="success" @click="handleImport">批量导入</el-button>
                  </div>
                </div>
              </template>
              <el-table :data="vehicleList" style="width: 100%">
                <el-table-column prop="plateNumber" label="车牌号" />
                <el-table-column prop="vehicleType" label="车辆类型" />
                <el-table-column prop="owner" label="车主" />
                <el-table-column prop="phone" label="联系电话" />
                <el-table-column prop="validTime" label="有效期" />
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
                      {{ scope.row.status === 'active' ? '有效' : '已过期' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                  <template #default="scope">
                    <el-button-group>
                      <el-button type="primary" size="small" @click="handleEditVehicle(scope.row)">编辑</el-button>
                      <el-button type="danger" size="small" @click="handleDeleteVehicle(scope.row)">删除</el-button>
                    </el-button-group>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>

          <!-- 通行记录 -->
          <el-tab-pane label="通行记录" name="records">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>通行记录</span>
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
              <el-table :data="passageRecords" style="width: 100%">
                <el-table-column prop="time" label="通行时间" width="180" />
                <el-table-column prop="plateNumber" label="车牌号" />
                <el-table-column prop="vehicleType" label="车辆类型" />
                <el-table-column prop="direction" label="通行方向" />
                <el-table-column prop="device" label="设备名称" />
                <el-table-column prop="status" label="通行状态">
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
        <el-form-item label="识别模式">
          <el-checkbox-group v-model="deviceSettings.recognitionModes">
            <el-checkbox label="plate">车牌识别</el-checkbox>
            <el-checkbox label="face">人脸识别</el-checkbox>
            <el-checkbox label="card">卡片识别</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="开闸延时(秒)">
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
  VideoPause,
  VideoCamera,
  Setting,
  Search,
  Download
} from '@element-plus/icons-vue'

// 搜索关键词
const searchKeyword = ref('')

// 当前选中的设备
const currentDevice = ref(null)

// 标签页
const activeTab = ref('monitor')

// 日期范围
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 对话框控制
const showSettings = ref(false)

// 当前识别结果
const currentRecognition = ref(null)

// 设备分组数据
const deviceGroups = ref([
  {
    label: 'A区道闸',
    children: [
      {
        label: 'A区入口',
        type: 'device',
        status: 'online',
        id: 'A001',
        name: 'A区入口道闸',
        location: 'A区入口',
        lastHeartbeat: '2024-03-20 10:00:00'
      },
      {
        label: 'A区出口',
        type: 'device',
        status: 'online',
        id: 'A002',
        name: 'A区出口道闸',
        location: 'A区出口',
        lastHeartbeat: '2024-03-20 10:00:00'
      }
    ]
  },
  {
    label: 'B区道闸',
    children: [
      {
        label: 'B区入口',
        type: 'device',
        status: 'offline',
        id: 'B001',
        name: 'B区入口道闸',
        location: 'B区入口',
        lastHeartbeat: '2024-03-20 09:30:00'
      }
    ]
  }
])

// 树形配置
const defaultProps = {
  children: 'children',
  label: 'label'
}

// 车辆列表
const vehicleList = ref([
  {
    plateNumber: '鲁A12345',
    vehicleType: '小型汽车',
    owner: '张三',
    phone: '13800138000',
    validTime: '2024-01-01 至 2024-12-31',
    status: 'active'
  },
  {
    plateNumber: '鲁B67890',
    vehicleType: '小型汽车',
    owner: '李四',
    phone: '13900139000',
    validTime: '2024-03-20 至 2024-03-21',
    status: 'active'
  }
])

// 通行记录
const passageRecords = ref([
  {
    time: '2024-03-20 10:00:00',
    plateNumber: '鲁A12345',
    vehicleType: '小型汽车',
    direction: '进入',
    device: 'A区入口道闸',
    status: 'success'
  },
  {
    time: '2024-03-20 10:05:00',
    plateNumber: '鲁B67890',
    vehicleType: '小型汽车',
    direction: '离开',
    device: 'A区出口道闸',
    status: 'success'
  },
  {
    time: '2024-03-20 10:10:00',
    plateNumber: '未知车牌',
    vehicleType: '未知',
    direction: '进入',
    device: 'B区入口道闸',
    status: 'failed'
  }
])

// 设备设置
const deviceSettings = ref({
  name: '',
  recognitionModes: ['plate'],
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

// 开始监控
const startMonitoring = () => {
  console.log('开始监控')
  // 模拟识别结果
  currentRecognition.value = {
    plateNumber: '鲁A12345',
    vehicleType: '小型汽车',
    time: new Date().toLocaleString(),
    status: 'success',
    plateImage: 'https://example.com/plate.jpg'
  }
}

// 停止监控
const stopMonitoring = () => {
  console.log('停止监控')
  currentRecognition.value = null
}

// 添加车辆
const handleAddVehicle = () => {
  console.log('添加车辆')
}

// 编辑车辆
const handleEditVehicle = (vehicle) => {
  console.log('编辑车辆:', vehicle)
}

// 删除车辆
const handleDeleteVehicle = (vehicle) => {
  console.log('删除车辆:', vehicle)
}

// 批量导入
const handleImport = () => {
  console.log('批量导入')
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
.vehicle-control {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.device-list {
  height: calc(100vh - 100px);
}

.content-tabs {
  height: calc(100vh - 100px);
}

.video-card {
  height: calc(100vh - 150px);
}

.recognition-card {
  height: calc(100vh - 150px);
}

.video-container {
  height: calc(100vh - 250px);
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.video-placeholder {
  color: #909399;
  text-align: center;
}

.video-placeholder .el-icon {
  margin-bottom: 10px;
}

.recognition-content {
  padding: 20px;
}

.plate-image {
  width: 100%;
  height: 120px;
  margin-bottom: 20px;
  border-radius: 4px;
  overflow: hidden;
}

.plate-info p {
  margin: 10px 0;
}

.no-recognition {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.device-status {
  margin-left: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 
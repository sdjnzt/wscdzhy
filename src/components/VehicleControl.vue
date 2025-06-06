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
          <!-- 车辆管理 -->
          <el-tab-pane label="车辆管理" name="vehicles">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>车辆列表</span>
                  <div class="header-actions">
                    <el-input
                      v-model="vehicleSearch"
                      placeholder="搜索车牌号/车主"
                      prefix-icon="Search"
                      clearable
                      style="width: 200px; margin-right: 10px;"
                    />
                    <el-button type="primary" @click="handleAddVehicle">添加车辆</el-button>
                    <el-button type="success" @click="handleImport">批量导入</el-button>
                  </div>
                </div>
              </template>
              <el-table :data="paginatedVehicleList" style="width: 100%">
                <el-table-column prop="plateNumber" label="车牌号" width="120" />
                <el-table-column prop="vehicleType" label="车辆类型" width="100" />
                <el-table-column prop="owner" label="车主" width="100" />
                <el-table-column prop="phone" label="联系电话" width="120" />
                <el-table-column prop="department" label="所属部门" width="120" />
                <el-table-column prop="validTime" label="有效期" width="180" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
                      {{ scope.row.status === 'active' ? '有效' : '已过期' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                  <template #default="scope">
                    <el-button-group>
                      <el-button type="primary" size="small" @click="handleEditVehicle(scope.row)">编辑</el-button>
                      <el-button type="danger" size="small" @click="handleDeleteVehicle(scope.row)">删除</el-button>
                    </el-button-group>
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

          <!-- 通行记录 -->
          <el-tab-pane label="通行记录" name="records">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>通行记录</span>
                  <div class="header-actions">
                    <el-input
                      v-model="recordSearch"
                      placeholder="搜索车牌号"
                      prefix-icon="Search"
                      clearable
                      style="width: 200px; margin-right: 10px;"
                    />
                    <el-date-picker
                      v-model="dateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      style="width: 300px; margin-right: 10px;"
                      @change="handleDateChange"
                    />
                    <el-button type="primary" :icon="Download" @click="handleExport">导出记录</el-button>
                  </div>
                </div>
              </template>
              <el-table :data="passageRecords" style="width: 100%">
                <el-table-column prop="time" label="通行时间" width="180" />
                <el-table-column prop="plateNumber" label="车牌号" width="120" />
                <el-table-column prop="vehicleType" label="车辆类型" width="100" />
                <el-table-column prop="direction" label="通行方向" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.direction === '进入' ? 'success' : 'warning'">
                      {{ scope.row.direction }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="device" label="设备名称" width="150" />
                <el-table-column prop="status" label="通行状态" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
                      {{ scope.row.status === 'success' ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" />
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
import { ref, computed } from 'vue'
import {
  VideoPlay,
  VideoPause,
  VideoCamera,
  Setting,
  Search,
  Download
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

// 搜索关键词
const searchKeyword = ref('')
const vehicleSearch = ref('')
const recordSearch = ref('')

// 当前选中的设备
const currentDevice = ref(null)

// 标签页
const activeTab = ref('vehicles')

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
    label: '行政楼道闸',
    children: [
      {
        label: '行政楼入口',
        type: 'device',
        status: 'online',
        id: 'XZ001',
        name: '行政楼入口道闸',
        location: '行政楼入口',
        lastHeartbeat: '2025-05-20 08:30:00'
      },
      {
        label: '行政楼出口',
        type: 'device',
        status: 'online',
        id: 'XZ002',
        name: '行政楼出口道闸',
        location: '行政楼出口',
        lastHeartbeat: '2025-05-20 08:30:00'
      }
    ]
  },
  {
    label: '研发楼道闸',
    children: [
      {
        label: '研发楼入口',
        type: 'device',
        status: 'online',
        id: 'YF001',
        name: '研发楼入口道闸',
        location: '研发楼入口',
        lastHeartbeat: '2025-05-20 08:30:00'
      },
      {
        label: '研发楼出口',
        type: 'device',
        status: 'online',
        id: 'YF002',
        name: '研发楼出口道闸',
        location: '研发楼出口',
        lastHeartbeat: '2025-05-20 08:30:00'
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
    plateNumber: '鲁A·8K123',
    vehicleType: '小型汽车',
    owner: '张明',
    phone: '13812345678',
    department: '行政部',
    validTime: '2025-05-01 至 2025-12-31',
    status: 'active'
  },
  {
    plateNumber: '鲁A·6M789',
    vehicleType: '小型汽车',
    owner: '李华',
    phone: '13987654321',
    department: '研发部',
    validTime: '2025-05-01 至 2025-12-31',
    status: 'active'
  },
  {
    plateNumber: '鲁A·5N456',
    vehicleType: '小型汽车',
    owner: '王强',
    phone: '13765432198',
    department: '市场部',
    validTime: '2025-05-01 至 2025-05-31',
    status: 'active'
  },
  {
    plateNumber: '鲁A·9P234',
    vehicleType: '小型汽车',
    owner: '赵敏',
    phone: '13698765432',
    department: '财务部',
    validTime: '2025-05-01 至 2025-12-31',
    status: 'active'
  },
  {
    plateNumber: '鲁A·7Q567',
    vehicleType: '小型汽车',
    owner: '陈工',
    phone: '13567891234',
    department: '生产部',
    validTime: '2025-05-01 至 2025-12-31',
    status: 'active'
  },
  {
    plateNumber: '鲁A·4R890',
    vehicleType: '小型汽车',
    owner: '刘工',
    phone: '13456789123',
    department: '质量部',
    validTime: '2025-05-01 至 2025-12-31',
    status: 'active'
  },
  {
    plateNumber: '鲁A·3S123',
    vehicleType: '小型汽车',
    owner: '孙工',
    phone: '13345678912',
    department: '采购部',
    validTime: '2025-05-01 至 2025-12-31',
    status: 'active'
  },
  {
    plateNumber: '鲁A·2T456',
    vehicleType: '小型汽车',
    owner: '周工',
    phone: '13234567891',
    department: '人事部',
    validTime: '2025-05-01 至 2025-12-31',
    status: 'active'
  },
  {
    plateNumber: '鲁A·1U789',
    vehicleType: '小型汽车',
    owner: '吴工',
    phone: '13123456789',
    department: '行政部',
    validTime: '2025-05-01 至 2025-12-31',
    status: 'active'
  },
  {
    plateNumber: '鲁A·0V234',
    vehicleType: '小型汽车',
    owner: '郑工',
    phone: '13012345678',
    department: '研发部',
    validTime: '2025-05-01 至 2025-12-31',
    status: 'active'
  }
])

// 通行记录
const passageRecords = ref([
  {
    time: '2025-05-20 08:25:00',
    plateNumber: '鲁A·8K123',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '行政楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 08:26:00',
    plateNumber: '鲁A·6M789',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '研发楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 08:27:00',
    plateNumber: '鲁A·5N456',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '行政楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 08:28:00',
    plateNumber: '鲁A·9P234',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '行政楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 08:29:00',
    plateNumber: '鲁A·7Q567',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '研发楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 08:30:00',
    plateNumber: '鲁A·4R890',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '研发楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 09:00:00',
    plateNumber: '鲁A·8K123',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '行政楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 09:05:00',
    plateNumber: '未知车牌',
    vehicleType: '未知',
    direction: '进入',
    device: '研发楼入口道闸',
    status: 'failed',
    remark: '未授权车辆'
  },
  {
    time: '2025-05-20 09:30:00',
    plateNumber: '鲁A·6M789',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '研发楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 10:00:00',
    plateNumber: '鲁A·5N456',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '行政楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 10:15:00',
    plateNumber: '鲁A·9P234',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '行政楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 10:30:00',
    plateNumber: '鲁A·7Q567',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '研发楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 11:00:00',
    plateNumber: '鲁A·4R890',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '研发楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 11:30:00',
    plateNumber: '鲁A·3S123',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '行政楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 11:35:00',
    plateNumber: '鲁A·2T456',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '研发楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 11:40:00',
    plateNumber: '鲁A·1U789',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '行政楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 11:45:00',
    plateNumber: '鲁A·0V234',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '研发楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 12:00:00',
    plateNumber: '鲁A·3S123',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '行政楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 12:05:00',
    plateNumber: '鲁A·2T456',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '研发楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 12:10:00',
    plateNumber: '鲁A·1U789',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '行政楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 12:15:00',
    plateNumber: '鲁A·0V234',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '研发楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 13:30:00',
    plateNumber: '鲁A·8K123',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '行政楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 13:35:00',
    plateNumber: '鲁A·6M789',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '研发楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 13:40:00',
    plateNumber: '鲁A·5N456',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '行政楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 13:45:00',
    plateNumber: '鲁A·9P234',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '行政楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 13:50:00',
    plateNumber: '鲁A·7Q567',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '研发楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 13:55:00',
    plateNumber: '鲁A·4R890',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '研发楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 14:00:00',
    plateNumber: '鲁A·3S123',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '行政楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 14:05:00',
    plateNumber: '鲁A·2T456',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '研发楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 14:10:00',
    plateNumber: '鲁A·1U789',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '行政楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 14:15:00',
    plateNumber: '鲁A·0V234',
    vehicleType: '小型汽车',
    direction: '进入',
    device: '研发楼入口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 17:00:00',
    plateNumber: '鲁A·8K123',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '行政楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 17:05:00',
    plateNumber: '鲁A·6M789',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '研发楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 17:10:00',
    plateNumber: '鲁A·5N456',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '行政楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 17:15:00',
    plateNumber: '鲁A·9P234',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '行政楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 17:20:00',
    plateNumber: '鲁A·7Q567',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '研发楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 17:25:00',
    plateNumber: '鲁A·4R890',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '研发楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 17:30:00',
    plateNumber: '鲁A·3S123',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '行政楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 17:35:00',
    plateNumber: '鲁A·2T456',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '研发楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 17:40:00',
    plateNumber: '鲁A·1U789',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '行政楼出口道闸',
    status: 'success',
    remark: '正常通行'
  },
  {
    time: '2025-05-20 17:45:00',
    plateNumber: '鲁A·0V234',
    vehicleType: '小型汽车',
    direction: '离开',
    device: '研发楼出口道闸',
    status: 'success',
    remark: '正常通行'
  }
])

// 设备设置
const deviceSettings = ref({
  name: '',
  recognitionModes: ['plate'],
  delay: 5,
  alarmEnabled: true
})

// 计算当前页的数据
const paginatedVehicleList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return vehicleList.value.slice(start, end)
})

// 处理节点点击
const handleNodeClick = (data) => {
  if (data.type === 'device') {
    currentDevice.value = data
    // 加载设备设置
    deviceSettings.value = {
      name: data.name,
      recognitionModes: data.recognitionModes || ['plate'],
      delay: data.delay || 5,
      alarmEnabled: data.alarmEnabled || true
    }
  }
}

// 处理搜索
const handleSearch = () => {
  // 根据关键词搜索设备
  const keyword = searchKeyword.value.toLowerCase()
  deviceGroups.value.forEach(group => {
    group.children.forEach(device => {
      device.hidden = !device.name.toLowerCase().includes(keyword)
    })
  })
}

// 开始监控
const startMonitoring = () => {
  console.log('开始监控')
  // 模拟识别结果
  currentRecognition.value = {
    plateNumber: '鲁A·8K123',
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
  ElMessageBox.prompt('请输入车牌号', '添加车辆', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]$/,
    inputErrorMessage: '请输入正确的车牌号格式'
  }).then(({ value }) => {
    // 检查车牌号是否已存在
    if (vehicleList.value.some(v => v.plateNumber === value)) {
      ElMessage.error('该车牌号已存在')
      return
    }
    
    // 添加新车辆
    const newVehicle = {
      plateNumber: value,
      vehicleType: '小型汽车',
      owner: '',
      phone: '',
      department: '',
      validTime: '2025-05-01 至 2025-12-31',
      status: 'active'
    }
    vehicleList.value.unshift(newVehicle)
    ElMessage.success('添加成功')
  }).catch(() => {})
}

// 编辑车辆
const handleEditVehicle = (vehicle) => {
  ElMessageBox.prompt('请输入车主姓名', '编辑车辆', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: vehicle.owner
  }).then(({ value }) => {
    vehicle.owner = value
    ElMessage.success('更新成功')
  }).catch(() => {})
}

// 删除车辆
const handleDeleteVehicle = (vehicle) => {
  ElMessageBox.confirm(
    `确定要删除车辆 ${vehicle.plateNumber} 的信息吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const index = vehicleList.value.findIndex(v => v.plateNumber === vehicle.plateNumber)
    if (index > -1) {
      vehicleList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

// 批量导入
const handleImport = () => {
  ElMessageBox.alert('请选择要导入的Excel文件', '批量导入', {
    confirmButtonText: '确定',
    callback: () => {
      // 模拟导入过程
      setTimeout(() => {
        ElMessage.success('导入成功')
      }, 1000)
    }
  })
}

// 处理日期变化
const handleDateChange = (val) => {
  if (!val) {
    return
  }
  const [start, end] = val
  // 根据日期范围筛选通行记录
  passageRecords.value = passageRecords.value.filter(record => {
    const recordTime = new Date(record.time)
    return recordTime >= start && recordTime <= end
  })
}

// 导出记录
const handleExport = () => {
  // 准备导出数据
  const exportData = passageRecords.value.map(record => ({
    '通行时间': record.time,
    '车牌号': record.plateNumber,
    '车辆类型': record.vehicleType,
    '通行方向': record.direction,
    '设备名称': record.device,
    '通行状态': record.status === 'success' ? '成功' : '失败',
    '备注': record.remark
  }))

  // 模拟导出过程
  setTimeout(() => {
    ElMessage.success('导出成功')
  }, 1000)
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  // 重新计算分页数据
  total.value = vehicleList.value.length
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  // 重新计算分页数据
  total.value = vehicleList.value.length
}

// 保存设置
const saveSettings = () => {
  if (!currentDevice.value) {
    return
  }
  
  // 更新设备设置
  currentDevice.value.name = deviceSettings.value.name
  currentDevice.value.recognitionModes = deviceSettings.value.recognitionModes
  currentDevice.value.delay = deviceSettings.value.delay
  currentDevice.value.alarmEnabled = deviceSettings.value.alarmEnabled
  
  ElMessage.success('设置保存成功')
  showSettings.value = false
}
</script>

<style scoped>
.vehicle-control {
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
</style> 
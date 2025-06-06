<template>
  <div class="dispatch-center">
    <!-- 左侧区域 -->
    <div class="left-panel">
      <!-- 调度组 -->
      <el-card class="dispatch-groups">
        <template #header>
          <div class="card-header">
            <span>调度组</span>
            <el-button-group>
              <el-button type="primary" size="small" @click="handleAddGroup">
                <el-icon><Plus /></el-icon>新建组
              </el-button>
              <el-button type="danger" size="small" @click="handleDeleteGroup" :disabled="!currentGroup">
                <el-icon><Delete /></el-icon>删除组
              </el-button>
            </el-button-group>
          </div>
        </template>
        
        <el-scrollbar>
          <div class="group-list">
            <div 
              v-for="group in dispatchGroups" 
              :key="group.id"
              class="group-item"
              :class="{ active: currentGroup?.id === group.id }"
              @click="selectGroup(group)"
            >
              <el-icon><UserFilled /></el-icon>
              <span class="group-name">{{ group.name }}</span>
              <span class="group-count">
                <el-tag size="small" :type="getGroupStatusType(group)">
                  {{ getOnlineCount(group) }}/{{ group.members.length }}
                </el-tag>
              </span>
            </div>
          </div>
        </el-scrollbar>
      </el-card>

      <!-- 成员列表 -->
      <el-card class="member-list">
        <template #header>
          <div class="card-header">
            <span>成员列表</span>
            <el-button-group>
              <el-button type="primary" size="small" @click="handleAddMember" :disabled="!currentGroup">
                <el-icon><Plus /></el-icon>添加
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="handleRemoveMember"
                :disabled="!selectedMembers.length"
              >
                <el-icon><Delete /></el-icon>移除
              </el-button>
            </el-button-group>
          </div>
        </template>

        <el-table
          :data="currentGroup?.members || []"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="45" />
          <el-table-column prop="name" label="姓名" width="80" />
          <el-table-column prop="role" label="角色" width="80">
            <template #default="scope">
              <el-tag size="small" :type="scope.row.role === '组长' ? 'danger' : 'info'">
                {{ scope.row.role }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="dept" label="部门" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="scope">
              <el-tag size="small" :type="scope.row.status === '在线' ? 'success' : 'info'">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button-group>
                <el-button 
                  type="primary" 
                  :icon="Phone"
                  size="small"
                  @click="handleCall(scope.row)"
                  :disabled="scope.row.status !== '在线'"
                />
                <el-button 
                  type="success" 
                  :icon="ChatDotRound"
                  size="small"
                  @click="handleChat(scope.row)"
                  :disabled="scope.row.status !== '在线'"
                />
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 右侧区域 -->
    <div class="right-panel">
      <!-- 调度指令 -->
      <el-card class="dispatch-commands">
        <template #header>
          <div class="card-header">
            <span>调度指令</span>
            <el-radio-group v-model="commandType" size="small">
              <el-radio-button label="video">视频调度</el-radio-button>
              <el-radio-button label="voice">语音调度</el-radio-button>
              <el-radio-button label="message">消息调度</el-radio-button>
            </el-radio-group>
          </div>
        </template>

        <div class="command-content">
          <!-- 视频调度 -->
          <template v-if="commandType === 'video'">
            <el-form :model="videoCommand" label-width="80px">
              <el-form-item label="调度类型">
                <el-radio-group v-model="videoCommand.type">
                  <el-radio label="live">实时视频</el-radio>
                  <el-radio label="playback">录像回放</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="选择区域">
                <el-cascader
                  v-model="videoCommand.camera"
                  :options="cameraData"
                  :props="{
                    checkStrictly: true,
                    label: 'label',
                    value: 'id',
                    children: 'children'
                  }"
                  placeholder="请选择摄像头"
                  clearable
                />
              </el-form-item>

              <template v-if="videoCommand.type === 'playback'">
                <el-form-item label="回放时间">
                  <el-date-picker
                    v-model="videoCommand.playbackTime"
                    type="datetime"
                    placeholder="选择回放时间"
                    format="YYYY-MM-DD HH:mm:ss"
                  />
                </el-form-item>
              </template>

              <el-form-item>
                <el-button type="primary" @click="handleVideoDispatch">发起调度</el-button>
              </el-form-item>
            </el-form>
          </template>

          <!-- 语音调度 -->
          <template v-if="commandType === 'voice'">
            <el-form :model="voiceCommand" label-width="80px">
              <el-form-item label="调度模式">
                <el-radio-group v-model="voiceCommand.mode">
                  <el-radio label="broadcast">广播</el-radio>
                  <el-radio label="intercom">对讲</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="选择成员" v-if="voiceCommand.mode === 'intercom'">
                <el-select
                  v-model="voiceCommand.target"
                  placeholder="请选择对讲成员"
                  multiple
                  :disabled="!currentGroup"
                >
                  <el-option
                    v-for="member in currentGroup?.members.filter(m => m.status === '在线')"
                    :key="member.id"
                    :label="member.name"
                    :value="member.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button 
                  type="primary" 
                  :class="{ 'is-speaking': isSpeaking }"
                  @mousedown="startSpeaking"
                  @mouseup="stopSpeaking"
                  :disabled="!currentGroup || (voiceCommand.mode === 'intercom' && !voiceCommand.target.length)"
                >
                  {{ isSpeaking ? '松开结束' : '按住说话' }}
                </el-button>
              </el-form-item>
            </el-form>
          </template>

          <!-- 消息调度 -->
          <template v-if="commandType === 'message'">
            <el-form :model="messageCommand" label-width="80px">
              <el-form-item label="消息类型">
                <el-select v-model="messageCommand.type" placeholder="请选择消息类型">
                  <el-option label="文本消息" value="text" />
                  <el-option label="图片消息" value="image" />
                  <el-option label="指令消息" value="command" />
                </el-select>
              </el-form-item>

              <template v-if="messageCommand.type === 'text'">
                <el-form-item label="消息内容">
                  <el-input
                    v-model="messageCommand.content"
                    type="textarea"
                    rows="4"
                    placeholder="请输入消息内容"
                  />
                </el-form-item>
              </template>

              <template v-else-if="messageCommand.type === 'image'">
                <el-form-item label="上传图片">
                  <el-upload
                    action="#"
                    list-type="picture-card"
                    :auto-upload="false"
                    :on-change="handleImageChange"
                  >
                    <el-icon><Plus /></el-icon>
                  </el-upload>
                </el-form-item>
              </template>

              <template v-else-if="messageCommand.type === 'command'">
                <el-form-item label="指令类型">
                  <el-select v-model="messageCommand.commandType" placeholder="请选择指令类型">
                    <el-option label="集合" value="gather" />
                    <el-option label="解散" value="dismiss" />
                    <el-option label="支援" value="support" />
                  </el-select>
                </el-form-item>
                <el-form-item label="指令内容">
                  <el-input
                    v-model="messageCommand.commandContent"
                    type="textarea"
                    rows="2"
                    placeholder="请输入指令详情"
                  />
                </el-form-item>
              </template>

              <el-form-item>
                <el-button type="primary" @click="handleSendMessage">发送消息</el-button>
              </el-form-item>
            </el-form>
          </template>
        </div>
      </el-card>

      <!-- 调度记录 -->
      <el-card class="dispatch-records">
        <template #header>
          <div class="card-header">
            <span>调度记录</span>
            <el-button-group>
              <el-button type="primary" link @click="exportRecords">
                导出记录
              </el-button>
              <el-button type="danger" link @click="clearRecords">
                清空记录
              </el-button>
            </el-button-group>
          </div>
        </template>

        <el-timeline>
          <el-timeline-item
            v-for="record in dispatchRecords"
            :key="record.id"
            :type="record.type"
            :timestamp="record.time"
            :hollow="true"
          >
            <div class="record-content">
              <div class="record-title">{{ record.content }}</div>
              <div class="record-info">
                <span>操作人：{{ record.operator }}</span>
                <span>目标组：{{ record.target }}</span>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>

    <!-- 新建/编辑调度组对话框 -->
    <el-dialog
      v-model="groupDialogVisible"
      :title="editingGroup ? '编辑调度组' : '新建调度组'"
      width="500px"
    >
      <el-form
        ref="groupFormRef"
        :model="groupForm"
        :rules="groupRules"
        label-width="80px"
      >
        <el-form-item label="组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入调度组名称" />
        </el-form-item>
        <el-form-item label="组长" prop="leader">
          <el-select v-model="groupForm.leader" placeholder="请选择组长">
            <el-option
              v-for="member in availableMembers"
              :key="member.id"
              :label="member.name"
              :value="member.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="groupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitGroupForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加成员对话框 -->
    <el-dialog
      v-model="memberDialogVisible"
      title="添加成员"
      width="500px"
    >
      <el-form
        ref="memberFormRef"
        :model="memberForm"
        :rules="memberRules"
        label-width="80px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="memberForm.name" placeholder="请输入成员姓名" />
        </el-form-item>
        <el-form-item label="部门" prop="dept">
          <el-select v-model="memberForm.dept" placeholder="请选择部门">
            <el-option label="物业部" value="物业部" />
            <el-option label="安保部" value="安保部" />
            <el-option label="客服部" value="客服部" />
            <el-option label="工程部" value="工程部" />
            <el-option label="保洁部" value="保洁部" />
            <el-option label="绿化部" value="绿化部" />
            <el-option label="秩序部" value="秩序部" />
            <el-option label="维修部" value="维修部" />
            <el-option label="停车管理" value="停车管理" />
            <el-option label="设备管理" value="设备管理" />
          </el-select>
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="memberForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="memberDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMemberForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  Plus, 
  Delete, 
  UserFilled,
  Phone,
  ChatDotRound
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getDispatchGroups, 
  getCameraData,
  getInitialRecords 
} from './dispatch-data'

// 状态数据
const dispatchGroups = ref([])
const cameraData = ref([])
const dispatchRecords = ref([])
const currentGroup = ref(null)
const selectedMembers = ref([])
const commandType = ref('video')
const isSpeaking = ref(false)

// 对话框状态
const groupDialogVisible = ref(false)
const memberDialogVisible = ref(false)
const editingGroup = ref(null)

// 表单数据
const groupForm = reactive({
  name: '',
  leader: ''
})

const memberForm = reactive({
  name: '',
  dept: '',
  phone: ''
})

// 调度命令数据
const videoCommand = reactive({
  type: 'live',
  camera: null,
  playbackTime: null
})

const voiceCommand = reactive({
  mode: 'broadcast',
  target: []
})

const messageCommand = reactive({
  type: 'text',
  content: '',
  commandType: '',
  commandContent: '',
  image: null
})

// 表单验证规则
const groupRules = {
  name: [
    { required: true, message: '请输入调度组名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  leader: [
    { required: true, message: '请选择组长', trigger: 'change' }
  ]
}

const memberRules = {
  name: [
    { required: true, message: '请输入成员姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  dept: [
    { required: true, message: '请选择部门', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 计算属性
const availableMembers = computed(() => {
  // 这里可以从后端获取可用成员列表
  return []
})

// 初始化数据
onMounted(() => {
  dispatchGroups.value = getDispatchGroups()
  cameraData.value = getCameraData()
  dispatchRecords.value = getInitialRecords()
})

// 工具函数
const getGroupStatusType = (group) => {
  const onlineCount = getOnlineCount(group)
  if (onlineCount === 0) return 'danger'
  if (onlineCount === group.members.length) return 'success'
  return 'warning'
}

const getOnlineCount = (group) => {
  return group.members.filter(m => m.status === '在线').length
}

// 事件处理函数
const selectGroup = (group) => {
  currentGroup.value = group
  selectedMembers.value = []
}

const handleSelectionChange = (selection) => {
  selectedMembers.value = selection
}

const handleAddGroup = () => {
  editingGroup.value = null
  groupForm.name = ''
  groupForm.leader = ''
  groupDialogVisible.value = true
}

const handleDeleteGroup = async () => {
  if (!currentGroup.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除调度组"${currentGroup.value.name}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = dispatchGroups.value.findIndex(g => g.id === currentGroup.value.id)
    if (index !== -1) {
      dispatchGroups.value.splice(index, 1)
      currentGroup.value = null
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

const handleAddMember = () => {
  if (!currentGroup.value) return
  memberForm.name = ''
  memberForm.dept = ''
  memberForm.phone = ''
  memberDialogVisible.value = true
}

const handleRemoveMember = async () => {
  if (selectedMembers.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要移除选中的 ${selectedMembers.value.length} 名成员吗？`,
      '移除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const selectedIds = selectedMembers.value.map(m => m.id)
    currentGroup.value.members = currentGroup.value.members.filter(
      m => !selectedIds.includes(m.id)
    )
    selectedMembers.value = []
    ElMessage.success('移除成功')
  } catch {
    // 用户取消移除
  }
}

const handleCall = (member) => {
  ElMessage.success(`正在呼叫 ${member.name}：${member.phone}`)
}

const handleChat = (member) => {
  ElMessage.success(`打开与 ${member.name} 的聊天窗口`)
}

// 生成最近半个月内的随机时间
const getRandomRecentDate = () => {
  const now = new Date()
  const fifteenDaysAgo = new Date(now - 15 * 24 * 60 * 60 * 1000)
  const randomTime = fifteenDaysAgo.getTime() + Math.random() * (now.getTime() - fifteenDaysAgo.getTime())
  return new Date(randomTime).toLocaleString('zh-CN')
}

// 获取当前时间
const getCurrentTime = () => {
  return new Date().toLocaleString('zh-CN')
}

// 更新视频调度处理函数
const handleVideoDispatch = () => {
  if (!currentGroup.value) {
    ElMessage.warning('请先选择调度组')
    return
  }
  if (!videoCommand.camera) {
    ElMessage.warning('请选择摄像头')
    return
  }

  const camera = findCamera(videoCommand.camera)
  if (camera) {
    dispatchRecords.value.unshift({
      id: Date.now(),
      type: 'primary',
      time: getCurrentTime(), // 使用当前时间
      content: `发起${videoCommand.type === 'live' ? '实时' : '回放'}视频调度：${camera.label}`,
      operator: currentGroup.value.members.find(m => m.role === '组长')?.name || '系统',
      target: currentGroup.value.name
    })
    ElMessage.success('视频调度已发起')
  }
}

const findCamera = (id) => {
  // 递归查找摄像头
  const find = (nodes) => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = find(node.children)
        if (found) return found
      }
    }
    return null
  }
  return find(cameraData.value)
}

const startSpeaking = () => {
  if (!currentGroup.value) {
    ElMessage.warning('请先选择调度组')
    return
  }
  if (voiceCommand.mode === 'intercom' && voiceCommand.target.length === 0) {
    ElMessage.warning('请选择对讲成员')
    return
  }
  isSpeaking.value = true
}

// 更新语音调度处理函数
const stopSpeaking = () => {
  if (isSpeaking.value) {
    isSpeaking.value = false
    dispatchRecords.value.unshift({
      id: Date.now(),
      type: 'success',
      time: getCurrentTime(), // 使用当前时间
      content: `语音${voiceCommand.mode === 'broadcast' ? '广播' : '对讲'}已结束`,
      operator: currentGroup.value.members.find(m => m.role === '组长')?.name || '系统',
      target: currentGroup.value.name
    })
  }
}

const handleImageChange = (file) => {
  messageCommand.image = file.raw
}

// 更新消息发送处理函数
const handleSendMessage = () => {
  if (!currentGroup.value) {
    ElMessage.warning('请先选择调度组')
    return
  }

  let content = ''
  if (messageCommand.type === 'text') {
    if (!messageCommand.content) {
      ElMessage.warning('请输入消息内容')
      return
    }
    content = messageCommand.content
  } else if (messageCommand.type === 'image') {
    if (!messageCommand.image) {
      ElMessage.warning('请选择图片')
      return
    }
    content = '图片消息'
  } else if (messageCommand.type === 'command') {
    if (!messageCommand.commandType || !messageCommand.commandContent) {
      ElMessage.warning('请完善指令信息')
      return
    }
    content = `${messageCommand.commandType}指令：${messageCommand.commandContent}`
  }

  dispatchRecords.value.unshift({
    id: Date.now(),
    type: messageCommand.type === 'command' ? 'warning' : 'info',
    time: getCurrentTime(), // 使用当前时间
    content: `消息通知：${content}`,
    operator: currentGroup.value.members.find(m => m.role === '组长')?.name || '系统',
    target: currentGroup.value.name
  })

  // 重置表单
  messageCommand.content = ''
  messageCommand.commandContent = ''
  messageCommand.image = null
  ElMessage.success('消息已发送')
}

const exportRecords = () => {
  // 这里可以实现导出记录的逻辑
  ElMessage.success('导出成功')
}

const clearRecords = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有调度记录吗？',
      '清空确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    dispatchRecords.value = []
    ElMessage.success('记录已清空')
  } catch {
    // 用户取消清空
  }
}

const submitGroupForm = async () => {
  // 实现提交调度组表单的逻辑
}

const submitMemberForm = async () => {
  if (!memberFormRef.value) return
  
  await memberFormRef.value.validate((valid) => {
    if (valid) {
      // 生成新成员ID
      const newId = Date.now()
      
      // 创建新成员对象
      const newMember = {
        id: newId,
        name: memberForm.name,
        dept: memberForm.dept,
        phone: memberForm.phone,
        role: '成员',  // 默认角色为成员
        status: '在线'  // 默认状态为在线
      }
      
      // 添加到当前组
      if (currentGroup.value) {
        currentGroup.value.members.push(newMember)
        
        // 添加成功提示
        ElMessage.success('添加成员成功')
        
        // 关闭对话框
        memberDialogVisible.value = false
        
        // 重置表单
        memberForm.name = ''
        memberForm.dept = ''
        memberForm.phone = ''
      }
    } else {
      return false
    }
  })
}

// 添加表单引用
const memberFormRef = ref(null)
</script>

<style scoped>
.dispatch-center {
  padding: 20px;
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
  height: calc(100vh - 100px);
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dispatch-groups {
  height: 300px;
  display: flex;
  flex-direction: column;
}

.member-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dispatch-commands {
  height: 400px;
}

.dispatch-records {
  flex: 1;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.group-item:hover {
  background: #f5f7fa;
}

.group-item.active {
  background: #ecf5ff;
  color: #409eff;
}

.group-name {
  flex: 1;
}

.group-count {
  color: #909399;
  font-size: 12px;
}

.command-content {
  padding: 20px;
}

.is-speaking {
  animation: speaking 1s infinite;
}

@keyframes speaking {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.record-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.record-info {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #909399;
}

:deep(.el-card__body) {
  flex: 1;
  overflow: auto;
}

:deep(.el-timeline) {
  padding: 0 20px;
}
</style> 
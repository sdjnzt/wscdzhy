import { createRouter, createWebHistory } from 'vue-router'
import Welcome from '../components/Welcome.vue'
import CommandCenter from '../components/CommandCenter.vue'
import VideoMonitoring from '../components/VideoMonitoring.vue'
import FaceRecognition from '../components/FaceRecognition.vue'
import AccessControl from '../components/AccessControl.vue'
import VehicleControl from '../components/VehicleControl.vue'
import VisitorSystem from '../components/VisitorSystem.vue'
import BroadcastSystem from '../components/BroadcastSystem.vue'
import CardRecognition from '../components/CardRecognition.vue'
import PatrolSystem from '../components/PatrolSystem.vue'
import SmartMeeting from '../components/SmartMeeting.vue'

const routes = [
  {
    path: '/',
    redirect: '/welcome'
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: Welcome
  },
  {
    path: '/command',
    name: 'Command',
    component: CommandCenter
  },
  {
    path: '/video',
    name: 'Video',
    component: VideoMonitoring
  },
  {
    path: '/face',
    name: 'Face',
    component: FaceRecognition
  },
  {
    path: '/access',
    name: 'Access',
    component: AccessControl
  },
  {
    path: '/vehicle',
    name: 'Vehicle',
    component: VehicleControl
  },
  {
    path: '/visitor',
    name: 'Visitor',
    component: VisitorSystem
  },
  {
    path: '/broadcast',
    name: 'Broadcast',
    component: BroadcastSystem
  },
  {
    path: '/card',
    name: 'Card',
    component: CardRecognition
  },
  {
    path: '/patrol',
    name: 'Patrol',
    component: PatrolSystem
  },
  {
    path: '/meeting',
    name: 'Meeting',
    component: SmartMeeting
  },
  {
    // 兜底路由，匹配所有未匹配的路径
    path: '/:pathMatch(.*)*',
    redirect: '/welcome'
  }
]

export const router = createRouter({
  history: createWebHistory('/smart-park/'),
  routes
})
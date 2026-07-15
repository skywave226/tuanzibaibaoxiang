import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import HomeView from '@/views/HomeView.vue'
import ToolView from '@/views/ToolView.vue'
import { tools } from '@/tools/registry'

const toolRoutes: RouteRecordRaw[] = tools.map(t => ({
  path: t.path,
  component: ToolView,
  meta: { toolPath: t.path },
}))

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', name: 'home', component: HomeView },
      ...toolRoutes,
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router

import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import HomeView from '@/views/HomeView.vue'
import ToolView from '@/views/ToolView.vue'
import { tools } from '@/tools/registry'
import { recordVisit } from '@/composables/useVisitStats'

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

router.afterEach((to) => {
  const tool = tools.find(t => t.path === to.path)
  recordVisit(to.path, tool?.name || '首页')
})

export default router

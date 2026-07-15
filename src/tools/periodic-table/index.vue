<template>
  <div class="periodic-table">
    <div class="toolbar">
      <n-input v-model:value="searchQuery" placeholder="搜索元素名称、符号或原子序数" clearable style="max-width: 320px" />
      <n-select v-model:value="categoryFilter" :options="categoryOptions" placeholder="分类筛选" style="width: 160px" clearable />
    </div>

    <div class="table-grid">
      <div
        v-for="el in filteredElements"
        :key="el.number"
        class="element-card"
        :class="categoryClass(el.category)"
        @click="selectElement(el)"
      >
        <div class="atomic-number">{{ el.number }}</div>
        <div class="symbol">{{ el.symbol }}</div>
        <div class="name">{{ el.name }}</div>
        <div class="mass">{{ el.mass }}</div>
      </div>
    </div>

    <n-modal v-model:show="showModal" preset="card" :title="selectedElement?.name" style="max-width: 480px">
      <div v-if="selectedElement" class="detail-content">
        <div class="detail-header">
          <div class="detail-symbol" :class="categoryClass(selectedElement.category)">{{ selectedElement.symbol }}</div>
          <div class="detail-meta">
            <div class="detail-name">{{ selectedElement.name }}</div>
            <div class="detail-category">{{ selectedElement.category }}</div>
          </div>
        </div>
        <n-descriptions label-placement="left" bordered size="small" :column="1">
          <n-descriptions-item label="原子序数">{{ selectedElement.number }}</n-descriptions-item>
          <n-descriptions-item label="相对原子质量">{{ selectedElement.mass }}</n-descriptions-item>
          <n-descriptions-item label="周期">{{ selectedElement.period }}</n-descriptions-item>
          <n-descriptions-item label="族">{{ selectedElement.group }}</n-descriptions-item>
          <n-descriptions-item label="电子排布">{{ selectedElement.config || '—' }}</n-descriptions-item>
        </n-descriptions>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NSelect, NModal, NDescriptions, NDescriptionsItem } from 'naive-ui'

interface ChemicalElement {
  number: number
  symbol: string
  name: string
  mass: string
  category: string
  group: string
  period: number
  config?: string
}

const searchQuery = ref('')
const categoryFilter = ref<string | null>(null)
const showModal = ref(false)
const selectedElement = ref<ChemicalElement | null>(null)

const categories = ['碱金属', '碱土金属', '过渡金属', '贫金属', '类金属', '非金属', '卤素', '稀有气体', '镧系', '锕系', '超铀元素']

const categoryOptions = categories.map(c => ({ label: c, value: c }))

const elements: ChemicalElement[] = [
  { number: 1, symbol: 'H', name: '氢', mass: '1.008', category: '非金属', group: '1', period: 1, config: '1s¹' },
  { number: 2, symbol: 'He', name: '氦', mass: '4.003', category: '稀有气体', group: '18', period: 1, config: '1s²' },
  { number: 3, symbol: 'Li', name: '锂', mass: '6.941', category: '碱金属', group: '1', period: 2, config: '[He] 2s¹' },
  { number: 4, symbol: 'Be', name: '铍', mass: '9.012', category: '碱土金属', group: '2', period: 2, config: '[He] 2s²' },
  { number: 5, symbol: 'B', name: '硼', mass: '10.811', category: '类金属', group: '13', period: 2, config: '[He] 2s² 2p¹' },
  { number: 6, symbol: 'C', name: '碳', mass: '12.011', category: '非金属', group: '14', period: 2, config: '[He] 2s² 2p²' },
  { number: 7, symbol: 'N', name: '氮', mass: '14.007', category: '非金属', group: '15', period: 2, config: '[He] 2s² 2p³' },
  { number: 8, symbol: 'O', name: '氧', mass: '15.999', category: '非金属', group: '16', period: 2, config: '[He] 2s² 2p⁴' },
  { number: 9, symbol: 'F', name: '氟', mass: '18.998', category: '卤素', group: '17', period: 2, config: '[He] 2s² 2p⁵' },
  { number: 10, symbol: 'Ne', name: '氖', mass: '20.180', category: '稀有气体', group: '18', period: 2, config: '[He] 2s² 2p⁶' },
  { number: 11, symbol: 'Na', name: '钠', mass: '22.990', category: '碱金属', group: '1', period: 3, config: '[Ne] 3s¹' },
  { number: 12, symbol: 'Mg', name: '镁', mass: '24.305', category: '碱土金属', group: '2', period: 3, config: '[Ne] 3s²' },
  { number: 13, symbol: 'Al', name: '铝', mass: '26.982', category: '贫金属', group: '13', period: 3, config: '[Ne] 3s² 3p¹' },
  { number: 14, symbol: 'Si', name: '硅', mass: '28.086', category: '类金属', group: '14', period: 3, config: '[Ne] 3s² 3p²' },
  { number: 15, symbol: 'P', name: '磷', mass: '30.974', category: '非金属', group: '15', period: 3, config: '[Ne] 3s² 3p³' },
  { number: 16, symbol: 'S', name: '硫', mass: '32.065', category: '非金属', group: '16', period: 3, config: '[Ne] 3s² 3p⁴' },
  { number: 17, symbol: 'Cl', name: '氯', mass: '35.453', category: '卤素', group: '17', period: 3, config: '[Ne] 3s² 3p⁵' },
  { number: 18, symbol: 'Ar', name: '氩', mass: '39.948', category: '稀有气体', group: '18', period: 3, config: '[Ne] 3s² 3p⁶' },
  { number: 19, symbol: 'K', name: '钾', mass: '39.098', category: '碱金属', group: '1', period: 4, config: '[Ar] 4s¹' },
  { number: 20, symbol: 'Ca', name: '钙', mass: '40.078', category: '碱土金属', group: '2', period: 4, config: '[Ar] 4s²' },
  { number: 21, symbol: 'Sc', name: '钪', mass: '44.956', category: '过渡金属', group: '3', period: 4, config: '[Ar] 3d¹ 4s²' },
  { number: 22, symbol: 'Ti', name: '钛', mass: '47.867', category: '过渡金属', group: '4', period: 4, config: '[Ar] 3d² 4s²' },
  { number: 23, symbol: 'V', name: '钒', mass: '50.942', category: '过渡金属', group: '5', period: 4, config: '[Ar] 3d³ 4s²' },
  { number: 24, symbol: 'Cr', name: '铬', mass: '51.996', category: '过渡金属', group: '6', period: 4, config: '[Ar] 3d⁵ 4s¹' },
  { number: 25, symbol: 'Mn', name: '锰', mass: '54.938', category: '过渡金属', group: '7', period: 4, config: '[Ar] 3d⁵ 4s²' },
  { number: 26, symbol: 'Fe', name: '铁', mass: '55.845', category: '过渡金属', group: '8', period: 4, config: '[Ar] 3d⁶ 4s²' },
  { number: 27, symbol: 'Co', name: '钴', mass: '58.933', category: '过渡金属', group: '9', period: 4, config: '[Ar] 3d⁷ 4s²' },
  { number: 28, symbol: 'Ni', name: '镍', mass: '58.693', category: '过渡金属', group: '10', period: 4, config: '[Ar] 3d⁸ 4s²' },
  { number: 29, symbol: 'Cu', name: '铜', mass: '63.546', category: '过渡金属', group: '11', period: 4, config: '[Ar] 3d¹⁰ 4s¹' },
  { number: 30, symbol: 'Zn', name: '锌', mass: '65.380', category: '过渡金属', group: '12', period: 4, config: '[Ar] 3d¹⁰ 4s²' },
  { number: 31, symbol: 'Ga', name: '镓', mass: '69.723', category: '贫金属', group: '13', period: 4, config: '[Ar] 3d¹⁰ 4s² 4p¹' },
  { number: 32, symbol: 'Ge', name: '锗', mass: '72.640', category: '类金属', group: '14', period: 4, config: '[Ar] 3d¹⁰ 4s² 4p²' },
  { number: 33, symbol: 'As', name: '砷', mass: '74.922', category: '类金属', group: '15', period: 4, config: '[Ar] 3d¹⁰ 4s² 4p³' },
  { number: 34, symbol: 'Se', name: '硒', mass: '78.960', category: '非金属', group: '16', period: 4, config: '[Ar] 3d¹⁰ 4s² 4p⁴' },
  { number: 35, symbol: 'Br', name: '溴', mass: '79.904', category: '卤素', group: '17', period: 4, config: '[Ar] 3d¹⁰ 4s² 4p⁵' },
  { number: 36, symbol: 'Kr', name: '氪', mass: '83.798', category: '稀有气体', group: '18', period: 4, config: '[Ar] 3d¹⁰ 4s² 4p⁶' },
  { number: 37, symbol: 'Rb', name: '铷', mass: '85.468', category: '碱金属', group: '1', period: 5, config: '[Kr] 5s¹' },
  { number: 38, symbol: 'Sr', name: '锶', mass: '87.620', category: '碱土金属', group: '2', period: 5, config: '[Kr] 5s²' },
  { number: 39, symbol: 'Y', name: '钇', mass: '88.906', category: '过渡金属', group: '3', period: 5, config: '[Kr] 4d¹ 5s²' },
  { number: 40, symbol: 'Zr', name: '锆', mass: '91.224', category: '过渡金属', group: '4', period: 5, config: '[Kr] 4d² 5s²' },
  { number: 41, symbol: 'Nb', name: '铌', mass: '92.906', category: '过渡金属', group: '5', period: 5, config: '[Kr] 4d⁴ 5s¹' },
  { number: 42, symbol: 'Mo', name: '钼', mass: '95.960', category: '过渡金属', group: '6', period: 5, config: '[Kr] 4d⁵ 5s¹' },
  { number: 43, symbol: 'Tc', name: '锝', mass: '98', category: '过渡金属', group: '7', period: 5, config: '[Kr] 4d⁵ 5s²' },
  { number: 44, symbol: 'Ru', name: '钌', mass: '101.070', category: '过渡金属', group: '8', period: 5, config: '[Kr] 4d⁷ 5s¹' },
  { number: 45, symbol: 'Rh', name: '铑', mass: '102.906', category: '过渡金属', group: '9', period: 5, config: '[Kr] 4d⁸ 5s¹' },
  { number: 46, symbol: 'Pd', name: '钯', mass: '106.420', category: '过渡金属', group: '10', period: 5, config: '[Kr] 4d¹⁰' },
  { number: 47, symbol: 'Ag', name: '银', mass: '107.868', category: '过渡金属', group: '11', period: 5, config: '[Kr] 4d¹⁰ 5s¹' },
  { number: 48, symbol: 'Cd', name: '镉', mass: '112.411', category: '过渡金属', group: '12', period: 5, config: '[Kr] 4d¹⁰ 5s²' },
  { number: 49, symbol: 'In', name: '铟', mass: '114.818', category: '贫金属', group: '13', period: 5, config: '[Kr] 4d¹⁰ 5s² 5p¹' },
  { number: 50, symbol: 'Sn', name: '锡', mass: '118.710', category: '贫金属', group: '14', period: 5, config: '[Kr] 4d¹⁰ 5s² 5p²' },
  { number: 51, symbol: 'Sb', name: '锑', mass: '121.760', category: '类金属', group: '15', period: 5, config: '[Kr] 4d¹⁰ 5s² 5p³' },
  { number: 52, symbol: 'Te', name: '碲', mass: '127.600', category: '类金属', group: '16', period: 5, config: '[Kr] 4d¹⁰ 5s² 5p⁴' },
  { number: 53, symbol: 'I', name: '碘', mass: '126.905', category: '卤素', group: '17', period: 5, config: '[Kr] 4d¹⁰ 5s² 5p⁵' },
  { number: 54, symbol: 'Xe', name: '氙', mass: '131.293', category: '稀有气体', group: '18', period: 5, config: '[Kr] 4d¹⁰ 5s² 5p⁶' },
  { number: 55, symbol: 'Cs', name: '铯', mass: '132.905', category: '碱金属', group: '1', period: 6, config: '[Xe] 6s¹' },
  { number: 56, symbol: 'Ba', name: '钡', mass: '137.327', category: '碱土金属', group: '2', period: 6, config: '[Xe] 6s²' },
  { number: 57, symbol: 'La', name: '镧', mass: '138.905', category: '镧系', group: '3', period: 6, config: '[Xe] 5d¹ 6s²' },
  { number: 58, symbol: 'Ce', name: '铈', mass: '140.116', category: '镧系', group: '—', period: 6, config: '[Xe] 4f¹ 5d¹ 6s²' },
  { number: 59, symbol: 'Pr', name: '镨', mass: '140.908', category: '镧系', group: '—', period: 6, config: '[Xe] 4f³ 6s²' },
  { number: 60, symbol: 'Nd', name: '钕', mass: '144.242', category: '镧系', group: '—', period: 6, config: '[Xe] 4f⁴ 6s²' },
  { number: 61, symbol: 'Pm', name: '钷', mass: '145', category: '镧系', group: '—', period: 6, config: '[Xe] 4f⁵ 6s²' },
  { number: 62, symbol: 'Sm', name: '钐', mass: '150.360', category: '镧系', group: '—', period: 6, config: '[Xe] 4f⁶ 6s²' },
  { number: 63, symbol: 'Eu', name: '铕', mass: '151.964', category: '镧系', group: '—', period: 6, config: '[Xe] 4f⁷ 6s²' },
  { number: 64, symbol: 'Gd', name: '钆', mass: '157.250', category: '镧系', group: '—', period: 6, config: '[Xe] 4f⁷ 5d¹ 6s²' },
  { number: 65, symbol: 'Tb', name: '铽', mass: '158.925', category: '镧系', group: '—', period: 6, config: '[Xe] 4f⁹ 6s²' },
  { number: 66, symbol: 'Dy', name: '镝', mass: '162.500', category: '镧系', group: '—', period: 6, config: '[Xe] 4f¹⁰ 6s²' },
  { number: 67, symbol: 'Ho', name: '钬', mass: '164.930', category: '镧系', group: '—', period: 6, config: '[Xe] 4f¹¹ 6s²' },
  { number: 68, symbol: 'Er', name: '铒', mass: '167.259', category: '镧系', group: '—', period: 6, config: '[Xe] 4f¹² 6s²' },
  { number: 69, symbol: 'Tm', name: '铥', mass: '168.934', category: '镧系', group: '—', period: 6, config: '[Xe] 4f¹³ 6s²' },
  { number: 70, symbol: 'Yb', name: '镱', mass: '173.054', category: '镧系', group: '—', period: 6, config: '[Xe] 4f¹⁴ 6s²' },
  { number: 71, symbol: 'Lu', name: '镥', mass: '174.967', category: '镧系', group: '—', period: 6, config: '[Xe] 4f¹⁴ 5d¹ 6s²' },
  { number: 72, symbol: 'Hf', name: '铪', mass: '178.490', category: '过渡金属', group: '4', period: 6, config: '[Xe] 4f¹⁴ 5d² 6s²' },
  { number: 73, symbol: 'Ta', name: '钽', mass: '180.948', category: '过渡金属', group: '5', period: 6, config: '[Xe] 4f¹⁴ 5d³ 6s²' },
  { number: 74, symbol: 'W', name: '钨', mass: '183.840', category: '过渡金属', group: '6', period: 6, config: '[Xe] 4f¹⁴ 5d⁴ 6s²' },
  { number: 75, symbol: 'Re', name: '铼', mass: '186.207', category: '过渡金属', group: '7', period: 6, config: '[Xe] 4f¹⁴ 5d⁵ 6s²' },
  { number: 76, symbol: 'Os', name: '锇', mass: '190.230', category: '过渡金属', group: '8', period: 6, config: '[Xe] 4f¹⁴ 5d⁶ 6s²' },
  { number: 77, symbol: 'Ir', name: '铱', mass: '192.217', category: '过渡金属', group: '9', period: 6, config: '[Xe] 4f¹⁴ 5d⁷ 6s²' },
  { number: 78, symbol: 'Pt', name: '铂', mass: '195.084', category: '过渡金属', group: '10', period: 6, config: '[Xe] 4f¹⁴ 5d⁹ 6s¹' },
  { number: 79, symbol: 'Au', name: '金', mass: '196.967', category: '过渡金属', group: '11', period: 6, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹' },
  { number: 80, symbol: 'Hg', name: '汞', mass: '200.590', category: '过渡金属', group: '12', period: 6, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s²' },
  { number: 81, symbol: 'Tl', name: '铊', mass: '204.383', category: '贫金属', group: '13', period: 6, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹' },
  { number: 82, symbol: 'Pb', name: '铅', mass: '207.200', category: '贫金属', group: '14', period: 6, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²' },
  { number: 83, symbol: 'Bi', name: '铋', mass: '208.980', category: '贫金属', group: '15', period: 6, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³' },
  { number: 84, symbol: 'Po', name: '钋', mass: '209', category: '类金属', group: '16', period: 6, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴' },
  { number: 85, symbol: 'At', name: '砹', mass: '210', category: '卤素', group: '17', period: 6, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵' },
  { number: 86, symbol: 'Rn', name: '氡', mass: '222', category: '稀有气体', group: '18', period: 6, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶' },
  { number: 87, symbol: 'Fr', name: '钫', mass: '223', category: '碱金属', group: '1', period: 7, config: '[Rn] 7s¹' },
  { number: 88, symbol: 'Ra', name: '镭', mass: '226', category: '碱土金属', group: '2', period: 7, config: '[Rn] 7s²' },
  { number: 89, symbol: 'Ac', name: '锕', mass: '227', category: '锕系', group: '3', period: 7, config: '[Rn] 6d¹ 7s²' },
  { number: 90, symbol: 'Th', name: '钍', mass: '232.038', category: '锕系', group: '—', period: 7, config: '[Rn] 6d² 7s²' },
  { number: 91, symbol: 'Pa', name: '镤', mass: '231.036', category: '锕系', group: '—', period: 7, config: '[Rn] 5f² 6d¹ 7s²' },
  { number: 92, symbol: 'U', name: '铀', mass: '238.029', category: '锕系', group: '—', period: 7, config: '[Rn] 5f³ 6d¹ 7s²' },
  { number: 93, symbol: 'Np', name: '镎', mass: '237', category: '锕系', group: '—', period: 7, config: '[Rn] 5f⁴ 6d¹ 7s²' },
  { number: 94, symbol: 'Pu', name: '钚', mass: '244', category: '锕系', group: '—', period: 7, config: '[Rn] 5f⁶ 7s²' },
  { number: 95, symbol: 'Am', name: '镅', mass: '243', category: '锕系', group: '—', period: 7, config: '[Rn] 5f⁷ 7s²' },
  { number: 96, symbol: 'Cm', name: '锔', mass: '247', category: '锕系', group: '—', period: 7, config: '[Rn] 5f⁷ 6d¹ 7s²' },
  { number: 97, symbol: 'Bk', name: '锫', mass: '247', category: '锕系', group: '—', period: 7, config: '[Rn] 5f⁹ 7s²' },
  { number: 98, symbol: 'Cf', name: '锎', mass: '251', category: '锕系', group: '—', period: 7, config: '[Rn] 5f¹⁰ 7s²' },
  { number: 99, symbol: 'Es', name: '锿', mass: '252', category: '锕系', group: '—', period: 7, config: '[Rn] 5f¹¹ 7s²' },
  { number: 100, symbol: 'Fm', name: '镄', mass: '257', category: '锕系', group: '—', period: 7, config: '[Rn] 5f¹² 7s²' },
  { number: 101, symbol: 'Md', name: '钔', mass: '258', category: '锕系', group: '—', period: 7, config: '[Rn] 5f¹³ 7s²' },
  { number: 102, symbol: 'No', name: '锘', mass: '259', category: '锕系', group: '—', period: 7, config: '[Rn] 5f¹⁴ 7s²' },
  { number: 103, symbol: 'Lr', name: '铹', mass: '262', category: '锕系', group: '—', period: 7, config: '[Rn] 5f¹⁴ 7s² 7p¹' },
  { number: 104, symbol: 'Rf', name: '𬬻', mass: '267', category: '过渡金属', group: '4', period: 7, config: '[Rn] 5f¹⁴ 6d² 7s²' },
  { number: 105, symbol: 'Db', name: '𬭊', mass: '268', category: '过渡金属', group: '5', period: 7, config: '[Rn] 5f¹⁴ 6d³ 7s²' },
  { number: 106, symbol: 'Sg', name: '𬭳', mass: '269', category: '过渡金属', group: '6', period: 7, config: '[Rn] 5f¹⁴ 6d⁴ 7s²' },
  { number: 107, symbol: 'Bh', name: '𬭛', mass: '270', category: '过渡金属', group: '7', period: 7, config: '[Rn] 5f¹⁴ 6d⁵ 7s²' },
  { number: 108, symbol: 'Hs', name: '𬭶', mass: '269', category: '过渡金属', group: '8', period: 7, config: '[Rn] 5f¹⁴ 6d⁶ 7s²' },
  { number: 109, symbol: 'Mt', name: '鿏', mass: '278', category: '超铀元素', group: '9', period: 7, config: '[Rn] 5f¹⁴ 6d⁷ 7s²' },
  { number: 110, symbol: 'Ds', name: '𫟼', mass: '281', category: '超铀元素', group: '10', period: 7, config: '[Rn] 5f¹⁴ 6d⁸ 7s²' },
  { number: 111, symbol: 'Rg', name: '𬬭', mass: '281', category: '超铀元素', group: '11', period: 7, config: '[Rn] 5f¹⁴ 6d⁹ 7s²' },
  { number: 112, symbol: 'Cn', name: '鿔', mass: '285', category: '超铀元素', group: '12', period: 7, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s²' },
  { number: 113, symbol: 'Nh', name: '鿭', mass: '286', category: '超铀元素', group: '13', period: 7, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹' },
  { number: 114, symbol: 'Fl', name: '𫓧', mass: '289', category: '超铀元素', group: '14', period: 7, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²' },
  { number: 115, symbol: 'Mc', name: '镆', mass: '288', category: '超铀元素', group: '15', period: 7, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³' },
  { number: 116, symbol: 'Lv', name: '𫟷', mass: '293', category: '超铀元素', group: '16', period: 7, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴' },
  { number: 117, symbol: 'Ts', name: '鿬', mass: '294', category: '超铀元素', group: '17', period: 7, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵' },
  { number: 118, symbol: 'Og', name: '鿫', mass: '294', category: '稀有气体', group: '18', period: 7, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶' },
]

function categoryClass(category: string): string {
  const map: Record<string, string> = {
    '碱金属': 'alkali',
    '碱土金属': 'alkaline',
    '过渡金属': 'transition',
    '贫金属': 'poor',
    '类金属': 'metalloid',
    '非金属': 'nonmetal',
    '卤素': 'halogen',
    '稀有气体': 'noble',
    '镧系': 'lanthanide',
    '锕系': 'actinide',
    '超铀元素': 'superheavy',
  }
  return map[category] || ''
}

const filteredElements = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return elements.filter(el => {
    const matchSearch =
      !q ||
      el.name.includes(q) ||
      el.symbol.toLowerCase().includes(q) ||
      el.number.toString() === q
    const matchCategory = !categoryFilter.value || el.category === categoryFilter.value
    return matchSearch && matchCategory
  })
})

function selectElement(el: ChemicalElement): void {
  selectedElement.value = el
  showModal.value = true
}
</script>

<style scoped>
.periodic-table {
  max-width: 1200px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 8px;
}

.element-card {
  border: 1px solid #e0e0e6;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  background: #fff;
  min-height: 90px;
  display: flex;
  flex-direction: column;
}

.element-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark .element-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.09);
}

.atomic-number {
  font-size: 11px;
  color: #888;
}

.symbol {
  font-size: 22px;
  font-weight: 700;
  margin: 4px 0;
}

.name {
  font-size: 12px;
  color: #555;
  flex: 1;
}

.mass {
  font-size: 11px;
  color: #999;
  font-family: 'Fira Code', monospace;
}

.dark .name { color: #ccc; }
.dark .mass { color: #888; }
.dark .atomic-number { color: #aaa; }

/* category colors */
.alkali { border-top: 3px solid #ff6b6b; }
.alkaline { border-top: 3px solid #ff9f43; }
.transition { border-top: 3px solid #feca57; }
.poor { border-top: 3px solid #48dbfb; }
.metalloid { border-top: 3px solid #1dd1a1; }
.nonmetal { border-top: 3px solid #10ac84; }
.halogen { border-top: 3px solid #5f27cd; }
.noble { border-top: 3px solid #341f97; }
.lanthanide { border-top: 3px solid #ff9ff3; }
.actinide { border-top: 3px solid #f368e0; }
.superheavy { border-top: 3px solid #8395a7; }

.detail-content {
  padding: 8px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-symbol {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  background: #f5f7fa;
  border: 1px solid #e0e0e6;
}

.dark .detail-symbol {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.09);
}

.detail-name {
  font-size: 20px;
  font-weight: 600;
}

.detail-category {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}
</style>

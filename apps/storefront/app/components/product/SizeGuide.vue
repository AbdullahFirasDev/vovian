<script setup lang="ts">
/** Size charts by product type. Measurements are body measurements in cm. */
const props = defineProps<{ guide: 'apparel' | 'denim' | 'shoes' | 'none'; department: 'women' | 'men' | 'unisex' }>()
const unit = ref<'cm' | 'in'>('cm')
const conv = (cm: number) => (unit.value === 'cm' ? cm : Math.round((cm / 2.54) * 10) / 10)
const range = (a: number, b: number) => `${conv(a)}–${conv(b)}`

const apparelWomen = [
  ['XS', [80, 84], [62, 66], [88, 92], '6', '34'],
  ['S', [84, 88], [66, 70], [92, 96], '8', '36'],
  ['M', [88, 92], [70, 74], [96, 100], '10', '38'],
  ['L', [92, 98], [74, 80], [100, 106], '12', '40'],
  ['XL', [98, 104], [80, 86], [106, 112], '14', '42'],
] as const
const apparelMen = [
  ['S', [88, 94], [74, 80], [90, 96], '36', '46'],
  ['M', [94, 100], [80, 86], [96, 102], '38', '48'],
  ['L', [100, 106], [86, 92], [102, 108], '40', '50'],
  ['XL', [106, 112], [92, 98], [108, 114], '42', '52'],
  ['XXL', [112, 118], [98, 104], [114, 120], '44', '54'],
] as const
const denim = Array.from({ length: 10 }, (_, i) => 25 + i).map((w) => [String(w), Math.round(w * 2.54), Math.round(w * 2.54 + 24)] as const)
const shoes = [
  ['36', 23, '3', '5.5'], ['37', 23.7, '4', '6.5'], ['38', 24.3, '5', '7.5'], ['39', 25, '6', '8.5'],
  ['40', 25.7, '6.5', '9'], ['41', 26.3, '7.5', '10'], ['42', 27, '8', '10.5'], ['43', 27.7, '9', '11.5'],
  ['44', 28.3, '9.5', '12'], ['45', 29, '10.5', '13'],
] as const

const apparel = computed(() => (props.department === 'men' ? apparelMen : apparelWomen))
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between gap-4">
      <p class="text-[14px] text-graphite">{{ $t('sizeGuide.howTo') }}</p>
      <div class="flex border border-mist" role="group" :aria-label="$t('sizeGuide.units')">
        <button v-for="u in ['cm', 'in'] as const" :key="u" type="button" class="h-9 px-3 text-[13px] cursor-pointer" :class="unit === u ? 'bg-ink text-white' : ''" :aria-pressed="unit === u" @click="unit = u">{{ u }}</button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table v-if="guide === 'apparel'" class="w-full min-w-[520px] text-[14px]">
        <caption class="sr-only">{{ $t('sizeGuide.apparelCaption') }}</caption>
        <thead class="text-start text-graphite">
          <tr class="border-b border-mist">
            <th scope="col" class="py-3 text-start font-normal">{{ $t('sizeGuide.size') }}</th>
            <th scope="col" class="py-3 text-start font-normal">{{ $t('sizeGuide.chest') }}</th>
            <th scope="col" class="py-3 text-start font-normal">{{ $t('sizeGuide.waist') }}</th>
            <th scope="col" class="py-3 text-start font-normal">{{ $t('sizeGuide.hips') }}</th>
            <th scope="col" class="py-3 text-start font-normal">UK / US</th>
            <th scope="col" class="py-3 text-start font-normal">EU / IT</th>
          </tr>
        </thead>
        <tbody class="tabular-nums">
          <tr v-for="row in apparel" :key="row[0]" class="border-b border-mist">
            <th scope="row" class="py-3 text-start font-medium">{{ row[0] }}</th>
            <td>{{ range(row[1][0], row[1][1]) }}</td>
            <td>{{ range(row[2][0], row[2][1]) }}</td>
            <td>{{ range(row[3][0], row[3][1]) }}</td>
            <td>{{ row[4] }}</td>
            <td>{{ row[5] }}</td>
          </tr>
        </tbody>
      </table>

      <table v-else-if="guide === 'denim'" class="w-full min-w-[360px] text-[14px]">
        <caption class="sr-only">{{ $t('sizeGuide.denimCaption') }}</caption>
        <thead class="text-graphite">
          <tr class="border-b border-mist">
            <th scope="col" class="py-3 text-start font-normal">{{ $t('sizeGuide.waistSize') }}</th>
            <th scope="col" class="py-3 text-start font-normal">{{ $t('sizeGuide.waist') }}</th>
            <th scope="col" class="py-3 text-start font-normal">{{ $t('sizeGuide.hips') }}</th>
          </tr>
        </thead>
        <tbody class="tabular-nums">
          <tr v-for="row in denim" :key="row[0]" class="border-b border-mist">
            <th scope="row" class="py-3 text-start font-medium">{{ row[0] }}</th>
            <td>{{ conv(row[1]) }}</td>
            <td>{{ conv(row[2]) }}</td>
          </tr>
        </tbody>
      </table>

      <table v-else-if="guide === 'shoes'" class="w-full min-w-[360px] text-[14px]">
        <caption class="sr-only">{{ $t('sizeGuide.shoesCaption') }}</caption>
        <thead class="text-graphite">
          <tr class="border-b border-mist">
            <th scope="col" class="py-3 text-start font-normal">EU</th>
            <th scope="col" class="py-3 text-start font-normal">{{ $t('sizeGuide.footLength') }}</th>
            <th scope="col" class="py-3 text-start font-normal">UK</th>
            <th scope="col" class="py-3 text-start font-normal">US</th>
          </tr>
        </thead>
        <tbody class="tabular-nums">
          <tr v-for="row in shoes" :key="row[0]" class="border-b border-mist">
            <th scope="row" class="py-3 text-start font-medium">{{ row[0] }}</th>
            <td>{{ conv(row[1]) }}</td>
            <td>{{ row[2] }}</td>
            <td>{{ row[3] }}</td>
          </tr>
        </tbody>
      </table>

      <p v-else class="text-[15px]">{{ $t('sizeGuide.oneSize') }}</p>
    </div>
  </div>
</template>

<template>
  <div style="text-align: center; color: var(--text-color); border: 2px dashed #0EA5E9; padding: 2rem; border-radius: 8px;">
    <h2>🗺️ Mapa Mundi (Placeholder)</h2>
    <p>Para ver o mapa animado, você precisa instalar o componente do Inspira UI.</p>
    <p style="margin-top: 10px;">Rode este comando no terminal do seu computador (dentro da pasta client):</p>
    <code style="display: block; margin: 10px auto; background: #222; padding: 10px; border-radius: 5px; color: #0EA5E9">npx --yes inspira-ui add world-map</code>
    <p style="font-size: 0.9em; opacity: 0.8">Isso irá sobrescrever este arquivo com o mapa real.</p>
  </div>
</template>

<script setup>
defineProps({
  dots: {
    type: Array,
    default: () => []
  },
  lineColor: String,
  mapColor: String,
  mapBgColor: String
})
</script>

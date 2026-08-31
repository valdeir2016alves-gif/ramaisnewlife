<template>
  <div class="map-container" style="position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
    <div style="position: relative; max-width: 100%; height: 100%; display: inline-block;">
      <img src="/mapa-rs.png" alt="Mapa Rio Grande do Sul" style="max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5)); display: block; height: 100%;" />
      
      <!-- Os valores top/left e width/height são aproximados para cobrir as bolinhas desenhadas no mapa.
           Como o link é invisível, o usuário clica sobre a área da bolinha/texto na imagem. -->
           
      <!-- Passo Fundo -->
      <a 
        href="https://maps.app.goo.gl/PpgQ7njKqZVgV5RX8" 
        target="_blank" 
        rel="noopener noreferrer"
        style="position: absolute; top: 12%; left: 56%; width: 35%; height: 14%; text-decoration: none; display: block; z-index: 10; cursor: pointer;"
        title="Passo Fundo - Abrir no Google Maps"
      >
      </a>

      <!-- São Gabriel -->
      <a 
        href="https://maps.app.goo.gl/23wyXd51is7cikXk9" 
        target="_blank" 
        rel="noopener noreferrer"
        style="position: absolute; top: 55%; left: 33%; width: 35%; height: 14%; text-decoration: none; display: block; z-index: 10; cursor: pointer;"
        title="São Gabriel - Abrir no Google Maps"
      >
      </a>

      <!-- Bagé -->
      <a 
        href="https://maps.app.goo.gl/N2ddEn5xJ6GAc9TF6" 
        target="_blank" 
        rel="noopener noreferrer"
        style="position: absolute; top: 68%; left: 37%; width: 25%; height: 14%; text-decoration: none; display: block; z-index: 10; cursor: pointer;"
        title="Bagé - Abrir no Google Maps"
      >
      </a>
    </div>
  </div>
</template>

<script setup>
// O mapa antigo (WorldMap.vue) foi removido em favor desta imagem estática
// Os links ficam posicionados por cima da imagem original usando CSS absolute.
</script>

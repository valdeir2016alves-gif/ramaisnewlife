<template>
  <div class="map-layout" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 2rem; padding: 1rem;">
    
    <!-- Lado Esquerdo: Endereços -->
    <div class="addresses-container" style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem; justify-content: center;">
      
      <!-- Passo Fundo -->
      <a href="https://maps.app.goo.gl/PpgQ7njKqZVgV5RX8" target="_blank" rel="noopener noreferrer" style="display: flex; gap: 1rem; align-items: center; text-decoration: none; color: var(--text-main); padding: 1rem; background: var(--card-bg); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s; cursor: pointer;" onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateX(5px)';" onmouseout="this.style.background='var(--card-bg)'; this.style.transform='none';">
        <div style="font-size: 2rem;">📍</div>
        <div>
          <h4 style="margin: 0 0 0.25rem 0; color: var(--primary-color);">Unidade Passo Fundo</h4>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Av. Brasil Centro, 104 - Centro<br/>Passo Fundo - RS, 99025-000</p>
        </div>
      </a>

      <!-- São Gabriel -->
      <a href="https://maps.app.goo.gl/23wyXd51is7cikXk9" target="_blank" rel="noopener noreferrer" style="display: flex; gap: 1rem; align-items: center; text-decoration: none; color: var(--text-main); padding: 1rem; background: var(--card-bg); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s; cursor: pointer;" onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateX(5px)';" onmouseout="this.style.background='var(--card-bg)'; this.style.transform='none';">
        <div style="font-size: 2rem;">📍</div>
        <div>
          <h4 style="margin: 0 0 0.25rem 0; color: var(--primary-color);">Unidade São Gabriel</h4>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">R. General Mallet, 497 - Centro<br/>São Gabriel - RS, 97300-000</p>
        </div>
      </a>

      <!-- Bagé -->
      <a href="https://maps.app.goo.gl/N2ddEn5xJ6GAc9TF6" target="_blank" rel="noopener noreferrer" style="display: flex; gap: 1rem; align-items: center; text-decoration: none; color: var(--text-main); padding: 1rem; background: var(--card-bg); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s; cursor: pointer;" onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateX(5px)';" onmouseout="this.style.background='var(--card-bg)'; this.style.transform='none';">
        <div style="font-size: 2rem;">📍</div>
        <div>
          <h4 style="margin: 0 0 0.25rem 0; color: var(--primary-color);">Unidade Bagé</h4>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">Av. Sete de Setembro, 659 - Centro<br/>Bagé - RS, 96400-006</p>
        </div>
      </a>

    </div>

    <!-- Lado Direito: Imagem do Mapa -->
    <div class="map-image-container" style="flex: 1; height: 100%; display: flex; justify-content: center; align-items: center;">
      <img src="/mapa-rs.png" alt="Mapa Rio Grande do Sul" style="max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));" />
    </div>

  </div>
</template>

<script setup>
</script>

<style scoped>
@media (max-width: 768px) {
  .map-layout {
    flex-direction: column-reverse !important;
    overflow-y: auto;
    height: auto !important;
  }
  .map-image-container {
    height: 250px !important;
  }
}
</style>

<template>
  <div class="map-layout">
    
    <!-- Lado Esquerdo: Cards no Layout Original -->
    <div class="addresses-container">
      
      <!-- Passo Fundo -->
      <a 
        href="https://maps.app.goo.gl/PpgQ7njKqZVgV5RX8" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="address-card"
        :class="{ 'card-active': activeUnit === 'passoFundo' }"
        @mouseenter="activeUnit = 'passoFundo'"
        @mouseleave="activeUnit = null"
      >
        <div class="pin-icon">📍</div>
        <div>
          <h4 class="card-title">Unidade Passo Fundo</h4>
          <p class="card-text">Av. Brasil Centro, 104 - Centro<br/>Passo Fundo - RS, 99025-000</p>
        </div>
      </a>

      <!-- São Gabriel -->
      <a 
        href="https://maps.app.goo.gl/23wyXd51is7cikXk9" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="address-card"
        :class="{ 'card-active': activeUnit === 'saoGabriel' }"
        @mouseenter="activeUnit = 'saoGabriel'"
        @mouseleave="activeUnit = null"
      >
        <div class="pin-icon">📍</div>
        <div>
          <h4 class="card-title">Unidade São Gabriel</h4>
          <p class="card-text">R. General Mallet, 497 - Centro<br/>São Gabriel - RS, 97300-000</p>
        </div>
      </a>

      <!-- Bagé -->
      <a 
        href="https://maps.app.goo.gl/N2ddEn5xJ6GAc9TF6" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="address-card"
        :class="{ 'card-active': activeUnit === 'bage' }"
        @mouseenter="activeUnit = 'bage'"
        @mouseleave="activeUnit = null"
      >
        <div class="pin-icon">📍</div>
        <div>
          <h4 class="card-title">Unidade Bagé</h4>
          <p class="card-text">Av. Sete de Setembro, 659 - Centro<br/>Bagé - RS, 96400-006</p>
        </div>
      </a>

    </div>

    <!-- Lado Direito: Mapa Cyber Completo e Amplo (Preenchimento Total) -->
    <div class="map-image-container">
      <svg 
        class="cyber-svg-stage" 
        viewBox="0 0 800 600" 
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <!-- Filtros de Brilho Neon -->
          <filter id="neonBloomCyan" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="9" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="neonBloomMagenta" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="neonBloomGreen" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <!-- Gradiente do Território do RS -->
          <linearGradient id="rsStateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#072942" stop-opacity="0.9" />
            <stop offset="50%" stop-color="#041628" stop-opacity="0.95" />
            <stop offset="100%" stop-color="#020d18" stop-opacity="0.98" />
          </linearGradient>

          <!-- Padrão de Circuito Interno do RS -->
          <pattern id="circuitPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 0 20 L 15 20 L 25 30 L 40 30" fill="none" stroke="rgba(0, 240, 255, 0.16)" stroke-width="0.8" />
            <path d="M 20 0 L 20 12 L 30 22 L 30 40" fill="none" stroke="rgba(0, 240, 255, 0.1)" stroke-width="0.8" />
            <circle cx="15" cy="20" r="1.5" fill="rgba(0, 240, 255, 0.35)" />
            <circle cx="25" cy="30" r="1.5" fill="rgba(0, 240, 255, 0.3)" />
            <circle cx="20" cy="12" r="1.2" fill="rgba(0, 240, 255, 0.25)" />
          </pattern>

          <!-- Padrão de Grade Cyber do Fundo -->
          <pattern id="cyberGrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(0, 220, 255, 0.05)" stroke-width="0.7" />
            <circle cx="0" cy="0" r="1" fill="rgba(0, 240, 255, 0.12)" />
          </pattern>

          <!-- Gradientes das Linhas de Conexão Laser -->
          <linearGradient id="gradPfSg" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#00f0ff" />
            <stop offset="50%" stop-color="#805ad5" />
            <stop offset="100%" stop-color="#e879f9" />
          </linearGradient>

          <linearGradient id="gradSgBg" x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stop-color="#e879f9" />
            <stop offset="50%" stop-color="#22d3ee" />
            <stop offset="100%" stop-color="#34d399" />
          </linearGradient>

          <linearGradient id="gradPfBg" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#00f0ff" />
            <stop offset="60%" stop-color="#10b981" />
            <stop offset="100%" stop-color="#34d399" />
          </linearGradient>

          <!-- Feixe Holográfico Vertical (Pilares de Luz) -->
          <linearGradient id="beamGradPf" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.9" />
            <stop offset="30%" stop-color="#00f0ff" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#00f0ff" stop-opacity="0" />
          </linearGradient>

          <linearGradient id="beamGradSg" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#e879f9" stop-opacity="0.9" />
            <stop offset="30%" stop-color="#e879f9" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#e879f9" stop-opacity="0" />
          </linearGradient>

          <linearGradient id="beamGradBg" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#34d399" stop-opacity="0.9" />
            <stop offset="30%" stop-color="#34d399" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#34d399" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- 1. FUNDO CYBERNETIC GRID TOTAL (Sem Margens Vazias) -->
        <rect width="800" height="600" fill="#040b15" />
        <rect width="800" height="600" fill="url(#cyberGrid)" />

        <!-- Trilhas de Circuito de Borda a Borda -->
        <g class="cyber-ground-circuits" opacity="0.45">
          <path d="M 40 120 L 160 120 L 190 150 L 320 150" fill="none" stroke="rgba(0, 240, 255, 0.2)" stroke-width="1" />
          <circle cx="320" cy="150" r="2.5" fill="rgba(0, 240, 255, 0.4)" />
          <path d="M 580 480 L 680 480 L 710 510 L 760 510" fill="none" stroke="rgba(0, 240, 255, 0.2)" stroke-width="1" />
          <circle cx="580" cy="480" r="2.5" fill="rgba(0, 240, 255, 0.4)" />
          <path d="M 60 520 L 170 520 L 200 490 L 280 490" fill="none" stroke="rgba(0, 240, 255, 0.15)" stroke-width="1" />
          <path d="M 520 40 L 560 80 L 680 80" fill="none" stroke="rgba(0, 240, 255, 0.2)" stroke-width="1" />
        </g>

        <!-- 2. ELEMENTOS HUD TÁTICOS DISTRIBUÍDOS -->
        <!-- Radar Tático no Canto Superior Esquerdo -->
        <g class="hud-tactical-radar" transform="translate(65, 65)">
          <circle cx="0" cy="0" r="32" fill="rgba(0, 240, 255, 0.02)" stroke="rgba(0, 240, 255, 0.25)" stroke-width="0.8" stroke-dasharray="3 3" />
          <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(0, 240, 255, 0.2)" stroke-width="0.6" />
          <circle cx="0" cy="0" r="6" fill="none" stroke="rgba(0, 240, 255, 0.4)" stroke-width="0.8" />
          <line x1="-36" y1="0" x2="36" y2="0" stroke="rgba(0, 240, 255, 0.2)" stroke-width="0.6" />
          <line x1="0" y1="-36" x2="0" y2="36" stroke="rgba(0, 240, 255, 0.2)" stroke-width="0.6" />
          <line x1="0" y1="0" x2="22" y2="-22" stroke="#00f0ff" stroke-width="1.2" class="radar-sweep-hand" />
          <text x="36" y="-15" fill="rgba(0, 240, 255, 0.6)" font-size="8" font-family="monospace">SEC // RS-43</text>
          <text x="36" y="-4" fill="rgba(0, 240, 255, 0.4)" font-size="7" font-family="monospace">30.0346°S / 51.2177°W</text>
        </g>

        <!-- Telemetria no Canto Inferior Direito -->
        <g class="hud-telemetry" transform="translate(620, 545)">
          <text x="0" y="0" fill="rgba(0, 240, 255, 0.5)" font-size="7.5" font-family="monospace">SYS.STATUS: ONLINE</text>
          <text x="0" y="11" fill="rgba(0, 240, 255, 0.35)" font-size="7" font-family="monospace">01001001 00101001</text>
          <text x="0" y="22" fill="rgba(0, 240, 255, 0.35)" font-size="7" font-family="monospace">LAT: 28°~33°S // FIBER 10G</text>
        </g>

        <!-- Molduras / Brackets de Canto Ajustadas aos Extremos -->
        <path d="M 18 35 L 18 18 L 35 18" fill="none" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.2" />
        <path d="M 782 35 L 782 18 L 765 18" fill="none" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.2" />
        <path d="M 18 565 L 18 582 L 35 582" fill="none" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.2" />
        <path d="M 782 565 L 782 582 L 765 582" fill="none" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.2" />

        <!-- 3. GRUPO CENTRAL DO MAPA E NÓS (Centralizado no Canvas de 800) -->
        <g transform="translate(100, 0)">
          
          <!-- Camada de Relevo Suave / Sombra Holográfica -->
          <g transform="translate(4, 6)">
            <path 
              :d="RS_PATH_D" 
              fill="none" 
              stroke="rgba(0, 200, 255, 0.2)" 
              stroke-width="2.5" 
              filter="url(#neonBloomCyan)"
            />
            <path 
              :d="RS_PATH_D" 
              fill="#020914" 
              opacity="0.75" 
            />
          </g>

          <!-- Território Principal -->
          <path 
            :d="RS_PATH_D" 
            fill="url(#rsStateGrad)" 
          />

          <!-- Circuito Texturizado Sobreposto ao Território -->
          <path 
            :d="RS_PATH_D" 
            fill="url(#circuitPattern)" 
            opacity="0.85" 
          />

          <!-- Contorno Externo Neon com Brilho Intenso -->
          <path 
            :d="RS_PATH_D" 
            fill="none" 
            stroke="#00c8e6" 
            stroke-width="3.5" 
            opacity="0.5" 
            filter="url(#neonBloomCyan)" 
          />
          <path 
            :d="RS_PATH_D" 
            fill="none" 
            stroke="#00f0ff" 
            stroke-width="1.6" 
            stroke-linejoin="round" 
            stroke-linecap="round" 
          />

          <!-- 4. ARCOS DE FIBRA ÓPTICA / FEIXES LASER ENTRE OS HUBS -->
          <!-- Arco 1: Passo Fundo <-> São Gabriel -->
          <g class="network-arc-group" :class="{ 'arc-highlighted': activeUnit === 'passoFundo' || activeUnit === 'saoGabriel' }">
            <path 
              d="M 384.1 133.6 C 305 130, 215 205, 256.7 293.8" 
              fill="none" 
              stroke="url(#gradPfSg)" 
              stroke-width="5" 
              opacity="0.3" 
              filter="url(#neonBloomCyan)" 
            />
            <path 
              d="M 384.1 133.6 C 305 130, 215 205, 256.7 293.8" 
              fill="none" 
              stroke="url(#gradPfSg)" 
              stroke-width="1.8" 
              class="laser-beam" 
            />
            <path 
              d="M 384.1 133.6 C 315 120, 205 195, 256.7 293.8" 
              fill="none" 
              stroke="rgba(0, 240, 255, 0.4)" 
              stroke-width="0.9" 
              stroke-dasharray="4 6" 
            />
            <path 
              d="M 384.1 133.6 C 305 130, 215 205, 256.7 293.8" 
              fill="none" 
              stroke="#ffffff" 
              stroke-width="2.5" 
              stroke-linecap="round" 
              class="data-pulse pulse-fast" 
            />
          </g>

          <!-- Arco 2: São Gabriel <-> Bagé -->
          <g class="network-arc-group" :class="{ 'arc-highlighted': activeUnit === 'saoGabriel' || activeUnit === 'bage' }">
            <path 
              d="M 256.7 293.8 C 220 315, 230 355, 270.9 370.7" 
              fill="none" 
              stroke="url(#gradSgBg)" 
              stroke-width="4.5" 
              opacity="0.3" 
              filter="url(#neonBloomMagenta)" 
            />
            <path 
              d="M 256.7 293.8 C 220 315, 230 355, 270.9 370.7" 
              fill="none" 
              stroke="url(#gradSgBg)" 
              stroke-width="1.8" 
              class="laser-beam" 
            />
            <path 
              d="M 256.7 293.8 C 210 320, 222 360, 270.9 370.7" 
              fill="none" 
              stroke="rgba(232, 121, 249, 0.4)" 
              stroke-width="0.9" 
              stroke-dasharray="3 5" 
            />
            <path 
              d="M 256.7 293.8 C 220 315, 230 355, 270.9 370.7" 
              fill="none" 
              stroke="#ffffff" 
              stroke-width="2.5" 
              stroke-linecap="round" 
              class="data-pulse pulse-med" 
            />
          </g>

          <!-- Arco 3: Passo Fundo <-> Bagé (Backbone Norte-Sul) -->
          <g class="network-arc-group" :class="{ 'arc-highlighted': activeUnit === 'passoFundo' || activeUnit === 'bage' }">
            <path 
              d="M 384.1 133.6 C 410 240, 360 330, 270.9 370.7" 
              fill="none" 
              stroke="url(#gradPfBg)" 
              stroke-width="4.5" 
              opacity="0.25" 
              filter="url(#neonBloomGreen)" 
            />
            <path 
              d="M 384.1 133.6 C 410 240, 360 330, 270.9 370.7" 
              fill="none" 
              stroke="url(#gradPfBg)" 
              stroke-width="1.8" 
              class="laser-beam" 
            />
            <path 
              d="M 384.1 133.6 C 425 245, 375 340, 270.9 370.7" 
              fill="none" 
              stroke="rgba(52, 211, 153, 0.4)" 
              stroke-width="0.9" 
              stroke-dasharray="4 6" 
            />
            <path 
              d="M 384.1 133.6 C 410 240, 360 330, 270.9 370.7" 
              fill="none" 
              stroke="#ffffff" 
              stroke-width="2.5" 
              stroke-linecap="round" 
              class="data-pulse pulse-slow" 
            />
          </g>

          <!-- 5. NÓS DAS CIDADES (LOCALIZAÇÕES GEOGRÁFICAS EXATAS IBGE) -->

          <!-- ===== CIDADE 1: PASSO FUNDO (X: 384.1, Y: 133.6) ===== -->
          <g 
            class="city-node-group node-pf" 
            :class="{ 'node-active': activeUnit === 'passoFundo' }"
            @mouseenter="activeUnit = 'passoFundo'"
            @mouseleave="activeUnit = null"
            @click="openMap('https://maps.app.goo.gl/PpgQ7njKqZVgV5RX8')"
          >
            <polygon points="377 133.6, 391 133.6, 386 65, 382 65" fill="url(#beamGradPf)" class="holo-vertical-beam" />
            <line x1="384.1" y1="133.6" x2="384.1" y2="55" stroke="rgba(0, 240, 255, 0.8)" stroke-width="1.2" stroke-dasharray="2 3" class="beam-core-line" />

            <circle cx="384.1" cy="133.6" r="24" fill="none" stroke="rgba(0, 240, 255, 0.2)" stroke-width="1" class="radar-ping-ring ring-1" />
            <circle cx="384.1" cy="133.6" r="18" fill="none" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1" stroke-dasharray="4 3" class="radar-dash-ring" />
            <circle cx="384.1" cy="133.6" r="11" fill="rgba(0, 240, 255, 0.08)" stroke="#00f0ff" stroke-width="1.2" />
            
            <line x1="384.1" y1="119" x2="384.1" y2="123" stroke="#00f0ff" stroke-width="1.5" />
            <line x1="384.1" y1="144" x2="384.1" y2="148" stroke="#00f0ff" stroke-width="1.5" />
            <line x1="370" y1="133.6" x2="374" y2="133.6" stroke="#00f0ff" stroke-width="1.5" />
            <line x1="394" y1="133.6" x2="398" y2="133.6" stroke="#00f0ff" stroke-width="1.5" />

            <circle cx="384.1" cy="133.6" r="4" fill="#ffffff" filter="url(#neonBloomCyan)" />
            <circle cx="384.1" cy="133.6" r="2" fill="#00f0ff" />

            <polyline points="384.1 133.6, 420 95, 455 95" fill="none" stroke="#00f0ff" stroke-width="1.2" />
            <circle cx="420" cy="95" r="2" fill="#00f0ff" />

            <g class="hud-label-box" transform="translate(455, 74)">
              <rect x="0" y="0" width="130" height="42" rx="4" fill="rgba(4, 18, 32, 0.92)" stroke="#00f0ff" stroke-width="1.2" filter="url(#neonBloomCyan)" />
              <path d="M 0 6 L 6 0" stroke="#00f0ff" stroke-width="1.5" fill="none" />
              <path d="M 130 36 L 124 42" stroke="#00f0ff" stroke-width="1.5" fill="none" />
              <text x="10" y="16" fill="#00f0ff" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="11.5" letter-spacing="1">PASSO FUNDO</text>
              <text x="10" y="30" fill="rgba(0, 240, 255, 0.75)" font-family="monospace" font-size="8">HUB NORTE // 99025-000</text>
              <circle cx="118" cy="14" r="3" fill="#00f0ff" class="tag-status-light" />
            </g>
          </g>

          <!-- ===== CIDADE 2: SÃO GABRIEL (X: 256.7, Y: 293.8) ===== -->
          <g 
            class="city-node-group node-sg" 
            :class="{ 'node-active': activeUnit === 'saoGabriel' }"
            @mouseenter="activeUnit = 'saoGabriel'"
            @mouseleave="activeUnit = null"
            @click="openMap('https://maps.app.goo.gl/23wyXd51is7cikXk9')"
          >
            <polygon points="250 293.8, 263 293.8, 259 225, 255 225" fill="url(#beamGradSg)" class="holo-vertical-beam" />
            <line x1="256.7" y1="293.8" x2="256.7" y2="215" stroke="rgba(232, 121, 249, 0.8)" stroke-width="1.2" stroke-dasharray="2 3" class="beam-core-line" />

            <circle cx="256.7" cy="293.8" r="24" fill="none" stroke="rgba(232, 121, 249, 0.2)" stroke-width="1" class="radar-ping-ring ring-2" />
            <circle cx="256.7" cy="293.8" r="18" fill="none" stroke="rgba(232, 121, 249, 0.4)" stroke-width="1" stroke-dasharray="4 3" class="radar-dash-ring" />
            <circle cx="256.7" cy="293.8" r="11" fill="rgba(232, 121, 249, 0.08)" stroke="#e879f9" stroke-width="1.2" />

            <line x1="256.7" y1="279" x2="256.7" y2="283" stroke="#e879f9" stroke-width="1.5" />
            <line x1="256.7" y1="304" x2="256.7" y2="308" stroke="#e879f9" stroke-width="1.5" />
            <line x1="242" y1="293.8" x2="246" y2="293.8" stroke="#e879f9" stroke-width="1.5" />
            <line x1="267" y1="293.8" x2="271" y2="293.8" stroke="#e879f9" stroke-width="1.5" />

            <circle cx="256.7" cy="293.8" r="4" fill="#ffffff" filter="url(#neonBloomMagenta)" />
            <circle cx="256.7" cy="293.8" r="2" fill="#e879f9" />

            <polyline points="256.7 293.8, 205 260, 165 260" fill="none" stroke="#e879f9" stroke-width="1.2" />
            <circle cx="205" cy="260" r="2" fill="#e879f9" />

            <g class="hud-label-box" transform="translate(35, 239)">
              <rect x="0" y="0" width="130" height="42" rx="4" fill="rgba(26, 4, 30, 0.92)" stroke="#e879f9" stroke-width="1.2" filter="url(#neonBloomMagenta)" />
              <path d="M 0 6 L 6 0" stroke="#e879f9" stroke-width="1.5" fill="none" />
              <path d="M 130 36 L 124 42" stroke="#e879f9" stroke-width="1.5" fill="none" />
              <text x="10" y="16" fill="#e879f9" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="11.5" letter-spacing="1">SÃO GABRIEL</text>
              <text x="10" y="30" fill="rgba(232, 121, 249, 0.75)" font-family="monospace" font-size="8">HUB OESTE // 97300-000</text>
              <circle cx="118" cy="14" r="3" fill="#e879f9" class="tag-status-light" />
            </g>
          </g>

          <!-- ===== CIDADE 3: BAGÉ (X: 270.9, Y: 370.7) ===== -->
          <g 
            class="city-node-group node-bg" 
            :class="{ 'node-active': activeUnit === 'bage' }"
            @mouseenter="activeUnit = 'bage'"
            @mouseleave="activeUnit = null"
            @click="openMap('https://maps.app.goo.gl/N2ddEn5xJ6GAc9TF6')"
          >
            <polygon points="264 370.7, 278 370.7, 273 302, 269 302" fill="url(#beamGradBg)" class="holo-vertical-beam" />
            <line x1="270.9" y1="370.7" x2="270.9" y2="292" stroke="rgba(52, 211, 153, 0.8)" stroke-width="1.2" stroke-dasharray="2 3" class="beam-core-line" />

            <circle cx="270.9" cy="370.7" r="24" fill="none" stroke="rgba(52, 211, 153, 0.2)" stroke-width="1" class="radar-ping-ring ring-3" />
            <circle cx="270.9" cy="370.7" r="18" fill="none" stroke="rgba(52, 211, 153, 0.4)" stroke-width="1" stroke-dasharray="4 3" class="radar-dash-ring" />
            <circle cx="270.9" cy="370.7" r="11" fill="rgba(52, 211, 153, 0.08)" stroke="#34d399" stroke-width="1.2" />

            <line x1="270.9" y1="356" x2="270.9" y2="360" stroke="#34d399" stroke-width="1.5" />
            <line x1="270.9" y1="381" x2="270.9" y2="385" stroke="#34d399" stroke-width="1.5" />
            <line x1="256" y1="370.7" x2="260" y2="370.7" stroke="#34d399" stroke-width="1.5" />
            <line x1="281" y1="370.7" x2="285" y2="370.7" stroke="#34d399" stroke-width="1.5" />

            <circle cx="270.9" cy="370.7" r="4" fill="#ffffff" filter="url(#neonBloomGreen)" />
            <circle cx="270.9" cy="370.7" r="2" fill="#34d399" />

            <polyline points="270.9 370.7, 215 405, 175 405" fill="none" stroke="#34d399" stroke-width="1.2" />
            <circle cx="215" cy="405" r="2" fill="#34d399" />

            <g class="hud-label-box" transform="translate(45, 384)">
              <rect x="0" y="0" width="130" height="42" rx="4" fill="rgba(3, 24, 18, 0.92)" stroke="#34d399" stroke-width="1.2" filter="url(#neonBloomGreen)" />
              <path d="M 0 6 L 6 0" stroke="#34d399" stroke-width="1.5" fill="none" />
              <path d="M 130 36 L 124 42" stroke="#34d399" stroke-width="1.5" fill="none" />
              <text x="10" y="16" fill="#34d399" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="11.5" letter-spacing="1">BAGÉ</text>
              <text x="10" y="30" fill="rgba(52, 211, 153, 0.75)" font-family="monospace" font-size="8">HUB SUL // 96400-006</text>
              <circle cx="118" cy="14" r="3" fill="#34d399" class="tag-status-light" />
            </g>
          </g>

        </g>
      </svg>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { RS_PATH_D } from './rsPathData.js';

// Unidade atualmente destacada (hover no card ou no mapa)
const activeUnit = ref(null);

const openMap = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};
</script>

<style scoped>
.map-layout {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 1.5rem;
  padding: 0;
}

/* Lado Esquerdo: Cards com Estilo e Layout Original */
.addresses-container {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  justify-content: center;
}

.address-card {
  display: flex;
  gap: 1rem;
  align-items: center;
  text-decoration: none;
  color: var(--text-main);
  padding: 1rem 1.15rem;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.address-card:hover,
.address-card.card-active {
  background: rgba(255, 255, 255, 0.05);
  transform: translateX(5px);
  border-color: rgba(0, 240, 255, 0.35);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.pin-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.card-title {
  margin: 0 0 0.25rem 0;
  color: var(--primary-color);
  font-size: 1.05rem;
  font-weight: 600;
}

.card-text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
}

/* Lado Direito: Container do Mapa Cyber Completo (Preenchimento Total) */
.map-image-container {
  flex: 1;
  height: 100%;
  width: 100%;
  min-height: 480px;
  display: flex;
  justify-content: center;
  align-items: stretch;
  background: #040b15;
  border-radius: 14px;
  border: 1px solid rgba(0, 240, 255, 0.18);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(0, 240, 255, 0.04);
  overflow: hidden;
}

.cyber-svg-stage {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
}

/* Animações e Efeitos SVG */
.laser-beam {
  stroke-linecap: round;
  transition: stroke-width 0.3s ease, filter 0.3s ease;
}

.network-arc-group.arc-highlighted .laser-beam {
  stroke-width: 3.2px;
  filter: drop-shadow(0 0 8px #ffffff);
}

/* Pulso de Dados Fluindo nas Linhas */
.data-pulse {
  stroke-dasharray: 20 180;
  animation: pulseFlow 3s linear infinite;
}

.pulse-fast {
  animation-duration: 2.2s;
}
.pulse-med {
  animation-duration: 2.8s;
}
.pulse-slow {
  animation-duration: 3.5s;
}

@keyframes pulseFlow {
  from {
    stroke-dashoffset: 200;
  }
  to {
    stroke-dashoffset: 0;
  }
}

/* Retículos e Radares */
.radar-sweep-hand {
  transform-origin: 0 0;
  animation: radarSpin 5s linear infinite;
}

@keyframes radarSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.radar-dash-ring {
  transform-origin: center;
  animation: ringSpin 16s linear infinite;
}

@keyframes ringSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.radar-ping-ring {
  transform-origin: center;
  animation: pingRipple 2.8s ease-out infinite;
}

.ring-1 { animation-delay: 0s; }
.ring-2 { animation-delay: 0.9s; }
.ring-3 { animation-delay: 1.8s; }

@keyframes pingRipple {
  0% {
    r: 12;
    opacity: 0.9;
  }
  100% {
    r: 28;
    opacity: 0;
  }
}

/* Pilares Holográficos Verticais */
.holo-vertical-beam {
  transition: opacity 0.3s ease;
  opacity: 0.75;
}

.city-node-group {
  cursor: pointer;
}

.city-node-group:hover .holo-vertical-beam,
.city-node-group.node-active .holo-vertical-beam {
  opacity: 1;
  filter: drop-shadow(0 0 10px currentColor);
}

.hud-label-box {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.city-node-group:hover .hud-label-box,
.city-node-group.node-active .hud-label-box {
  transform: translate(var(--tx, 0), var(--ty, 0)) scale(1.06);
}

.city-node-group.node-pf .hud-label-box { --tx: 455px; --ty: 74px; }
.city-node-group.node-sg .hud-label-box { --tx: 35px; --ty: 239px; }
.city-node-group.node-bg .hud-label-box { --tx: 45px; --ty: 384px; }

.tag-status-light {
  animation: blinkFast 2s infinite ease-in-out;
}

@keyframes blinkFast {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* Responsividade Mobile */
@media (max-width: 768px) {
  .map-layout {
    flex-direction: column-reverse !important;
    overflow-y: auto;
    height: auto !important;
  }
  .addresses-container {
    width: 100%;
    gap: 1rem;
  }
  .map-image-container {
    height: 380px !important;
    min-height: 380px;
    width: 100%;
  }
}
</style>

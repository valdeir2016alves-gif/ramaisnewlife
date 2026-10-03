<template>
  <div class="cyber-map-wrapper">
    <!-- Header / Status Bar -->
    <div class="cyber-status-bar">
      <div class="status-left">
        <span class="blinking-dot"></span>
        <span class="status-title">REDE RS // FIBER BACKBONE</span>
        <span class="status-badge">3 NÓS OPERACIONAIS</span>
      </div>
      <div class="status-right">
        <button 
          class="view-toggle-btn" 
          :class="{ active: is3DView }" 
          @click="is3DView = !is3DView"
          :title="is3DView ? 'Alternar para visão 2D Plana' : 'Alternar para visão 3D Holográfica'"
        >
          <span class="toggle-icon">{{ is3DView ? '⬡' : '◻' }}</span>
          {{ is3DView ? 'VISÃO 3D HOLOGRÁFICA' : 'VISÃO 2D PLANA' }}
        </button>
      </div>
    </div>

    <div class="map-layout">
      <!-- Lado Esquerdo: Cards dos Hubs / Endereços -->
      <div class="addresses-container">
        <!-- Passo Fundo -->
        <a 
          href="https://maps.app.goo.gl/PpgQ7njKqZVgV5RX8" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="cyber-unit-card unit-pf"
          :class="{ 'card-active': activeUnit === 'passoFundo' }"
          @mouseenter="activeUnit = 'passoFundo'"
          @mouseleave="activeUnit = null"
        >
          <div class="card-glow-bar"></div>
          <div class="card-content">
            <div class="card-top">
              <div class="unit-code-tag">HUB 01 // NORTE</div>
              <span class="unit-status-dot"></span>
            </div>
            <h4 class="unit-name">Passo Fundo</h4>
            <p class="unit-address">
              Av. Brasil Centro, 104 - Centro<br/>
              Passo Fundo - RS, 99025-000
            </p>
            <div class="card-bottom">
              <span class="unit-coords">28.2612° S, 52.4083° W</span>
              <span class="open-maps-link">Ver no Mapa ↗</span>
            </div>
          </div>
        </a>

        <!-- São Gabriel -->
        <a 
          href="https://maps.app.goo.gl/23wyXd51is7cikXk9" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="cyber-unit-card unit-sg"
          :class="{ 'card-active': activeUnit === 'saoGabriel' }"
          @mouseenter="activeUnit = 'saoGabriel'"
          @mouseleave="activeUnit = null"
        >
          <div class="card-glow-bar"></div>
          <div class="card-content">
            <div class="card-top">
              <div class="unit-code-tag">HUB 02 // OESTE</div>
              <span class="unit-status-dot"></span>
            </div>
            <h4 class="unit-name">São Gabriel</h4>
            <p class="unit-address">
              R. General Mallet, 497 - Centro<br/>
              São Gabriel - RS, 97300-000
            </p>
            <div class="card-bottom">
              <span class="unit-coords">30.3364° S, 54.3200° W</span>
              <span class="open-maps-link">Ver no Mapa ↗</span>
            </div>
          </div>
        </a>

        <!-- Bagé -->
        <a 
          href="https://maps.app.goo.gl/N2ddEn5xJ6GAc9TF6" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="cyber-unit-card unit-bg"
          :class="{ 'card-active': activeUnit === 'bage' }"
          @mouseenter="activeUnit = 'bage'"
          @mouseleave="activeUnit = null"
        >
          <div class="card-glow-bar"></div>
          <div class="card-content">
            <div class="card-top">
              <div class="unit-code-tag">HUB 03 // SUL</div>
              <span class="unit-status-dot"></span>
            </div>
            <h4 class="unit-name">Bagé</h4>
            <p class="unit-address">
              Av. Sete de Setembro, 659 - Centro<br/>
              Bagé - RS, 96400-006
            </p>
            <div class="card-bottom">
              <span class="unit-coords">31.3314° S, 54.1069° W</span>
              <span class="open-maps-link">Ver no Mapa ↗</span>
            </div>
          </div>
        </a>
      </div>

      <!-- Lado Direito: Mapa Cyber Holográfico -->
      <div 
        class="map-stage-viewport"
        :class="{ 'view-3d': is3DView }"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <div 
          class="cyber-map-container"
          :style="is3DView ? stageTransformStyle : ''"
        >
          <svg 
            class="cyber-svg-stage" 
            viewBox="0 0 600 600" 
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
                <stop offset="0%" stop-color="#072942" stop-opacity="0.82" />
                <stop offset="50%" stop-color="#041628" stop-opacity="0.9" />
                <stop offset="100%" stop-color="#020d18" stop-opacity="0.95" />
              </linearGradient>

              <!-- Padrão de Circuito Interno do RS -->
              <pattern id="circuitPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 0 20 L 15 20 L 25 30 L 40 30" fill="none" stroke="rgba(0, 240, 255, 0.12)" stroke-width="0.8" />
                <path d="M 20 0 L 20 12 L 30 22 L 30 40" fill="none" stroke="rgba(0, 240, 255, 0.08)" stroke-width="0.8" />
                <circle cx="15" cy="20" r="1.5" fill="rgba(0, 240, 255, 0.3)" />
                <circle cx="25" cy="30" r="1.5" fill="rgba(0, 240, 255, 0.25)" />
                <circle cx="20" cy="12" r="1.2" fill="rgba(0, 240, 255, 0.2)" />
              </pattern>

              <!-- Padrão de Grade Cyber do Fundo -->
              <pattern id="cyberGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 220, 255, 0.045)" stroke-width="0.7" />
                <circle cx="0" cy="0" r="1" fill="rgba(0, 240, 255, 0.1)" />
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

            <!-- 1. FUNDO CYBERNETIC GRID -->
            <rect width="600" height="600" fill="#040b15" />
            <rect width="600" height="600" fill="url(#cyberGrid)" />

            <!-- Trilhas de Circuito no Solo -->
            <g class="cyber-ground-circuits" opacity="0.4">
              <path d="M 60 120 L 140 120 L 170 150 L 260 150" fill="none" stroke="rgba(0, 240, 255, 0.2)" stroke-width="1" />
              <circle cx="260" cy="150" r="2.5" fill="rgba(0, 240, 255, 0.4)" />
              <path d="M 450 480 L 520 480 L 550 510 L 580 510" fill="none" stroke="rgba(0, 240, 255, 0.2)" stroke-width="1" />
              <circle cx="450" cy="480" r="2.5" fill="rgba(0, 240, 255, 0.4)" />
              <path d="M 80 520 L 150 520 L 180 490 L 230 490" fill="none" stroke="rgba(0, 240, 255, 0.15)" stroke-width="1" />
              <path d="M 380 40 L 410 70 L 490 70" fill="none" stroke="rgba(0, 240, 255, 0.2)" stroke-width="1" />
            </g>

            <!-- 2. ELEMENTOS HUD TÁTICOS NO CENÁRIO -->
            <!-- Radar Tático no Topo Esquerdo -->
            <g class="hud-tactical-radar" transform="translate(60, 60)">
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
            <g class="hud-telemetry" transform="translate(430, 545)">
              <text x="0" y="0" fill="rgba(0, 240, 255, 0.5)" font-size="7.5" font-family="monospace">SYS.STATUS: ONLINE</text>
              <text x="0" y="11" fill="rgba(0, 240, 255, 0.35)" font-size="7" font-family="monospace">01001001 00101001</text>
              <text x="0" y="22" fill="rgba(0, 240, 255, 0.35)" font-size="7" font-family="monospace">LAT: 28°~33°S // FIBER 10G</text>
            </g>

            <!-- Moldura / Brackets de Canto Futuristas -->
            <path d="M 20 35 L 20 20 L 35 20" fill="none" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.2" />
            <path d="M 580 35 L 580 20 L 565 20" fill="none" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.2" />
            <path d="M 20 565 L 20 580 L 35 580" fill="none" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.2" />
            <path d="M 580 565 L 580 580 L 565 580" fill="none" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.2" />

            <!-- 3. TERRITÓRIO DO RIO GRANDE DO SUL (IBGE OFICIAL) -->
            <!-- Camada Base / Relevo Holográfico (Sombra e Profundidade 3D) -->
            <g transform="translate(5, 9)">
              <path 
                :d="RS_PATH_D" 
                fill="none" 
                stroke="rgba(0, 200, 255, 0.25)" 
                stroke-width="3" 
                filter="url(#neonBloomCyan)"
              />
              <path 
                :d="RS_PATH_D" 
                fill="#020914" 
                opacity="0.8" 
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
              <!-- Halo amplo -->
              <path 
                d="M 384.1 133.6 C 305 130, 215 205, 256.7 293.8" 
                fill="none" 
                stroke="url(#gradPfSg)" 
                stroke-width="5" 
                opacity="0.3" 
                filter="url(#neonBloomCyan)" 
              />
              <!-- Linha laser principal -->
              <path 
                d="M 384.1 133.6 C 305 130, 215 205, 256.7 293.8" 
                fill="none" 
                stroke="url(#gradPfSg)" 
                stroke-width="1.8" 
                class="laser-beam" 
              />
              <!-- Feixe harmônico paralelo -->
              <path 
                d="M 384.1 133.6 C 315 120, 205 195, 256.7 293.8" 
                fill="none" 
                stroke="rgba(0, 240, 255, 0.4)" 
                stroke-width="0.9" 
                stroke-dasharray="4 6" 
              />
              <!-- Pulso de dados animado -->
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
              <!-- Halo amplo -->
              <path 
                d="M 256.7 293.8 C 220 315, 230 355, 270.9 370.7" 
                fill="none" 
                stroke="url(#gradSgBg)" 
                stroke-width="4.5" 
                opacity="0.3" 
                filter="url(#neonBloomMagenta)" 
              />
              <!-- Linha laser principal -->
              <path 
                d="M 256.7 293.8 C 220 315, 230 355, 270.9 370.7" 
                fill="none" 
                stroke="url(#gradSgBg)" 
                stroke-width="1.8" 
                class="laser-beam" 
              />
              <!-- Feixe harmônico paralelo -->
              <path 
                d="M 256.7 293.8 C 210 320, 222 360, 270.9 370.7" 
                fill="none" 
                stroke="rgba(232, 121, 249, 0.4)" 
                stroke-width="0.9" 
                stroke-dasharray="3 5" 
              />
              <!-- Pulso de dados animado -->
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
              <!-- Halo amplo -->
              <path 
                d="M 384.1 133.6 C 410 240, 360 330, 270.9 370.7" 
                fill="none" 
                stroke="url(#gradPfBg)" 
                stroke-width="4.5" 
                opacity="0.25" 
                filter="url(#neonBloomGreen)" 
              />
              <!-- Linha laser principal -->
              <path 
                d="M 384.1 133.6 C 410 240, 360 330, 270.9 370.7" 
                fill="none" 
                stroke="url(#gradPfBg)" 
                stroke-width="1.8" 
                class="laser-beam" 
              />
              <!-- Feixe harmônico paralelo -->
              <path 
                d="M 384.1 133.6 C 425 245, 375 340, 270.9 370.7" 
                fill="none" 
                stroke="rgba(52, 211, 153, 0.4)" 
                stroke-width="0.9" 
                stroke-dasharray="4 6" 
              />
              <!-- Pulso de dados animado -->
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
              <!-- Pilar / Feixe Vertical Holográfico de Luz -->
              <polygon points="377 133.6, 391 133.6, 386 65, 382 65" fill="url(#beamGradPf)" class="holo-vertical-beam" />
              <line x1="384.1" y1="133.6" x2="384.1" y2="55" stroke="rgba(0, 240, 255, 0.8)" stroke-width="1.2" stroke-dasharray="2 3" class="beam-core-line" />

              <!-- Círculo de Radar / Retículo no Solo -->
              <circle cx="384.1" cy="133.6" r="24" fill="none" stroke="rgba(0, 240, 255, 0.2)" stroke-width="1" class="radar-ping-ring ring-1" />
              <circle cx="384.1" cy="133.6" r="18" fill="none" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1" stroke-dasharray="4 3" class="radar-dash-ring" />
              <circle cx="384.1" cy="133.6" r="11" fill="rgba(0, 240, 255, 0.08)" stroke="#00f0ff" stroke-width="1.2" />
              
              <!-- Ticks em Cruz do Retículo -->
              <line x1="384.1" y1="119" x2="384.1" y2="123" stroke="#00f0ff" stroke-width="1.5" />
              <line x1="384.1" y1="144" x2="384.1" y2="148" stroke="#00f0ff" stroke-width="1.5" />
              <line x1="370" y1="133.6" x2="374" y2="133.6" stroke="#00f0ff" stroke-width="1.5" />
              <line x1="394" y1="133.6" x2="398" y2="133.6" stroke="#00f0ff" stroke-width="1.5" />

              <!-- Núcleo Luminoso Central -->
              <circle cx="384.1" cy="133.6" r="4" fill="#ffffff" filter="url(#neonBloomCyan)" />
              <circle cx="384.1" cy="133.6" r="2" fill="#00f0ff" />

              <!-- Linha Guia Futurista para a Etiqueta HUD -->
              <polyline points="384.1 133.6, 420 95, 455 95" fill="none" stroke="#00f0ff" stroke-width="1.2" />
              <circle cx="420" cy="95" r="2" fill="#00f0ff" />

              <!-- Etiqueta Cyber HUD: PASSO FUNDO -->
              <g class="hud-label-box" transform="translate(455, 74)">
                <!-- Fundo Vidro Cyber -->
                <rect x="0" y="0" width="130" height="42" rx="4" fill="rgba(4, 18, 32, 0.9)" stroke="#00f0ff" stroke-width="1.2" filter="url(#neonBloomCyan)" />
                <!-- Cantos Decorativos HUD -->
                <path d="M 0 6 L 6 0" stroke="#00f0ff" stroke-width="1.5" fill="none" />
                <path d="M 130 36 L 124 42" stroke="#00f0ff" stroke-width="1.5" fill="none" />
                <!-- Textos -->
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
              <!-- Pilar Vertical Holográfico de Luz -->
              <polygon points="250 293.8, 263 293.8, 259 225, 255 225" fill="url(#beamGradSg)" class="holo-vertical-beam" />
              <line x1="256.7" y1="293.8" x2="256.7" y2="215" stroke="rgba(232, 121, 249, 0.8)" stroke-width="1.2" stroke-dasharray="2 3" class="beam-core-line" />

              <!-- Círculo de Radar / Retículo no Solo -->
              <circle cx="256.7" cy="293.8" r="24" fill="none" stroke="rgba(232, 121, 249, 0.2)" stroke-width="1" class="radar-ping-ring ring-2" />
              <circle cx="256.7" cy="293.8" r="18" fill="none" stroke="rgba(232, 121, 249, 0.4)" stroke-width="1" stroke-dasharray="4 3" class="radar-dash-ring" />
              <circle cx="256.7" cy="293.8" r="11" fill="rgba(232, 121, 249, 0.08)" stroke="#e879f9" stroke-width="1.2" />

              <!-- Ticks em Cruz do Retículo -->
              <line x1="256.7" y1="279" x2="256.7" y2="283" stroke="#e879f9" stroke-width="1.5" />
              <line x1="256.7" y1="304" x2="256.7" y2="308" stroke="#e879f9" stroke-width="1.5" />
              <line x1="242" y1="293.8" x2="246" y2="293.8" stroke="#e879f9" stroke-width="1.5" />
              <line x1="267" y1="293.8" x2="271" y2="293.8" stroke="#e879f9" stroke-width="1.5" />

              <!-- Núcleo Luminoso Central -->
              <circle cx="256.7" cy="293.8" r="4" fill="#ffffff" filter="url(#neonBloomMagenta)" />
              <circle cx="256.7" cy="293.8" r="2" fill="#e879f9" />

              <!-- Linha Guia Futurista para a Etiqueta HUD -->
              <polyline points="256.7 293.8, 205 260, 165 260" fill="none" stroke="#e879f9" stroke-width="1.2" />
              <circle cx="205" cy="260" r="2" fill="#e879f9" />

              <!-- Etiqueta Cyber HUD: SÃO GABRIEL -->
              <g class="hud-label-box" transform="translate(35, 239)">
                <!-- Fundo Vidro Cyber -->
                <rect x="0" y="0" width="130" height="42" rx="4" fill="rgba(26, 4, 30, 0.9)" stroke="#e879f9" stroke-width="1.2" filter="url(#neonBloomMagenta)" />
                <!-- Cantos Decorativos HUD -->
                <path d="M 0 6 L 6 0" stroke="#e879f9" stroke-width="1.5" fill="none" />
                <path d="M 130 36 L 124 42" stroke="#e879f9" stroke-width="1.5" fill="none" />
                <!-- Textos -->
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
              <!-- Pilar Vertical Holográfico de Luz -->
              <polygon points="264 370.7, 278 370.7, 273 302, 269 302" fill="url(#beamGradBg)" class="holo-vertical-beam" />
              <line x1="270.9" y1="370.7" x2="270.9" y2="292" stroke="rgba(52, 211, 153, 0.8)" stroke-width="1.2" stroke-dasharray="2 3" class="beam-core-line" />

              <!-- Círculo de Radar / Retículo no Solo -->
              <circle cx="270.9" cy="370.7" r="24" fill="none" stroke="rgba(52, 211, 153, 0.2)" stroke-width="1" class="radar-ping-ring ring-3" />
              <circle cx="270.9" cy="370.7" r="18" fill="none" stroke="rgba(52, 211, 153, 0.4)" stroke-width="1" stroke-dasharray="4 3" class="radar-dash-ring" />
              <circle cx="270.9" cy="370.7" r="11" fill="rgba(52, 211, 153, 0.08)" stroke="#34d399" stroke-width="1.2" />

              <!-- Ticks em Cruz do Retículo -->
              <line x1="270.9" y1="356" x2="270.9" y2="360" stroke="#34d399" stroke-width="1.5" />
              <line x1="270.9" y1="381" x2="270.9" y2="385" stroke="#34d399" stroke-width="1.5" />
              <line x1="256" y1="370.7" x2="260" y2="370.7" stroke="#34d399" stroke-width="1.5" />
              <line x1="281" y1="370.7" x2="285" y2="370.7" stroke="#34d399" stroke-width="1.5" />

              <!-- Núcleo Luminoso Central -->
              <circle cx="270.9" cy="370.7" r="4" fill="#ffffff" filter="url(#neonBloomGreen)" />
              <circle cx="270.9" cy="370.7" r="2" fill="#34d399" />

              <!-- Linha Guia Futurista para a Etiqueta HUD -->
              <polyline points="270.9 370.7, 215 405, 175 405" fill="none" stroke="#34d399" stroke-width="1.2" />
              <circle cx="215" cy="405" r="2" fill="#34d399" />

              <!-- Etiqueta Cyber HUD: BAGÉ -->
              <g class="hud-label-box" transform="translate(45, 384)">
                <!-- Fundo Vidro Cyber -->
                <rect x="0" y="0" width="130" height="42" rx="4" fill="rgba(3, 24, 18, 0.9)" stroke="#34d399" stroke-width="1.2" filter="url(#neonBloomGreen)" />
                <!-- Cantos Decorativos HUD -->
                <path d="M 0 6 L 6 0" stroke="#34d399" stroke-width="1.5" fill="none" />
                <path d="M 130 36 L 124 42" stroke="#34d399" stroke-width="1.5" fill="none" />
                <!-- Textos -->
                <text x="10" y="16" fill="#34d399" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="11.5" letter-spacing="1">BAGÉ</text>
                <text x="10" y="30" fill="rgba(52, 211, 153, 0.75)" font-family="monospace" font-size="8">HUB SUL // 96400-006</text>
                <circle cx="118" cy="14" r="3" fill="#34d399" class="tag-status-light" />
              </g>
            </g>

          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { RS_PATH_D } from './rsPathData.js';

// Estado de visualização 3D ou 2D
const is3DView = ref(true);

// Unidade atualmente destacada (hover no card ou no mapa)
const activeUnit = ref(null);

// Parallax sutil com o mouse
const mouseX = ref(0);
const mouseY = ref(0);

const handleMouseMove = (e) => {
  if (!is3DView.value) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  mouseX.value = x;
  mouseY.value = y;
};

const handleMouseLeave = () => {
  mouseX.value = 0;
  mouseY.value = 0;
};

const stageTransformStyle = computed(() => {
  const rotX = 18 - mouseY.value * 12;
  const rotY = -4 + mouseX.value * 14;
  const rotZ = -1.5 + mouseX.value * 2;
  return {
    transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`
  };
});

const openMap = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};
</script>

<style scoped>
.cyber-map-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at 65% 45%, #081a2e 0%, #040d18 55%, #02070e 100%);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 0 40px rgba(0, 240, 255, 0.05);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* Status Bar Superior */
.cyber-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 1.25rem;
  background: rgba(3, 12, 22, 0.85);
  border-bottom: 1px solid rgba(0, 240, 255, 0.15);
  backdrop-filter: blur(8px);
}

.status-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.blinking-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #00f0ff;
  box-shadow: 0 0 8px #00f0ff;
  animation: blinkFast 1.5s infinite ease-in-out;
}

.status-title {
  font-size: 0.75rem;
  font-family: monospace;
  letter-spacing: 1.5px;
  color: #00f0ff;
  font-weight: 700;
}

.status-badge {
  font-size: 0.65rem;
  font-family: monospace;
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.3);
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.view-toggle-btn {
  background: rgba(0, 240, 255, 0.08);
  border: 1px solid rgba(0, 240, 255, 0.3);
  color: #00f0ff;
  font-size: 0.7rem;
  font-family: monospace;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.25s ease;
  letter-spacing: 0.5px;
}

.view-toggle-btn:hover {
  background: rgba(0, 240, 255, 0.2);
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
}

.view-toggle-btn.active {
  background: rgba(0, 240, 255, 0.15);
  border-color: #00f0ff;
}

/* Layout Principal */
.map-layout {
  display: flex;
  flex: 1;
  width: 100%;
  height: calc(100% - 40px);
  gap: 1.25rem;
  padding: 1rem 1.25rem;
  align-items: stretch;
  overflow: hidden;
}

/* Lado Esquerdo: Cards */
.addresses-container {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  justify-content: center;
  z-index: 10;
}

.cyber-unit-card {
  position: relative;
  display: flex;
  text-decoration: none;
  background: rgba(6, 17, 30, 0.75);
  border: 1px solid rgba(0, 240, 255, 0.15);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.cyber-unit-card:hover,
.cyber-unit-card.card-active {
  transform: translateX(6px);
  background: rgba(9, 26, 46, 0.9);
}

.card-glow-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  transition: width 0.2s ease, filter 0.2s ease;
}

.cyber-unit-card:hover .card-glow-bar,
.cyber-unit-card.card-active .card-glow-bar {
  width: 6px;
}

/* Cores específicas de cada Unidade */
.unit-pf .card-glow-bar { background: #00f0ff; box-shadow: 0 0 10px #00f0ff; }
.unit-pf:hover, .unit-pf.card-active { border-color: rgba(0, 240, 255, 0.6); box-shadow: 0 8px 25px rgba(0, 240, 255, 0.15); }

.unit-sg .card-glow-bar { background: #e879f9; box-shadow: 0 0 10px #e879f9; }
.unit-sg:hover, .unit-sg.card-active { border-color: rgba(232, 121, 249, 0.6); box-shadow: 0 8px 25px rgba(232, 121, 249, 0.15); }

.unit-bg .card-glow-bar { background: #34d399; box-shadow: 0 0 10px #34d399; }
.unit-bg:hover, .unit-bg.card-active { border-color: rgba(52, 211, 153, 0.6); box-shadow: 0 8px 25px rgba(52, 211, 153, 0.15); }

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.unit-code-tag {
  font-family: monospace;
  font-size: 0.65rem;
  letter-spacing: 1px;
  color: var(--text-muted, #718096);
}

.unit-pf .unit-code-tag { color: #00f0ff; }
.unit-sg .unit-code-tag { color: #e879f9; }
.unit-bg .unit-code-tag { color: #34d399; }

.unit-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
}
.unit-pf .unit-status-dot { color: #00f0ff; }
.unit-sg .unit-status-dot { color: #e879f9; }
.unit-bg .unit-status-dot { color: #34d399; }

.unit-name {
  margin: 0 0 0.25rem 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
}

.unit-address {
  margin: 0 0 0.5rem 0;
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.35;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.35rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.unit-coords {
  font-family: monospace;
  font-size: 0.65rem;
  color: #64748b;
}

.open-maps-link {
  font-size: 0.7rem;
  color: #38bdf8;
  font-weight: 600;
  transition: transform 0.2s;
}

.cyber-unit-card:hover .open-maps-link {
  transform: translateX(3px);
}

/* Lado Direito: Viewport 3D do Mapa */
.map-stage-viewport {
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background: rgba(2, 8, 16, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.1);
}

.map-stage-viewport.view-3d {
  perspective: 1100px;
  perspective-origin: 50% 50%;
}

.cyber-map-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transform-style: preserve-3d;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.cyber-svg-stage {
  width: 100%;
  height: 100%;
  max-width: 580px;
  max-height: 580px;
  filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.8));
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
@media (max-width: 860px) {
  .map-layout {
    flex-direction: column-reverse;
    overflow-y: auto;
    padding: 0.75rem;
  }
  .addresses-container {
    width: 100%;
  }
  .map-stage-viewport {
    min-height: 380px;
    height: 380px;
  }
}
</style>

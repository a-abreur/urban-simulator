// dashboard.js - Dashboard Urbano com Dark Mode

// Configuração e estado global
const API_BASE_URL = "http://localhost:5000/api";
let map;
let heatLayer = null;
let currentMarkers = [];
let activeLayers = new Set(['clima', 'estacoes']);
let baseMapLayer = null;
let drawnItems = new L.FeatureGroup();
let analysisMode = false;

// Inicialização do mapa
function initializeMap() {
    map = L.map('map').setView([-15.8267, -47.9218], 12);
    
    // Mapa base padrão
    baseMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Adicionar grupo de desenho
    map.addLayer(drawnItems);
}

// Inicializar controle de modo escuro
function initializeDarkModeToggle() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const themeLabel = document.getElementById('theme-label');
    
    // Carregar preferência salva
    const isDarkMode = localStorage.getItem('dark-mode') === 'true';
    darkModeToggle.checked = isDarkMode;
    updateTheme(isDarkMode, themeLabel);
    
    // Event listener para o toggle
    darkModeToggle.addEventListener('change', function() {
        const isDark = this.checked;
        updateTheme(isDark, themeLabel);
        localStorage.setItem('dark-mode', isDark);
    });
}

// Atualizar tema baseado no estado do toggle
function updateTheme(isDark, themeLabel) {
    if (isDark) {
        document.body.setAttribute('data-theme', 'dark');
        themeLabel.textContent = 'Modo Escuro';
    } else {
        document.body.removeAttribute('data-theme');
        themeLabel.textContent = 'Modo Claro';
    }
}

// Inicializar controles da UI
function initializeUIControls() {
    // Controles de zoom
    document.getElementById('zoom-in').addEventListener('click', () => map.zoomIn());
    document.getElementById('zoom-out').addEventListener('click', () => map.zoomOut());
    
    // Centralizar em Brasília
    document.getElementById('current-location').addEventListener('click', () => {
        map.setView([-15.8267, -47.9218], 12);
    });

    // Tela cheia
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);

    // Fechar painéis
    document.getElementById('close-info').addEventListener('click', () => {
        document.getElementById('info-panel').classList.remove('active');
    });

    // Controles de camadas
    document.querySelectorAll('.layer-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const layer = this.dataset.layer;
            const isActive = this.classList.toggle('active');
            
            // Atualizar ícone
            const icon = this.querySelector('.status-icon');
            icon.className = isActive ? 'fas fa-check status-icon' : 'fas fa-plus status-icon';
            
            // Atualizar conjunto de camadas ativas
            if (isActive) {
                activeLayers.add(layer);
            } else {
                activeLayers.delete(layer);
            }
            
            updateMapLayers();
            updateSidebarSections();
        });
    });

    // Controle de mapa base
    document.getElementById('base-map-select').addEventListener('change', function(e) {
        changeBaseMap(e.target.value);
    });

    // Inicializar toggle do modo escuro
    initializeDarkModeToggle();

    // Ferramentas de análise
    initializeAnalysisTools();
    
    // Simulação
    initializeSimulation();
}

// Inicializar ferramentas de análise
function initializeAnalysisTools() {
    document.getElementById('area-analysis-btn').addEventListener('click', toggleAreaAnalysis);
    document.getElementById('report-btn').addEventListener('click', generateReport);
    document.getElementById('compare-btn').addEventListener('click', startComparison);
    document.getElementById('simulation-btn').addEventListener('click', openSimulationModal);
    
    document.getElementById('close-analysis').addEventListener('click', () => {
        document.getElementById('analysis-panel').style.display = 'none';
    });
}

// Inicializar simulação
function initializeSimulation() {
    const modal = document.getElementById('simulation-modal');
    const closeBtn = document.getElementById('close-simulation-modal');
    const cancelBtn = document.getElementById('cancel-simulation');
    const runBtn = document.getElementById('run-simulation');

    // Configurar sliders
    setupSimulationSliders();

    // Eventos do modal
    closeBtn.addEventListener('click', closeSimulationModal);
    cancelBtn.addEventListener('click', closeSimulationModal);
    runBtn.addEventListener('click', runSimulation);

    // Fechar modal clicando fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeSimulationModal();
    });
}

// Configurar sliders de simulação
function setupSimulationSliders() {
    const sliders = [
        { id: 'green-areas', valueId: 'green-areas-value' },
        { id: 'public-transport', valueId: 'public-transport-value' },
        { id: 'pollution-reduction', valueId: 'pollution-reduction-value' }
    ];

    sliders.forEach(slider => {
        const element = document.getElementById(slider.id);
        const valueElement = document.getElementById(slider.valueId);

        element.addEventListener('input', function() {
            valueElement.textContent = `${this.value}%`;
            updateSimulationImpact();
        });
    });
}

// Atualizar impacto da simulação
function updateSimulationImpact() {
    const greenAreas = parseInt(document.getElementById('green-areas').value);
    const publicTransport = parseInt(document.getElementById('public-transport').value);
    const pollutionReduction = parseInt(document.getElementById('pollution-reduction').value);

    const airQualityImpact = Math.min(100, 50 + (greenAreas * 0.2) + (pollutionReduction * 0.3));
    const sustainabilityImpact = Math.min(100, 60 + (greenAreas * 0.15) + (publicTransport * 0.2) + (pollutionReduction * 0.1));

    document.querySelectorAll('.impact-fill').forEach((fill, index) => {
        if (index === 0) fill.style.width = `${airQualityImpact}%`;
        if (index === 1) fill.style.width = `${sustainabilityImpact}%`;
    });

    document.querySelectorAll('.impact-value').forEach((value, index) => {
        if (index === 0) value.textContent = `+${Math.round(airQualityImpact - 50)}%`;
        if (index === 1) value.textContent = `+${Math.round(sustainabilityImpact - 60)}%`;
    });
}

// Alternar análise de área
function toggleAreaAnalysis() {
    analysisMode = !analysisMode;
    const btn = document.getElementById('area-analysis-btn');
    const badge = document.getElementById('analysis-status');

    if (analysisMode) {
        // Ativar ferramentas de desenho
        const drawControl = new L.Control.Draw({
            draw: {
                polygon: true,
                rectangle: true,
                circle: true,
                marker: false,
                polyline: false
            },
            edit: {
                featureGroup: drawnItems
            }
        });

        map.addControl(drawControl);
        badge.textContent = 'ON';
        badge.style.background = 'var(--success-color)';

        // Evento de criação de área
        map.on(L.Draw.Event.CREATED, function(e) {
            const layer = e.layer;
            drawnItems.addLayer(layer);
            analyzeArea(layer);
        });

        showNotification('Modo de análise ativado. Desenhe uma área no mapa para analisar.', 'info');
    } else {
        // Desativar ferramentas de desenho
        map.eachLayer((layer) => {
            if (layer instanceof L.Control.Draw) {
                map.removeControl(layer);
            }
        });

        drawnItems.clearLayers();
        badge.textContent = 'OFF';
        badge.style.background = 'var(--danger-color)';
        document.getElementById('analysis-panel').style.display = 'none';

        showNotification('Modo de análise desativado.', 'info');
    }
}

// Analisar área desenhada
async function analyzeArea(layer) {
    const bounds = layer.getBounds();
    const center = bounds.getCenter();
    const area = bounds.getNorthEast().distanceTo(bounds.getSouthWest());

    try {
        // Simular análise
        const analysis = await simulateAreaAnalysis(center, area);
        showAnalysisResults(analysis, layer);
    } catch (error) {
        console.error('Erro na análise:', error);
        showNotification('Erro ao analisar a área selecionada.', 'error');
    }
}

// Simular análise de área
async function simulateAreaAnalysis(center, area) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
        score_sustentabilidade: Math.floor(Math.random() * 30) + 60,
        indicadores: {
            densidade_construcao: Math.floor(Math.random() * 100),
            areas_verdes: Math.floor(Math.random() * 100),
            acessibilidade_transporte: Math.floor(Math.random() * 100),
            qualidade_ar: Math.floor(Math.random() * 100),
            ruido_urbano: Math.floor(Math.random() * 100),
            infraestrutura_saneamento: Math.floor(Math.random() * 100)
        },
        recomendacoes: [
            "Aumentar áreas verdes em 15%",
            "Melhorar acesso ao transporte público",
            "Implementar telhados verdes",
            "Otimizar gestão de resíduos"
        ]
    };
}

// Mostrar resultados da análise
function showAnalysisResults(analysis, layer) {
    const panel = document.getElementById('analysis-panel');
    const results = document.getElementById('analysis-results');

    results.innerHTML = `
        <div class="analysis-score">
            <h4>📊 Score de Sustentabilidade</h4>
            <div class="score-display">${analysis.score_sustentabilidade}/100</div>
        </div>
        <div class="analysis-indicators">
            <h4>📈 Indicadores</h4>
            ${Object.entries(analysis.indicadores).map(([key, value]) => `
                <div class="indicator-item">
                    <span>${formatIndicatorName(key)}</span>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${value}%"></div>
                        </div>
                        <span class="progress-value">${value}%</span>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="analysis-recommendations">
            <h4>💡 Recomendações</h4>
            <ul>
                ${analysis.recomendacoes.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    `;

    panel.style.display = 'block';

    // Popup no mapa
    const popupContent = `
        <div class="analysis-popup">
            <h4>📊 Análise da Área</h4>
            <p><strong>Score:</strong> ${analysis.score_sustentabilidade}/100</p>
            <p><strong>Área:</strong> ${(layer.getBounds().getNorthEast().distanceTo(layer.getBounds().getSouthWest()) / 1000).toFixed(2)} km²</p>
            <button onclick="document.getElementById('analysis-panel').style.display='block'">
                Ver Detalhes
            </button>
        </div>
    `;

    layer.bindPopup(popupContent).openPopup();
}

// Trocar mapa base
function changeBaseMap(mapType) {
    if (baseMapLayer) {
        map.removeLayer(baseMapLayer);
    }

    const mapConfigs = {
        'padrao': {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: 'OpenStreetMap'
        },
        'satelite': {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Esri'
        },
        'terreno': {
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            attribution: 'OpenTopoMap'
        },
        'transito': {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: 'OpenStreetMap'
        }
    };

    const config = mapConfigs[mapType] || mapConfigs.padrao;
    baseMapLayer = L.tileLayer(config.url, {
        attribution: config.attribution
    }).addTo(map);

    // Mostrar/ocultar legenda de tráfego
    const trafficLegend = document.getElementById('traffic-legend');
    trafficLegend.style.display = mapType === 'transito' ? 'block' : 'none';
}

// Atualizar camadas do mapa
// Atualizar a função updateMapLayers para incluir a legenda
function updateMapLayers() {
    // Limpar camadas existentes
    clearMapLayers();

    // Aplicar camadas ativas
    if (activeLayers.has('clima')) {
        loadWeatherData();
    }

    if (activeLayers.has('estacoes')) {
        loadMonitoringStations();
    }

    if (activeLayers.has('heatmap')) {
        loadPollutionHeatmap();
        document.getElementById('map-legend').style.display = 'block';
    } else {
        document.getElementById('map-legend').style.display = 'none';
    }

    if (activeLayers.has('transito')) {
        loadTrafficData();
        document.getElementById('traffic-legend').style.display = 'block';
    } else {
        document.getElementById('traffic-legend').style.display = 'none';
    }

    if (activeLayers.has('temperatura')) {
        loadHeatIslands();
        createHeatLegend(); // Adicionar legenda do heat
    } else {
        removeHeatLegend();
    }
}

// Função para criar legenda do heat
function createHeatLegend() {
    let legend = document.getElementById('heat-legend');
    if (!legend) {
        legend = document.createElement('div');
        legend.id = 'heat-legend';
        legend.className = 'heat-legend';
        legend.innerHTML = `
            <h4>🌡️ Ilhas de Calor</h4>
            <div class="heat-gradient"></div>
            <div class="heat-labels">
                <span>+1°C</span>
                <span>+3°C</span>
            </div>
            <div class="legend-items">
                <div class="legend-item">
                    <span class="legend-color" style="background: #90ee90"></span>
                    <span>Baixa</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #ffd700"></span>
                    <span>Média</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #ff4500"></span>
                    <span>Alta</span>
                </div>
            </div>
        `;
        document.querySelector('.map-container').appendChild(legend);
    }
    legend.style.display = 'block';
}

// Função para remover legenda do heat
function removeHeatLegend() {
    const legend = document.getElementById('heat-legend');
    if (legend) {
        legend.style.display = 'none';
    }
}

// Limpar camadas do mapa
function clearMapLayers() {
    if (heatLayer) {
        map.removeLayer(heatLayer);
        heatLayer = null;
    }

    currentMarkers.forEach(marker => {
        if (marker instanceof L.Polyline || marker instanceof L.Circle || marker instanceof L.Polygon) {
            map.removeLayer(marker);
        }
    });
    
    currentMarkers = currentMarkers.filter(m => m instanceof L.Marker);
}

// Atualizar seções da sidebar
function updateSidebarSections() {
    const trafficSection = document.getElementById('traffic-section');
    const feedbackSection = document.getElementById('feedback-section');

    trafficSection.style.display = activeLayers.has('transito') ? 'block' : 'none';
    feedbackSection.style.display = activeLayers.has('feedback') ? 'block' : 'none';
}

// Carregar dados da cidade
async function loadCityData(city = "Brasília") {
    try {
        showLoadingState(true);
        
        // Atualizar UI
        document.getElementById('current-city').textContent = city;
        document.getElementById('update-time').textContent = 'Atualizando...';

        // Simular carregamento de dados
        const [weatherData, pollutionData, stationsData] = await Promise.all([
            simulateAPICall('clima'),
            simulateAPICall('poluicao'),
            simulateAPICall('estacoes')
        ]);

        updateIndicatorsUI(weatherData, pollutionData);
        updateMapLayers();
        
        document.getElementById('update-time').textContent = `Atualizado: ${new Date().toLocaleTimeString()}`;
        showNotification('Dados atualizados com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        document.getElementById('update-time').textContent = 'Erro na atualização';
        showNotification('Erro ao carregar dados. Usando dados de demonstração.', 'error');
        loadMockData();
    } finally {
        showLoadingState(false);
    }
}

// Simular chamada à API
async function simulateAPICall(endpoint) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockData = {
        clima: {
            temperatura: 25 + Math.floor(Math.random() * 10),
            umidade: 40 + Math.floor(Math.random() * 40),
            vento: 5 + Math.floor(Math.random() * 15),
            pressao: 1010 + Math.floor(Math.random() * 20),
            descricao: "Parcialmente nublado"
        },
        poluicao: {
            poluentes: [
                { parametro: 'pm25', valor: 10 + Math.floor(Math.random() * 30) },
                { parametro: 'pm10', valor: 15 + Math.floor(Math.random() * 40) }
            ]
        },
        estacoes: [
            {
                nome: "Brasília Central",
                coordenadas: { latitude: -15.8267, longitude: -47.9218 },
                parametros: [{ name: "pm25" }, { name: "pm10" }, { name: "o3" }],
                cidade: "Brasília",
                pais: "BR",
                contagem_medicoes: 1500
            }
        ]
    };

    return mockData[endpoint];
}

// Atualizar indicadores na UI
function updateIndicatorsUI(weatherData, pollutionData) {
    if (weatherData) {
        document.getElementById('temp-value').textContent = `${weatherData.temperatura}°C`;
        document.getElementById('umidity-value').textContent = `${weatherData.umidade}%`;
        document.getElementById('wind-value').textContent = `${weatherData.vento} km/h`;
    }

    if (pollutionData?.poluentes?.length > 0) {
        const pm25 = pollutionData.poluentes.find(p => p.parametro === 'pm25');
        if (pm25) {
            const qualidade = pm25.valor < 12 ? 'Boa' : pm25.valor < 35 ? 'Moderada' : 'Ruim';
            document.getElementById('air-value').textContent = qualidade;
        }
    }
}

// Carregar dados de clima
async function loadWeatherData() {
    const data = await simulateAPICall('clima');
    
    const marker = L.marker([-15.8267, -47.9218]).addTo(map);
    const popupContent = `
        <div class="weather-popup">
            <h4>🌤️ Brasília</h4>
            <p><strong>🌡️ Temperatura:</strong> ${data.temperatura}°C</p>
            <p><strong>💧 Umidade:</strong> ${data.umidade}%</p>
            <p><strong>💨 Vento:</strong> ${data.vento} km/h</p>
            <p><strong>📊 Pressão:</strong> ${data.pressao} hPa</p>
            <p><em>${data.descricao}</em></p>
        </div>
    `;
    
    marker.bindPopup(popupContent);
    currentMarkers.push(marker);
}

// Carregar estações de monitoramento
async function loadMonitoringStations() {
    const data = await simulateAPICall('estacoes');
    
    if (data && data.length > 0) {
        data.forEach(station => {
            const marker = L.marker([
                station.coordenadas.latitude, 
                station.coordenadas.longitude
            ], {
                icon: L.divIcon({
                    className: 'station-marker',
                    html: '<i class="fas fa-building"></i>',
                    iconSize: [30, 30]
                })
            }).addTo(map);
            
            const popupContent = `
                <div class="station-popup">
                    <h4>📍 ${station.nome}</h4>
                    <p><strong>📊 Parâmetros:</strong> ${station.parametros.map(p => p.name).join(', ')}</p>
                    <p><strong>🔢 Medições:</strong> ${station.contagem_medicoes}</p>
                    <p><strong>🏙️ Cidade:</strong> ${station.cidade}, ${station.pais}</p>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            marker.on('click', () => showStationInfo(station));
            currentMarkers.push(marker);
        });
    }
}

// Carregar heatmap de poluição
async function loadPollutionHeatmap() {
    const data = await simulateAPICall('poluicao');
    
    if (data?.poluentes) {
        // Gerar pontos aleatórios para demonstração
        const points = [];
        for (let i = 0; i < 50; i++) {
            points.push([
                -15.80 + (Math.random() * 0.1),
                -47.90 + (Math.random() * 0.1),
                Math.random() * 10
            ]);
        }

        heatLayer = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: {
                0.1: 'blue',
                0.3: 'lime', 
                0.5: 'yellow',
                0.7: 'orange',
                0.9: 'red'
            }
        }).addTo(map);
    }
}

// Carregar dados de tráfego
async function loadTrafficData() {
    try {
        // Usar Overpass API para buscar vias principais de Brasília
        const overpassQuery = `
            [out:json][timeout:25];
            (
                way["highway"="motorway"](around:20000, -15.8267, -47.9218);
                way["highway"="trunk"](around:20000, -15.8267, -47.9218);
                way["highway"="primary"](around:20000, -15.8267, -47.9218);
            );
            out geom;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery
        });
        
        const data = await response.json();
        
        // Processar as vias encontradas
        processOSMRoads(data.elements);
        
    } catch (error) {
        console.error('Erro ao carregar dados OSM:', error);
        // Fallback para dados simulados
        loadSimulatedTrafficData();
    }
}

function processOSMRoads(roads) {
    roads.forEach(road => {
        if (road.geometry) {
            const coordinates = road.geometry.map(coord => [coord.lat, coord.lon]);
            
            // Simular dados de tráfego (em produção, você usaria dados reais)
            const trafficLevel = Math.floor(Math.random() * 100);
            const speed = Math.floor(Math.random() * 80) + 20;
            
            const color = getTrafficColor(trafficLevel);
            const weight = getRoadWeight(road.tags.highway);
            
            const polyline = L.polyline(coordinates, {
                color: color,
                weight: weight,
                opacity: 0.8,
                lineCap: 'round'
            }).addTo(map);
            
            polyline.bindPopup(`
                <div class="traffic-popup">
                    <h4>🛣 ${road.tags.name || 'Via sem nome'}</h4>
                    <p><strong>Tipo:</strong> ${getRoadType(road.tags.highway)}</p>
                    <p><strong>Congestionamento:</strong> ${trafficLevel}%</p>
                    <p><strong>Velocidade:</strong> ${speed} km/h</p>
                </div>
            `);
            
            currentMarkers.push(polyline);
        }
    });
}

// Carregar ilhas de calor
// Função para carregar ilhas de calor com efeito de heat circle
async function loadHeatIslands() {
    const heatIslands = [
        { 
            area: "Centro Comercial", 
            temp_diff: 2.8, 
            cobertura: "Asfalto", 
            vegetacao: 15, 
            coords: [-15.7794, -47.8892],
            intensidade: 0.9
        },
        { 
            area: "Setor Hoteleiro", 
            temp_diff: 2.2, 
            cobertura: "Concreto", 
            vegetacao: 20, 
            coords: [-15.7617, -47.8794],
            intensidade: 0.7
        },
        { 
            area: "Área Residencial", 
            temp_diff: 1.5, 
            cobertura: "Mista", 
            vegetacao: 35, 
            coords: [-15.7486, -47.8942],
            intensidade: 0.5
        },
        { 
            area: "Zona Mista", 
            temp_diff: 2.0, 
            cobertura: "Concreto/Asfalto", 
            vegetacao: 25, 
            coords: [-15.7753, -47.8722],
            intensidade: 0.6
        },
        { 
            area: "Bairro Popular", 
            temp_diff: 1.8, 
            cobertura: "Asfalto", 
            vegetacao: 40, 
            coords: [-15.7231, -47.8800],
            intensidade: 0.55
        },
        { 
            area: "Área Periférica", 
            temp_diff: 3.0, 
            cobertura: "Asfalto/Concreto", 
            vegetacao: 10, 
            coords: [-15.8289, -47.9153],
            intensidade: 1.0
        },
        { 
            area: "Parque Urbano", 
            temp_diff: 1.2, 
            cobertura: "Verde", 
            vegetacao: 60, 
            coords: [-15.8064, -47.8869],
            intensidade: 0.3
        },
        { 
            area: "Região Administrativa", 
            temp_diff: 2.4, 
            cobertura: "Mista", 
            vegetacao: 30, 
            coords: [-15.8144, -47.9056],
            intensidade: 0.8
        },
        { 
            area: "Zona Industrial", 
            temp_diff: 3.2, 
            cobertura: "Concreto/Asfalto", 
            vegetacao: 5, 
            coords: [-15.7972, -47.9342],
            intensidade: 1.0
        }
    ];

    // Criar uma camada de heatmap para as ilhas de calor
    const heatPoints = heatIslands.map(area => [
        area.coords[0],
        area.coords[1],
        area.temp_diff * 10 // Intensidade baseada na diferença térmica
    ]);

    // Adicionar heatmap principal
    heatLayer = L.heatLayer(heatPoints, {
        radius: 35,
        blur: 20,
        maxZoom: 15,
        gradient: {
            0.1: 'blue',
            0.3: 'cyan',
            0.5: 'lime',
            0.7: 'yellow',
            0.9: 'orange',
            1.0: 'red'
        }
    }).addTo(map);

    // Adicionar marcadores com círculos de calor individuais
    heatIslands.forEach(area => {
        createHeatCircle(area);
    });
}

// Função para criar círculos de calor individuais
function createHeatCircle(area) {
    const radius = area.temp_diff * 400; // Raio baseado na diferença térmica
    
    // Criar círculo com gradiente de calor
    const heatCircle = L.circle(area.coords, {
        radius: radius,
        fillColor: getHeatColor(area.temp_diff),
        color: getHeatColor(area.temp_diff),
        fillOpacity: 0.4,
        opacity: 0.6,
        weight: 2,
        className: 'heat-circle'
    }).addTo(map);

    // Adicionar efeito de pulso
    addPulseEffect(heatCircle, area.temp_diff);

    // Popup informativo
    heatCircle.bindPopup(`
        <div class="heat-popup">
            <h4>🔥 ${area.area}</h4>
            <div class="heat-indicator">
                <div class="heat-level" style="background: ${getHeatColor(area.temp_diff)}">
                    <span>+${area.temp_diff}°C</span>
                </div>
            </div>
            <div class="heat-details">
                <p><strong>🌡️ Diferença térmica:</strong> +${area.temp_diff}°C</p>
                <p><strong>🏗️ Cobertura:</strong> ${area.cobertura}</p>
                <p><strong>🌿 Vegetação:</strong> ${area.vegetacao}%</p>
                <p><strong>🔥 Intensidade:</strong> ${getHeatIntensity(area.temp_diff)}</p>
            </div>
        </div>
    `);

    // Efeito hover
    heatCircle.on('mouseover', function() {
        this.setStyle({
            fillOpacity: 0.7,
            opacity: 0.9,
            weight: 3
        });
    });

    heatCircle.on('mouseout', function() {
        this.setStyle({
            fillOpacity: 0.4,
            opacity: 0.6,
            weight: 2
        });
    });

    currentMarkers.push(heatCircle);
}

// Função para obter cor baseada na temperatura
function getHeatColor(tempDiff) {
    if (tempDiff >= 3.0) return '#ff0000'; // Vermelho - Muito quente
    if (tempDiff >= 2.5) return '#ff4500'; // Laranja vermelho
    if (tempDiff >= 2.0) return '#ff8c00'; // Laranja
    if (tempDiff >= 1.5) return '#ffd700'; // Amarelo
    if (tempDiff >= 1.0) return '#ffff00'; // Amarelo claro
    return '#90ee90'; // Verde claro - Menos quente
}

// Função para obter intensidade textual
function getHeatIntensity(tempDiff) {
    if (tempDiff >= 3.0) return 'Muito Alta 🔥';
    if (tempDiff >= 2.5) return 'Alta 🔥';
    if (tempDiff >= 2.0) return 'Moderada-Alta 🔥';
    if (tempDiff >= 1.5) return 'Moderada 🌡️';
    if (tempDiff >= 1.0) return 'Baixa 🌡️';
    return 'Muito Baixa 🌿';
}

// Função para adicionar efeito de pulso
function addPulseEffect(circle, tempDiff) {
    const pulseInterval = tempDiff > 2.5 ? 2000 : tempDiff > 1.5 ? 3000 : 4000;
    
    setInterval(() => {
        circle.setStyle({
            fillOpacity: 0.6,
            opacity: 0.8
        });
        
        setTimeout(() => {
            circle.setStyle({
                fillOpacity: 0.4,
                opacity: 0.6
            });
        }, 1000);
    }, pulseInterval);
}

// Adicione este CSS para estilizar os popups
const heatStyle = document.createElement('style');
heatStyle.textContent = `
    .heat-popup {
        min-width: 250px;
        font-family: 'Inter', sans-serif;
    }
    
    .heat-popup h4 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 1.1em;
    }
    
    .heat-indicator {
        margin: 10px 0;
        text-align: center;
    }
    
    .heat-level {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 20px;
        color: white;
        font-weight: bold;
        font-size: 1.1em;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .heat-details {
        margin-top: 10px;
    }
    
    .heat-details p {
        margin: 5px 0;
        font-size: 0.9em;
        color: #555;
    }
    
    .heat-circle {
        animation: heatPulse 3s infinite;
    }
    
    @keyframes heatPulse {
        0% {
            filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.3));
        }
        50% {
            filter: drop-shadow(0 0 15px rgba(255, 0, 0, 0.6));
        }
        100% {
            filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.3));
        }
    }
    
    /* Estilos para modo escuro */
    [data-theme="dark"] .heat-popup h4 {
        color: #e2e8f0;
    }
    
    [data-theme="dark"] .heat-details p {
        color: #a0aec0;
    }
`;
document.head.appendChild(heatStyle);

// Mostrar informações da estação
function showStationInfo(station) {
    const infoContent = document.querySelector('.info-content');
    
    infoContent.innerHTML = `
        <div class="station-details">
            <h4>${station.nome}</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">📍 Localização</span>
                    <span class="detail-value">${station.cidade}, ${station.pais}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">📊 Parâmetros Monitorados</span>
                    <span class="detail-value">${station.parametros.map(p => p.name).join(', ')}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">🔢 Total de Medições</span>
                    <span class="detail-value">${station.contagem_medicoes}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">🌐 Coordenadas</span>
                    <span class="detail-value">${station.coordenadas.latitude.toFixed(4)}, ${station.coordenadas.longitude.toFixed(4)}</span>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('info-panel').classList.add('active');
}

// Modal de simulação
function openSimulationModal() {
    document.getElementById('simulation-modal').classList.add('active');
}

function closeSimulationModal() {
    document.getElementById('simulation-modal').classList.remove('active');
}

async function runSimulation() {
    showNotification('Executando simulação...', 'info');
    
    // Coletar parâmetros
    const params = {
        green_areas: parseInt(document.getElementById('green-areas').value),
        public_transport: parseInt(document.getElementById('public-transport').value),
        pollution_reduction: parseInt(document.getElementById('pollution-reduction').value)
    };

    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Atualizar score de sustentabilidade
    const newScore = Math.min(100, 72 + (params.green_areas * 0.1) + (params.public_transport * 0.15) + (params.pollution_reduction * 0.2));
    document.getElementById('sustainability-score').textContent = Math.round(newScore);

    closeSimulationModal();
    showNotification('Simulação concluída! Score atualizado.', 'success');
}

// Gerar relatório
async function generateReport() {
    try {
        showNotification('Gerando relatório...', 'info');
        
        // Coletar dados atuais
        const reportData = {
            cidade: "Brasília",
            data: new Date().toISOString(),
            indicadores: {
                temperatura: document.getElementById('temp-value').textContent,
                qualidade_ar: document.getElementById('air-value').textContent,
                umidade: document.getElementById('umidity-value').textContent,
                vento: document.getElementById('wind-value').textContent,
                score_sustentabilidade: document.getElementById('sustainability-score').textContent
            },
            camadas_ativas: Array.from(activeLayers)
        };

        // Simular geração de relatório
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Criar e baixar relatório
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_brasilia_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        showNotification('Relatório gerado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showNotification('Erro ao gerar relatório.', 'error');
    }
}

// Iniciar comparação
function startComparison() {
    showNotification('Funcionalidade de comparação em desenvolvimento.', 'info');
}

// Funções utilitárias
function formatIndicatorName(key) {
    const names = {
        'densidade_construcao': 'Densidade Construtiva',
        'areas_verdes': 'Áreas Verdes',
        'acessibilidade_transporte': 'Acessibilidade',
        'qualidade_ar': 'Qualidade do Ar',
        'ruido_urbano': 'Ruído Urbano',
        'infraestrutura_saneamento': 'Saneamento'
    };
    return names[key] || key;
}

function showNotification(message, type = 'info') {
    // Implementação básica de notificação
    console.log(`[${type.toUpperCase()}] ${message}`);
}

function showLoadingState(loading) {
    const updateTime = document.getElementById('update-time');
    if (loading) {
        updateTime.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Carregar dados mock para fallback
function loadMockData() {
    const mockStations = [
        { 
            nome: "Brasília Central", 
            coordenadas: { latitude: -15.8267, longitude: -47.9218 },
            parametros: [{name: "pm25"}, {name: "pm10"}, {name: "o3"}],
            cidade: "Brasília",
            pais: "BR",
            contagem_medicoes: 1500
        }
    ];

    mockStations.forEach(station => {
        const marker = L.marker([station.coordenadas.latitude, station.coordenadas.longitude]).addTo(map);
        const popupContent = `
            <div style="min-width: 200px">
                <b>📍 ${station.nome}</b><br>
                📊 Parâmetros: ${station.parametros.map(p => p.name).join(', ')}<br>
                🔢 Medições: ${station.contagem_medicoes}
            </div>
        `;
        marker.bindPopup(popupContent);
        currentMarkers.push(marker);
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando Dashboard Urbano...");
    
    // Carregar cidade selecionada
    const selectedCity = localStorage.getItem('selectedCity') || 'Brasília';
    
    initializeMap();
    initializeUIControls();
    loadCityData(selectedCity);
    
    // Atualização automática a cada 5 minutos
    setInterval(() => {
        const currentCity = document.getElementById('current-city').textContent;
        loadCityData(currentCity);
    }, 300000);
});
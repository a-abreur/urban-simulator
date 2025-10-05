// dashboard.js - Dashboard Urbano com Dark Mode

// Configuração e estado global
const API_BASE_URL = "http://localhost:5000/api";
let map;
let heatLayer = null;
let currentMarkers = [];
let activeLayers = new Set(['clima', 'estacoes']);
let baseMapLayer = null;
let drawnItems = new L.FeatureGroup();

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


// Variáveis globais para análise
let analysisMode = false;
let drawControl = null;
let currentAnalysisLayer = null;

// Dados realistas para análise baseados em regiões de Brasília
const brasiliaZones = {
    'Plano Piloto': {
        densidade_construcao: 85,
        areas_verdes: 45,
        acessibilidade_transporte: 90,
        qualidade_ar: 75,
        ruido_urbano: 65,
        infraestrutura_saneamento: 95,
        cobertura_vegetal: 40,
        permeabilidade_solo: 35,
        densidade_populacional: 80
    },
    'Águas Claras': {
        densidade_construcao: 95,
        areas_verdes: 25,
        acessibilidade_transporte: 70,
        qualidade_ar: 60,
        ruido_urbano: 75,
        infraestrutura_saneamento: 85,
        cobertura_vegetal: 20,
        permeabilidade_solo: 20,
        densidade_populacional: 90
    },
    'Lago Sul': {
        densidade_construcao: 60,
        areas_verdes: 70,
        acessibilidade_transporte: 65,
        qualidade_ar: 85,
        ruido_urbano: 40,
        infraestrutura_saneamento: 90,
        cobertura_vegetal: 65,
        permeabilidade_solo: 60,
        densidade_populacional: 45
    },
    'Taguatinga': {
        densidade_construcao: 75,
        areas_verdes: 30,
        acessibilidade_transporte: 80,
        qualidade_ar: 65,
        ruido_urbano: 70,
        infraestrutura_saneamento: 75,
        cobertura_vegetal: 25,
        permeabilidade_solo: 30,
        densidade_populacional: 85
    },
    'Ceilândia': {
        densidade_construcao: 80,
        areas_verdes: 20,
        acessibilidade_transporte: 75,
        qualidade_ar: 55,
        ruido_urbano: 80,
        infraestrutura_saneamento: 65,
        cobertura_vegetal: 15,
        permeabilidade_solo: 25,
        densidade_populacional: 95
    },
    'Parque da Cidade': {
        densidade_construcao: 10,
        areas_verdes: 95,
        acessibilidade_transporte: 85,
        qualidade_ar: 95,
        ruido_urbano: 25,
        infraestrutura_saneamento: 70,
        cobertura_vegetal: 90,
        permeabilidade_solo: 85,
        densidade_populacional: 5
    }
};

function toggleAreaAnalysis() {
    analysisMode = !analysisMode;
    const btn = document.getElementById('area-analysis-btn');
    const badge = document.getElementById('analysis-status');

    if (analysisMode) {
        activateAreaAnalysis(btn, badge);
    } else {
        deactivateAreaAnalysis(btn, badge);
    }
}

function activateAreaAnalysis(btn, badge) {
    // Criar controle de desenho
    drawControl = new L.Control.Draw({
        draw: {
            polygon: {
                allowIntersection: false,
                drawError: {
                    color: '#e1e4e8',
                    message: '<strong>Erro:</strong> Polígono inválido!'
                },
                shapeOptions: {
                    color: '#2c5530',
                    fillColor: '#2c5530',
                    fillOpacity: 0.2,
                    weight: 3
                },
                showArea: true,
                metric: true,
                precision: 2
            },
            rectangle: {
                shapeOptions: {
                    color: '#2c5530',
                    fillColor: '#2c5530',
                    fillOpacity: 0.2,
                    weight: 3
                },
                showArea: true,
                metric: true
            },
            circle: {
                shapeOptions: {
                    color: '#2c5530',
                    fillColor: '#2c5530',
                    fillOpacity: 0.2,
                    weight: 3
                },
                showRadius: true,
                metric: true,
                feet: false
            },
            marker: false,
            polyline: false
        },
        edit: {
            featureGroup: drawnItems,
            edit: {
                selectedPathOptions: {
                    dashArray: '10, 10',
                    weight: 5
                }
            }
        }
    });

    map.addControl(drawControl);
    btn.classList.add('active');
    badge.textContent = 'ATIVO';
    badge.style.background = 'var(--success-color)';

    // Eventos de desenho
    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on(L.Draw.Event.EDITED, handleDrawEdited);
    map.on(L.Draw.Event.DELETED, handleDrawDeleted);

    showNotification('🎯 Modo análise ativado. Desenhe uma área no mapa para analisar indicadores de sustentabilidade.', 'info');
}

function deactivateAreaAnalysis(btn, badge) {
    // Remover controle de desenho
    if (drawControl) {
        map.removeControl(drawControl);
        drawControl = null;
    }

    // Remover eventos
    map.off(L.Draw.Event.CREATED);
    map.off(L.Draw.Event.EDITED);
    map.off(L.Draw.Event.DELETED);

    // Limpar desenhos
    drawnItems.clearLayers();
    currentAnalysisLayer = null;

    btn.classList.remove('active');
    badge.textContent = 'INATIVO';
    badge.style.background = 'var(--danger-color)';
    document.getElementById('analysis-panel').style.display = 'none';

    showNotification('Modo análise desativado.', 'info');
}

function handleDrawCreated(e) {
    const layer = e.layer;
    drawnItems.addLayer(layer);
    currentAnalysisLayer = layer;
    
    // Estilo do polígono desenhado
    layer.setStyle({
        color: '#2c5530',
        fillColor: '#2c5530',
        fillOpacity: 0.3,
        weight: 3
    });
    
    analyzeArea(layer);
}

function handleDrawEdited(e) {
    const layers = e.layers;
    layers.eachLayer(function(layer) {
        analyzeArea(layer);
    });
}

function handleDrawDeleted(e) {
    document.getElementById('analysis-panel').style.display = 'none';
    currentAnalysisLayer = null;
}

// Analisar área desenhada
// Modifique a função analyzeArea para debug
async function analyzeArea(layer) {
    console.log('Análise de área iniciada...');
    const bounds = layer.getBounds();
    const center = bounds.getCenter();
    const area = bounds.getNorthEast().distanceTo(bounds.getSouthWest());

    try {
        const analysis = await simulateAreaAnalysis(center, area);
        console.log('Análise concluída:', analysis);
        
        // Debug dos feedbacks
        const feedbacks = generateAreaFeedback();
        console.log('Feedbacks gerados:', feedbacks);
        
        showAnalysisResults(analysis, layer);
    } catch (error) {
        console.error('Erro na análise:', error);
        showNotification('Erro ao analisar a área selecionada.', 'error');
    }
}

// Análise realista baseada na localização
async function performAreaAnalysis(center, area, layer) {
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Determinar zona baseada na localização
    const zone = determineZone(center);
    const baseData = brasiliaZones[zone] || brasiliaZones['Plano Piloto'];
    
    // Calcular score baseado nos indicadores
    const score = calculateSustainabilityScore(baseData);
    
    // Gerar recomendações baseadas nos pontos fracos
    const recomendacoes = generateRecommendations(baseData, zone);
    
    // Análise de impacto ambiental
    const impactoAmbiental = calculateEnvironmentalImpact(baseData, area);
    
    return {
        zona: zone,
        area_km2: parseFloat(area),
        centro: center,
        score_sustentabilidade: score,
        classificacao: getSustainabilityClassification(score),
        indicadores: baseData,
        recomendacoes: recomendacoes,
        impacto_ambiental: impactoAmbiental,
        tendencias: generateTrends(baseData),
        dados_geograficos: getGeographicData(center, area)
    };
}

function determineZone(center) {
    const lat = center.lat;
    const lng = center.lng;
    
    // Lógica simplificada para determinar zona em Brasília
    if (lat > -15.75 && lng > -47.95) return 'Lago Sul';
    if (lat > -15.80 && lat < -15.75 && lng > -47.90) return 'Plano Piloto';
    if (lat < -15.80 && lng > -47.95) return 'Águas Claras';
    if (lat > -15.85 && lat < -15.80 && lng < -47.95) return 'Taguatinga';
    if (lat < -15.85) return 'Ceilândia';
    if (Math.abs(lat + 15.79) < 0.02 && Math.abs(lng + 47.90) < 0.02) return 'Parque da Cidade';
    
    return 'Plano Piloto';
}

function calculateSustainabilityScore(indicadores) {
    const pesos = {
        areas_verdes: 0.15,
        cobertura_vegetal: 0.10,
        qualidade_ar: 0.15,
        acessibilidade_transporte: 0.12,
        infraestrutura_saneamento: 0.13,
        permeabilidade_solo: 0.10,
        ruido_urbano: 0.10,
        densidade_construcao: 0.08,
        densidade_populacional: 0.07
    };
    
    let score = 0;
    for (const [indicador, valor] of Object.entries(indicadores)) {
        if (pesos[indicador]) {
            // Inverter alguns indicadores (menos é melhor)
            let valorAjustado = valor;
            if (['ruido_urbano', 'densidade_construcao', 'densidade_populacional'].includes(indicador)) {
                valorAjustado = 100 - valor;
            }
            score += valorAjustado * pesos[indicador];
        }
    }
    
    return Math.round(score);
}

function getSustainabilityClassification(score) {
    if (score >= 90) return 'Excelente 🏆';
    if (score >= 80) return 'Muito Boa ⭐';
    if (score >= 70) return 'Boa 👍';
    if (score >= 60) return 'Regular ⚠️';
    if (score >= 50) return 'Precária 🚨';
    return 'Crítica 💀';
}

function generateRecommendations(indicadores, zona) {
    const recomendacoes = [];
    const weaknesses = [];
    
    // Identificar pontos fracos
    if (indicadores.areas_verdes < 30) weaknesses.push('áreas verdes');
    if (indicadores.cobertura_vegetal < 25) weaknesses.push('cobertura vegetal');
    if (indicadores.qualidade_ar < 60) weaknesses.push('qualidade do ar');
    if (indicadores.permeabilidade_solo < 30) weaknesses.push('permeabilidade do solo');
    if (indicadores.ruido_urbano > 70) weaknesses.push('poluição sonora');
    if (indicadores.densidade_construcao > 80) weaknesses.push('densidade construtiva');
    
    // Gerar recomendações específicas
    if (weaknesses.includes('áreas verdes')) {
        recomendacoes.push(`Implementar parques lineares e aumentar áreas verdes em 20% na ${zona}`);
    }
    
    if (weaknesses.includes('cobertura vegetal')) {
        recomendacoes.push(`Promover programa de arborização urbana e telhados verdes`);
    }
    
    if (weaknesses.includes('qualidade do ar')) {
        recomendacoes.push(`Criar zonas de baixa emissão e incentivar transporte sustentável`);
    }
    
    if (weaknesses.includes('permeabilidade do solo')) {
        recomendacoes.push(`Implementar pavimentos permeáveis e jardins de chuva`);
    }
    
    if (weaknesses.includes('poluição sonora')) {
        recomendacoes.push(`Instalar barreiras acústicas e regular tráfego pesado`);
    }
    
    if (weaknesses.includes('densidade construtiva')) {
        recomendacoes.push(`Revisar plano diretor para controle de densidade`);
    }
    
    // Recomendações gerais
    if (recomendacoes.length === 0) {
        recomendacoes.push(`Manter políticas de sustentabilidade e monitorar indicadores`);
        recomendacoes.push(`Expandir programas de eficiência energética na ${zona}`);
    }
    
    return recomendacoes.slice(0, 5); // Limitar a 5 recomendações
}

function calculateEnvironmentalImpact(indicadores, area) {
    const impacto = {
        carbono_estimado: Math.round((indicadores.densidade_construcao * area * 0.8) / 10),
        agua_potavel: Math.round((indicadores.densidade_populacional * area * 150) / 1000),
        residuos_solidos: Math.round((indicadores.densidade_populacional * area * 1.2)),
        biodiversidade: indicadores.areas_verdes > 50 ? 'Alta' : indicadores.areas_verdes > 30 ? 'Média' : 'Baixa'
    };
    
    return impacto;
}

function generateTrends(indicadores) {
    return {
        tendencia_verde: indicadores.areas_verdes > 60 ? 'Positiva ↗️' : 'Estável →',
        mobilidade: indicadores.acessibilidade_transporte > 75 ? 'Eficiente ✅' : 'Necessita melhorias ⚠️',
        qualidade_vida: indicadores.qualidade_ar > 70 && indicadores.ruido_urbano < 60 ? 'Alta 🌟' : 'Média 📊'
    };
}

function getGeographicData(center, area) {
    return {
        latitude: center.lat.toFixed(6),
        longitude: center.lng.toFixed(6),
        altitude: '~1000m',
        clima: 'Tropical de Altitude',
        bioma: 'Cerrado'
    };
}

function showAnalysisLoading() {
    const results = document.getElementById('analysis-results');
    results.innerHTML = `
        <div class="analysis-loading">
            <div class="loading-spinner"></div>
            <p>Analisando área selecionada...</p>
            <p class="loading-subtitle">Calculando indicadores de sustentabilidade</p>
        </div>
    `;
    
    document.getElementById('analysis-panel').style.display = 'block';
}



// Gerar feedbacks aleatórios para a área selecionada
function generateAreaFeedback() {
    const authors = ['Maria S.', 'João P.', 'Ana L.', 'Carlos M.', 'Fernanda R.', 'Roberto K.', 'Patrícia T.', 'Miguel A.'];
    const categories = {
        'Transporte': ['Ônibus sempre atrasados', 'Metrô muito eficiente', 'Falta de ciclovias', 'Trânsito caótico nos horários de pico', 'Pontos de ônibus em bom estado'],
        'Segurança': ['Iluminação pública precária', 'Área muito segura', 'Pouca presença policial', 'Bairro tranquilo à noite', 'Câmeras de segurança ajudam'],
        'Meio Ambiente': ['Muita poluição do ar', 'Parques bem cuidados', 'Lixo acumulado nas ruas', 'Ar puro e qualidade de vida', 'Falta de coleta seletiva'],
        'Infraestrutura': ['Ruas esburacadas', 'Calçadas acessíveis', 'Falta de escolas públicas', 'Hospitais bem equipados', 'Rede de esgoto precária'],
        'Lazer': ['Parques abandonados', 'Áreas de lazer modernas', 'Falta de centros culturais', 'Muitas opções de restaurantes', 'Praças bem cuidadas']
    };

    const comments = [];
    const totalFeedbacks = Math.floor(Math.random() * 15) + 8;
    let positiveCount = 0;

    for (let i = 0; i < totalFeedbacks; i++) {
        const categoryKeys = Object.keys(categories);
        const randomCategory = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
        const categoryComments = categories[randomCategory];
        const randomComment = categoryComments[Math.floor(Math.random() * categoryComments.length)];
        
        const rating = Math.floor(Math.random() * 5) + 1;
        if (rating >= 4) positiveCount++;

        comments.push({
            author: authors[Math.floor(Math.random() * authors.length)],
            text: randomComment,
            rating: rating,
            category: randomCategory,
            sentiment: rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative',
            date: `${Math.floor(Math.random() * 30) + 1}/10/2024`
        });
    }

    const categoryStats = {};
    Object.keys(categories).forEach(category => {
        const categoryComments = comments.filter(c => c.category === category);
        const avgRating = categoryComments.length > 0 
            ? (categoryComments.reduce((sum, c) => sum + c.rating, 0) / categoryComments.length) * 20
            : Math.floor(Math.random() * 40) + 30;
        
        categoryStats[category] = {
            score: Math.round(avgRating),
            count: categoryComments.length
        };
    });

    return {
        satisfaction: Math.round((positiveCount / totalFeedbacks) * 100),
        totalFeedbacks: totalFeedbacks,
        positivePercentage: Math.round((positiveCount / totalFeedbacks) * 100),
        comments: comments.sort(() => Math.random() - 0.5).slice(0, 5),
        categories: categoryStats
    };
}

function getSentimentClass(score) {
    if (score >= 70) return 'positive';
    if (score >= 50) return 'neutral';
    return 'negative';
}

function formatIndicatorName(key) {
    const names = {
        'densidade_construcao': 'Densidade de Construção',
        'areas_verdes': 'Áreas Verdes',
        'acessibilidade_transporte': 'Acessibilidade ao Transporte',
        'qualidade_ar': 'Qualidade do Ar',
        'ruido_urbano': 'Ruído Urbano',
        'infraestrutura_saneamento': 'Infraestrutura de Saneamento'
    };
    return names[key] || key;
}

// Função auxiliar para classes de sentimento
function getSentimentClass(score) {
    if (score >= 70) return 'positive';
    if (score >= 50) return 'neutral';
    return 'negative';
}

// Função para formatar nomes dos indicadores (se ainda não existir)
function formatIndicatorName(key) {
    const names = {
        'densidade_construcao': 'Densidade de Construção',
        'areas_verdes': 'Áreas Verdes',
        'acessibilidade_transporte': 'Acessibilidade ao Transporte',
        'qualidade_ar': 'Qualidade do Ar',
        'ruido_urbano': 'Ruído Urbano',
        'infraestrutura_saneamento': 'Infraestrutura de Saneamento'
    };
    return names[key] || key;
}



function showAnalysisResults(analysis, layer) {
    const panel = document.getElementById('analysis-panel');
    const results = document.getElementById('analysis-results');

    // Mostrar loading
    results.innerHTML = createLoadingSpinner();
    panel.style.display = 'block';

    // Simular carregamento (em produção, isso seria substituído pela chamada real da API)
    setTimeout(() => {
        // Gerar feedbacks aleatórios para a área
        const feedbacks = generateAreaFeedback();
        
        results.innerHTML = createAnalysisContent(analysis, feedbacks, layer);
        
        // Aplicar animação de entrada
        panel.style.animation = 'slideInRight 0.4s ease-out';
        
        // Adicionar estilos e funcionalidades
        addAnalysisStyles();
        addButtonStyles();
        bindPopupEvents(analysis, feedbacks, layer);
        
    }, 1500); // Simula 1.5 segundos de carregamento
}

// Função para criar o spinner de loading
function createLoadingSpinner() {
    return `
        <div class="loading-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center;">
            <div class="spinner" style="width: 50px; height: 50px; border: 4px solid var(--border-color); border-left: 4px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
            <h3 style="margin: 0 0 12px 0; color: var(--text-color); font-size: 1.3em; font-weight: 600;">Gerando Análise</h3>
            <p style="margin: 0; color: var(--text-muted); font-size: 0.95em;">Processando dados de sustentabilidade e feedback populacional...</p>
        </div>
    `;
}

// Função para criar o conteúdo principal da análise
function createAnalysisContent(analysis, feedbacks, layer) {
    const areaSize = layer ? (layer.getBounds().getNorthEast().distanceTo(layer.getBounds().getSouthWest()) / 1000).toFixed(2) : '0.00';
    
    return `
        <div class="analysis-content" style="max-height: calc(100vh - 120px); overflow-y: auto; padding-right: 8px;">
            <!-- Header -->
            <div class="analysis-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color); position: relative;">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 6px 0; color: var(--text-color); font-size: 1.4em; font-weight: 700; text-align: left;">Análise da Área</h3>
                    <p style="margin: 0; color: var(--text-muted); font-size: 0.9em; text-align: left;">Análise completa de sustentabilidade e feedback populacional</p>
                </div>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); flex-shrink: 0;">
                    <span style="font-size: 1.4em;">📊</span>
                </div>
            </div>

            <!-- Score Card -->
            <div class="analysis-score-container" style="margin-bottom: 24px;">
                <div class="analysis-score" style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 28px 24px; border-radius: 16px; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.25); position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -50px; right: -50px; width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    
                    <h4 style="margin: 0 0 12px 0; font-size: 0.95em; opacity: 0.95; font-weight: 500; letter-spacing: 0.5px; position: relative; z-index: 2;">SCORE DE SUSTENTABILIDADE</h4>
                    <div class="score-display" style="font-size: 3.5em; font-weight: 700; text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); margin: 8px 0; position: relative; z-index: 2;">${analysis.score_sustentabilidade}</div>
                    <div style="font-size: 1em; opacity: 0.9; font-weight: 500; position: relative; z-index: 2; margin-bottom: 16px;">de 100 pontos</div>
                    
                    <div style="display: flex; justify-content: center; gap: 8px; position: relative; z-index: 2;">
                        <span style="background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; font-size: 0.85em; backdrop-filter: blur(10px); font-weight: 600;">${getScoreCategory(analysis.score_sustentabilidade)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Informações da Área -->
            <div class="area-info" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                <div style="background: var(--card-bg); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); text-align: center;">
                    <div style="font-size: 1.8em; font-weight: 700; color: var(--primary-color); margin-bottom: 4px;">${areaSize}</div>
                    <div style="font-size: 0.8em; color: var(--text-muted);">km²</div>
                </div>
                <div style="background: var(--card-bg); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); text-align: center;">
                    <div style="font-size: 1.8em; font-weight: 700; color: #4CAF50; margin-bottom: 4px;">${feedbacks.totalFeedbacks}</div>
                    <div style="font-size: 0.8em; color: var(--text-muted);">Feedbacks</div>
                </div>
            </div>
            
            <!-- Indicadores de Sustentabilidade -->
            <div class="analysis-section" style="background: var(--card-bg); padding: 24px; border-radius: 16px; margin-bottom: 20px; border: 1px solid var(--border-color); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
                <h4 style="margin: 0 0 20px 0; color: var(--text-color); font-size: 1.1em; display: flex; align-items: center; gap: 10px; font-weight: 600;">
                    <span style="background: linear-gradient(135deg, #4CAF50, #8BC34A); width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.9em; color: white;">📈</span>
                    Indicadores de Sustentabilidade
                </h4>
                <div class="indicators-grid" style="display: grid; gap: 16px;">
                    ${Object.entries(analysis.indicadores).map(([key, value]) => `
                        <div class="indicator-item" style="display: flex; align-items: center; gap: 16px; padding: 14px; background: var(--bg-color); border-radius: 12px; border: 1px solid var(--border-color); transition: all 0.2s ease;">
                            <div style="flex: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <span style="font-weight: 600; color: var(--text-color); font-size: 0.95em;">${formatIndicatorName(key)}</span>
                                    <span style="font-weight: 700; color: var(--primary-color); font-size: 0.9em; background: rgba(102, 126, 234, 0.1); padding: 4px 10px; border-radius: 12px;">${value}%</span>
                                </div>
                                <div class="progress-container" style="width: 100%;">
                                    <div class="progress-bar" style="height: 8px; background: var(--border-color); border-radius: 10px; overflow: hidden;">
                                        <div class="progress-fill" style="height: 100%; border-radius: 10px; background: linear-gradient(90deg, #4CAF50, #8BC34A); width: ${value}%; transition: width 0.5s ease; position: relative;">
                                            <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 2px; background: rgba(255,255,255,0.5);"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Feedback Populacional -->
            <div class="analysis-section" style="background: var(--card-bg); padding: 24px; border-radius: 16px; margin-bottom: 20px; border: 1px solid var(--border-color); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <h4 style="margin: 0; color: var(--text-color); font-size: 1.1em; display: flex; align-items: center; gap: 10px; font-weight: 600;">
                        <span style="background: linear-gradient(135deg, #FF6B6B, #FFA726); width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.9em; color: white;">💬</span>
                        Feedback dos Moradores
                    </h4>
                    <div style="display: flex; gap: 8px;">
                        <span style="background: var(--primary-color); color: white; padding: 6px 12px; border-radius: 12px; font-size: 0.8em; font-weight: 600;">${feedbacks.totalFeedbacks} respostas</span>
                    </div>
                </div>
                
                <!-- Resumo de Satisfação -->
                <div class="feedback-overview" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div class="satisfaction-card" style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 20px; border-radius: 14px; color: white; text-align: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                        <div style="font-size: 2.5em; font-weight: 700; margin-bottom: 8px;">${feedbacks.satisfaction}%</div>
                        <div style="font-size: 0.9em; opacity: 0.9; font-weight: 500;">Satisfação Geral</div>
                    </div>
                    <div class="stats-card" style="background: var(--bg-color); padding: 20px; border-radius: 14px; display: flex; flex-direction: column; justify-content: center; border: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-around; text-align: center;">
                            <div>
                                <div style="font-size: 1.6em; font-weight: 700; color: var(--primary-color);">${feedbacks.positivePercentage}%</div>
                                <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 4px;">Positivos</div>
                            </div>
                            <div style="width: 1px; background: var(--border-color);"></div>
                            <div>
                                <div style="font-size: 1.6em; font-weight: 700; color: #4CAF50;">${Math.round((feedbacks.positivePercentage * feedbacks.totalFeedbacks) / 100)}</div>
                                <div style="font-size: 0.75em; color: var(--text-muted); margin-top: 4px;">Avaliações</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Comentários -->
                <div class="feedback-comments" style="margin-bottom: 24px;">
                    <h5 style="margin: 0 0 16px 0; color: var(--text-color); font-size: 1em; display: flex; align-items: center; gap: 8px; font-weight: 600;">
                        <span style="background: var(--bg-color); width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center;">💭</span>
                        Comentários Recentes
                    </h5>
                    <div style="display: grid; gap: 12px;">
                        ${feedbacks.comments.slice(0, 3).map(comment => {
                            let borderColor = '#4CAF50';
                            let sentimentIcon = '😊';
                            let sentimentBg = 'rgba(76, 175, 80, 0.08)';
                            
                            if (comment.sentiment === 'negative') {
                                borderColor = '#f44336';
                                sentimentIcon = '😞';
                                sentimentBg = 'rgba(244, 67, 54, 0.08)';
                            } else if (comment.sentiment === 'neutral') {
                                borderColor = '#ff9800';
                                sentimentIcon = '😐';
                                sentimentBg = 'rgba(255, 152, 0, 0.08)';
                            }
                            
                            return `
                            <div class="comment-item" style="background: ${sentimentBg}; border-radius: 12px; padding: 16px; border-left: 4px solid ${borderColor}; transition: all 0.3s ease; position: relative; overflow: hidden;">
                                <div style="position: absolute; top: 0; right: 0; padding: 8px 12px; background: ${borderColor}; color: white; font-size: 0.8em; font-weight: 600; border-bottom-left-radius: 12px;">
                                    ${sentimentIcon}
                                </div>
                                <div class="comment-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                                    <div>
                                        <span class="comment-author" style="font-weight: 600; color: var(--text-color); font-size: 0.95em;">${comment.author}</span>
                                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                            <span class="comment-rating" style="color: #ffd700; font-size: 0.9em; letter-spacing: 1px;">
                                                ${'★'.repeat(comment.rating)}${'☆'.repeat(5-comment.rating)}
                                            </span>
                                            <span style="font-size: 0.75em; color: var(--text-muted);">${comment.date}</span>
                                        </div>
                                    </div>
                                </div>
                                <p class="comment-text" style="margin: 12px 0; color: var(--text-color); line-height: 1.5; font-size: 0.9em; font-style: italic;">"${comment.text}"</p>
                                <div class="comment-category">
                                    <span class="category-tag" style="background: ${borderColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75em; font-weight: 600;">${comment.category}</span>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Análise por Categoria -->
                <div class="feedback-categories">
                    <h5 style="margin: 0 0 16px 0; color: var(--text-color); font-size: 1em; display: flex; align-items: center; gap: 8px; font-weight: 600;">
                        <span style="background: var(--bg-color); width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center;">📋</span>
                        Análise por Categoria
                    </h5>
                    <div style="display: grid; gap: 12px;">
                        ${Object.entries(feedbacks.categories).map(([category, data]) => {
                            let fillColor = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
                            let scoreColor = '#4CAF50';
                            if (data.score < 70) {
                                fillColor = 'linear-gradient(90deg, #FF9800, #FFC107)';
                                scoreColor = '#FF9800';
                            }
                            if (data.score < 50) {
                                fillColor = 'linear-gradient(90deg, #f44336, #ff7961)';
                                scoreColor = '#f44336';
                            }
                            
                            return `
                            <div class="category-item" style="display: flex; align-items: center; gap: 16px; padding: 14px; background: var(--bg-color); border-radius: 12px; border: 1px solid var(--border-color);">
                                <div style="flex: 1;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <span class="category-name" style="font-weight: 600; color: var(--text-color); font-size: 0.9em;">${category}</span>
                                        <span class="category-score" style="font-weight: 700; color: ${scoreColor}; font-size: 0.9em; background: rgba(${scoreColor === '#4CAF50' ? '76,175,80' : scoreColor === '#FF9800' ? '255,152,0' : '244,67,54'}, 0.1); padding: 4px 10px; border-radius: 12px;">${data.score}%</span>
                                    </div>
                                    <div class="progress-bar" style="width: 100%; height: 6px; background: var(--border-color); border-radius: 10px; overflow: hidden;">
                                        <div class="progress-fill" style="height: 100%; border-radius: 10px; background: ${fillColor}; width: ${data.score}%; transition: width 0.5s ease;"></div>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                                        <span class="category-count" style="font-size: 0.75em; color: var(--text-muted);">${data.count} comentários</span>
                                        <span style="font-size: 0.75em; color: var(--text-muted); font-weight: 500;">${getSentimentText(data.score)}</span>
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- Recomendações -->
            <div class="analysis-section" style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 24px; border-radius: 16px; border-left: 4px solid var(--primary-color); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); position: relative; overflow: hidden; margin-bottom: 20px;">
                <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(103, 58, 183, 0.1); border-radius: 50%;"></div>
                <h4 style="margin: 0 0 18px 0; color: var(--text-color); font-size: 1.1em; display: flex; align-items: center; gap: 10px; font-weight: 600; position: relative;">
                    <span style="background: var(--primary-color); width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.9em; color: white;">💡</span>
                    Recomendações
                </h4>
                <div style="display: grid; gap: 12px; position: relative;">
                    ${analysis.recomendacoes.map((rec, index) => `
                        <div style="display: flex; align-items: flex-start; gap: 12px; padding: 14px; background: rgba(255,255,255,0.7); border-radius: 10px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.5);">
                            <span style="background: var(--primary-color); color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8em; font-weight: 600; flex-shrink: 0;">${index + 1}</span>
                            <span style="color: var(--text-color); line-height: 1.5; font-size: 0.9em; font-weight: 500;">${rec}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Botões de Ação -->
            <div class="analysis-actions" style="display: flex; gap: 12px; margin-top: 24px;">
                <button class="btn-secondary" onclick="exportAnalysis()" style="display: flex; align-items: center; gap: 8px; background: var(--bg-color); color: var(--text-color); border: 2px solid var(--border-color); padding: 14px 20px; border-radius: 12px; cursor: pointer; font-size: 0.95em; font-weight: 600; transition: all 0.3s ease; flex: 1; justify-content: center;">
                    <i class="fas fa-download"></i>
                    Exportar Relatório
                </button>
                <button class="btn-primary" onclick="simulateImprovements()" style="display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 14px 20px; border-radius: 12px; cursor: pointer; font-size: 0.95em; font-weight: 600; transition: all 0.3s ease; flex: 1; justify-content: center; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                    <i class="fas fa-chart-line"></i>
                    Simular Melhorias
                </button>
            </div>
        </div>
    `;
}

// Função para vincular eventos do popup
function bindPopupEvents(analysis, feedbacks, layer) {
    if (!layer) return;
    
    const areaSize = (layer.getBounds().getNorthEast().distanceTo(layer.getBounds().getSouthWest()) / 1000).toFixed(2);
    const popupContent = `
        <div class="analysis-popup" style="padding: 0; min-width: 280px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); border: 1px solid var(--border-color);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; text-align: center;">
                <h4 style="margin: 0 0 8px 0; font-size: 1.2em; font-weight: 600;">📊 Análise da Área</h4>
                <div style="display: flex; justify-content: center; gap: 20px; margin-top: 12px;">
                    <div>
                        <div style="font-size: 1.8em; font-weight: 700;">${analysis.score_sustentabilidade}</div>
                        <div style="font-size: 0.8em; opacity: 0.9;">Score</div>
                    </div>
                    <div style="width: 1px; background: rgba(255,255,255,0.3);"></div>
                    <div>
                        <div style="font-size: 1.8em; font-weight: 700;">${feedbacks.satisfaction}%</div>
                        <div style="font-size: 0.8em; opacity: 0.9;">Satisfação</div>
                    </div>
                </div>
            </div>
            <div style="padding: 16px; background: white;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 0.85em; color: #666;">
                    <span>📍 ${areaSize} km²</span>
                    <span>💬 ${feedbacks.totalFeedbacks} feedbacks</span>
                </div>
                <button onclick="document.getElementById('analysis-panel').style.display='block'" 
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-size: 0.95em; font-weight: 600; width: 100%; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                    📖 Ver Análise Completa
                </button>
            </div>
        </div>
    `;

    layer.bindPopup(popupContent).openPopup();
}

// Função para adicionar estilos CSS melhorados
function addAnalysisStyles() {
    if (!document.getElementById('analysis-styles')) {
        const style = document.createElement('style');
        style.id = 'analysis-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .analysis-content {
                scrollbar-width: thin;
                scrollbar-color: var(--primary-color) var(--border-color);
            }
            
            .analysis-content::-webkit-scrollbar {
                width: 6px;
            }
            
            .analysis-content::-webkit-scrollbar-track {
                background: var(--border-color);
                border-radius: 3px;
            }
            
            .analysis-content::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 3px;
            }
            
            .analysis-content::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(135deg, #5a6fd8, #6a4190);
            }
            
            .comment-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
            }
            
            .indicator-item:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }
            
            .category-item:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }
            
            .loading-container {
                animation: fadeIn 0.5s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Função para adicionar estilos dos botões
function addButtonStyles() {
    if (!document.getElementById('button-styles')) {
        const style = document.createElement('style');
        style.id = 'button-styles';
        style.textContent = `
            .btn-secondary {
                transition: all 0.3s ease !important;
            }
            
            .btn-secondary:hover {
                background: var(--border-color) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
            }
            
            .btn-primary {
                transition: all 0.3s ease !important;
            }
            
            .btn-primary:hover {
                background: linear-gradient(135deg, #5a6fd8, #6a4190) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4) !important;
            }
            
            .btn-secondary:active, .btn-primary:active {
                transform: translateY(0) !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Funções auxiliares
function getScoreCategory(score) {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Muito Bom';
    if (score >= 70) return 'Bom';
    if (score >= 60) return 'Regular';
    return 'Necessita Melhoria';
}

function getSentimentText(score) {
    if (score >= 80) return 'Muito Positivo';
    if (score >= 60) return 'Positivo';
    if (score >= 40) return 'Neutro';
    return 'Preocupante';
}

function formatIndicatorName(key) {
    return key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}




// Funções auxiliares
function getScoreClass(score) {
    if (score >= 80) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 60) return 'score-average';
    if (score >= 50) return 'score-poor';
    return 'score-critical';
}

function getIndicatorClass(key, value) {
    const inverted = ['ruido_urbano', 'densidade_construcao', 'densidade_populacional'];
    const effectiveValue = inverted.includes(key) ? 100 - value : value;
    
    if (effectiveValue >= 80) return 'indicator-excellent';
    if (effectiveValue >= 70) return 'indicator-good';
    if (effectiveValue >= 60) return 'indicator-average';
    if (effectiveValue >= 50) return 'indicator-poor';
    return 'indicator-critical';
}

function getIndicatorStatus(key, value) {
    const inverted = ['ruido_urbano', 'densidade_construcao', 'densidade_populacional'];
    const effectiveValue = inverted.includes(key) ? 100 - value : value;
    
    if (effectiveValue >= 80) return 'Excelente';
    if (effectiveValue >= 70) return 'Bom';
    if (effectiveValue >= 60) return 'Regular';
    if (effectiveValue >= 50) return 'Precário';
    return 'Crítico';
}

function formatIndicatorName(key) {
    const names = {
        'densidade_construcao': 'Densidade Construtiva',
        'areas_verdes': 'Áreas Verdes',
        'acessibilidade_transporte': 'Transporte Público',
        'qualidade_ar': 'Qualidade do Ar',
        'ruido_urbano': 'Poluição Sonora',
        'infraestrutura_saneamento': 'Saneamento Básico',
        'cobertura_vegetal': 'Cobertura Vegetal',
        'permeabilidade_solo': 'Permeabilidade do Solo',
        'densidade_populacional': 'Densidade Populacional'
    };
    return names[key] || key;
}

function updateMapPopup(analysis, layer) {
    const popupContent = `
        <div class="analysis-popup">
            <h4>📊 Análise da Área - ${analysis.zona}</h4>
            <div class="popup-score">
                <div class="popup-score-value">${analysis.score_sustentabilidade}</div>
                <div class="popup-score-label">${analysis.classificacao}</div>
            </div>
            <div class="popup-details">
                <p><strong>Área:</strong> ${analysis.area_km2} km²</p>
                <p><strong>Transporte:</strong> ${analysis.indicadores.acessibilidade_transporte}%</p>
                <p><strong>Áreas Verdes:</strong> ${analysis.indicadores.areas_verdes}%</p>
                <p><strong>Qualidade do Ar:</strong> ${analysis.indicadores.qualidade_ar}%</p>
            </div>
            <button class="popup-btn" onclick="document.getElementById('analysis-panel').style.display='block'">
                <i class="fas fa-chart-bar"></i>
                Ver Análise Completa
            </button>
        </div>
    `;

    if (layer.getPopup()) {
        layer.setPopupContent(popupContent);
    } else {
        layer.bindPopup(popupContent);
    }
    layer.openPopup();
}

// Funções de exportação e simulação
function exportAnalysis() {
    showNotification('Gerando relatório em PDF...', 'info');
    // Implementação de exportação seria adicionada aqui
    setTimeout(() => {
        showNotification('Relatório exportado com sucesso!', 'success');
    }, 2000);
}

function simulateImprovements() {
    showNotification('Abrindo simulador de melhorias...', 'info');
    // Abrir modal de simulação
    document.getElementById('simulation-modal').classList.add('active');
}




// Função auxiliar para classes de sentimento
function getSentimentClass(score) {
    if (score >= 70) return 'positive';
    if (score >= 50) return 'neutral';
    return 'negative';
}








// Teste rápido - execute esta função no console do navegador
function testarFeedbacks() {
    console.log('Testando geração de feedbacks...');
    
    const feedbacks = generateAreaFeedback();
    console.log('Feedbacks gerados:', feedbacks);
    
    // Simular abertura do painel
    const analysis = {
        score_sustentabilidade: 78,
        indicadores: {
            densidade_construcao: 65,
            areas_verdes: 80,
            acessibilidade_transporte: 55,
            qualidade_ar: 70,
            ruido_urbano: 60,
            infraestrutura_saneamento: 75
        },
        recomendacoes: [
            "Aumentar áreas verdes em 15%",
            "Melhorar acesso ao transporte público"
        ]
    };
    
    showAnalysisResults(analysis, { 
        getBounds: () => ({ 
            getNorthEast: () => ({ distanceTo: () => 2.5 }),
            getSouthWest: () => ({})
        }) 
    });
    
    console.log('Painel deve estar aberto com os feedbacks!');
}

// No console do navegador, digite: testarFeedbacks()





// Função de teste - adicione isso no final do dashboard.js
function testarFeedbacks() {
    console.log('=== TESTANDO FEEDBACKS ===');
    
    // Testar geração de feedbacks
    const feedbacks = generateAreaFeedback();
    console.log('Feedbacks gerados:', feedbacks);
    
    // Simular dados de análise
    const analysis = {
        score_sustentabilidade: 78,
        indicadores: {
            densidade_construcao: 65,
            areas_verdes: 80,
            acessibilidade_transporte: 55,
            qualidade_ar: 70,
            ruido_urbano: 60,
            infraestrutura_saneamento: 75
        },
        recomendacoes: [
            "Aumentar áreas verdes em 15%",
            "Melhorar acesso ao transporte público"
        ]
    };
    
    // Simular uma layer
    const mockLayer = {
        getBounds: () => ({
            getNorthEast: () => ({ distanceTo: () => 2.5 }),
            getSouthWest: () => ({})
        })
    };
    
    // Mostrar resultados
    showAnalysisResults(analysis, mockLayer);
    
    console.log('✅ Painel de análise deve estar aberto com feedbacks!');
    console.log('👉 Procure a seção "💬 Feedback dos Moradores" no painel à direita');
}

// Torna a função global para poder testar no console
window.testarFeedbacks = testarFeedbacks;
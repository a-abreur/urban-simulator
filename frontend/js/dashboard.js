// dashboard.js - Versão atualizada com interface moderna
const API_BASE_URL = "http://localhost:5000/api";

// Configuração do mapa
const map = L.map('map').setView([-15.8267, -47.9218], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let heatLayer = null;
let currentMarkers = [];
let activeLayers = new Set(['clima', 'estacoes']);

// Elementos da UI
const infoPanel = document.getElementById('info-panel');
const closeInfoBtn = document.getElementById('close-info');
const layerButtons = document.querySelectorAll('.layer-btn');
const mapLegend = document.getElementById('map-legend');

// Inicializar controles do mapa
function initializeMapControls() {
    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
        map.zoomIn();
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        map.zoomOut();
    });
    
    document.getElementById('current-location').addEventListener('click', () => {
        map.setView([-15.8267, -47.9218], 12);
    });
    
    // Close info panel
    closeInfoBtn.addEventListener('click', () => {
        infoPanel.classList.remove('active');
    });
    
    // Layer controls
    layerButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const layer = this.dataset.layer;
            this.classList.toggle('active');
            
            if (this.classList.contains('active')) {
                activeLayers.add(layer);
            } else {
                activeLayers.delete(layer);
            }
            
            // Atualizar mapa baseado nas camadas ativas
            updateMapLayers();
        });
    });
}

// Atualizar camadas do mapa
function updateMapLayers() {
    // Limpar camadas existentes
    if (heatLayer) {
        map.removeLayer(heatLayer);
        heatLayer = null;
    }
    
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = [];
    
    // Aplicar camadas ativas
    if (activeLayers.has('clima')) {
        carregarDadosClimáticos();
    }
    
    if (activeLayers.has('estacoes')) {
        carregarEstacoesMonitoramento();
    }
    
    if (activeLayers.has('heatmap')) {
        carregarHeatmapPoluicao();
        mapLegend.style.display = 'block';
    } else {
        mapLegend.style.display = 'none';
    }
}

// Função para carregar dados da cidade
async function carregarDadosCidade(cidade = "Brasília") {
    try {
        console.log(`Carregando dados para: ${cidade}`);
        
        // Atualizar UI
        document.getElementById('current-city').textContent = cidade;
        document.getElementById('update-time').textContent = 'Atualizando...';
        
        // Carregar dados do backend
        const [climaResponse, poluicaoResponse, estacoesResponse, indicadoresResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/clima/${cidade}`),
            fetch(`${API_BASE_URL}/poluicao/${cidade}`),
            fetch(`${API_BASE_URL}/estacoes/${cidade}`),
            fetch(`${API_BASE_URL}/indicadores/${cidade}`)
        ]);
        
        const climaData = await climaResponse.json();
        const poluicaoData = await poluicaoResponse.json();
        const estacoesData = await estacoesResponse.json();
        const indicadoresData = await indicadoresResponse.json();
        
        console.log('Dados recebidos:', { climaData, poluicaoData, estacoesData, indicadoresData });

        // Atualizar indicadores em tempo real
        atualizarIndicadoresUI(climaData, poluicaoData, indicadoresData);
        
        // Atualizar mapa baseado nas camadas ativas
        updateMapLayers();
        
        // Atualizar timestamp
        document.getElementById('update-time').textContent = `Atualizado: ${new Date().toLocaleTimeString()}`;

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        document.getElementById('update-time').textContent = 'Erro na atualização';
        
        // Fallback para dados mockados
        carregarDadosMock();
    }
}

// Atualizar indicadores na UI
function atualizarIndicadoresUI(climaData, poluicaoData, indicadoresData) {
    if (climaData.temperatura) {
        document.getElementById('temp-value').textContent = `${climaData.temperatura}°C`;
        document.getElementById('umidity-value').textContent = `${climaData.umidade}%`;
        document.getElementById('wind-value').textContent = `${climaData.vento} km/h`;
    }
    
    if (poluicaoData.poluentes && poluicaoData.poluentes.length > 0) {
        const pm25 = poluicaoData.poluentes.find(p => p.parametro === 'pm25');
        if (pm25) {
            const qualidade = pm25.valor < 12 ? 'Boa' : pm25.valor < 35 ? 'Moderada' : 'Ruim';
            document.getElementById('air-value').textContent = qualidade;
        }
    }
    
    if (indicadoresData.indicadores) {
        document.getElementById('sustainability-score').textContent = indicadoresData.score_sustentabilidade || '72';
    }
}

// Carregar dados climáticos
async function carregarDadosClimáticos() {
    try {
        const response = await fetch(`${API_BASE_URL}/clima/Brasília`);
        const data = await response.json();
        
        if (data.coordenadas) {
            // Adicionar marcador central com informações climáticas
            const marker = L.marker([data.coordenadas.lat, data.coordenadas.lon]).addTo(map);
            
            const popupContent = `
                <div class="weather-popup">
                    <h4>🌤️ ${data.cidade}</h4>
                    <p><strong>🌡️ Temperatura:</strong> ${data.temperatura}°C</p>
                    <p><strong>💧 Umidade:</strong> ${data.umidade}%</p>
                    <p><strong>💨 Vento:</strong> ${data.vento} m/s</p>
                    <p><strong>📊 Pressão:</strong> ${data.pressao} hPa</p>
                    <p><em>${data.descricao}</em></p>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            currentMarkers.push(marker);
        }
    } catch (error) {
        console.error('Erro ao carregar dados climáticos:', error);
    }
}

// Carregar estações de monitoramento
async function carregarEstacoesMonitoramento() {
    try {
        const response = await fetch(`${API_BASE_URL}/estacoes/Brasília`);
        const data = await response.json();
        
        if (data.estacoes && data.estacoes.length > 0) {
            data.estacoes.forEach(estacao => {
                const marker = L.marker([
                    estacao.coordenadas.latitude, 
                    estacao.coordenadas.longitude
                ], {
                    icon: L.divIcon({
                        className: 'station-marker',
                        html: '<i class="fas fa-building"></i>',
                        iconSize: [30, 30]
                    })
                }).addTo(map);
                
                const popupContent = `
                    <div class="station-popup">
                        <h4>📍 ${estacao.nome}</h4>
                        <p><strong>📊 Parâmetros:</strong> ${estacao.parametros.map(p => p.name).join(', ')}</p>
                        <p><strong>🔢 Medições:</strong> ${estacao.contagem_medicoes}</p>
                        <p><strong>🏙️ Cidade:</strong> ${estacao.cidade}, ${estacao.pais}</p>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                
                // Adicionar evento de clique para mostrar detalhes no painel
                marker.on('click', function() {
                    showStationInfo(estacao);
                });
                
                currentMarkers.push(marker);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar estações:', error);
    }
}

// Carregar heatmap de poluição
async function carregarHeatmapPoluicao() {
    try {
        const response = await fetch(`${API_BASE_URL}/poluicao/Brasília`);
        const data = await response.json();
        
        if (data.poluentes && data.poluentes.length > 0) {
            const pontos = data.poluentes.map(item => [
                item.coordenadas.latitude,
                item.coordenadas.longitude,
                item.valor * 10 // Ajuste de intensidade para visualização
            ]);

            heatLayer = L.heatLayer(pontos, {
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
    } catch (error) {
        console.error('Erro ao carregar heatmap:', error);
    }
}

// Mostrar informações da estação no painel
function showStationInfo(estacao) {
    const infoContent = document.querySelector('.info-content');
    
    infoContent.innerHTML = `
        <div class="station-details">
            <h4>${estacao.nome}</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">📍 Localização</span>
                    <span class="detail-value">${estacao.cidade}, ${estacao.pais}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">📊 Parâmetros Monitorados</span>
                    <span class="detail-value">${estacao.parametros.map(p => p.name).join(', ')}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">🔢 Total de Medições</span>
                    <span class="detail-value">${estacao.contagem_medicoes}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">🌐 Coordenadas</span>
                    <span class="detail-value">${estacao.coordenadas.latitude.toFixed(4)}, ${estacao.coordenadas.longitude.toFixed(4)}</span>
                </div>
            </div>
        </div>
    `;
    
    infoPanel.classList.add('active');
}

// Fallback para dados mockados
function carregarDadosMock() {
    const estacoesMock = [
        { 
            nome: "Brasília Central", 
            coordenadas: { latitude: -15.8267, longitude: -47.9218 },
            parametros: [{name: "pm25"}, {name: "pm10"}, {name: "o3"}],
            cidade: "Brasília",
            pais: "BR",
            contagem_medicoes: 1500
        },
        { 
            nome: "Brasília Norte", 
            coordenadas: { latitude: -15.7801, longitude: -47.9292 },
            parametros: [{name: "pm25"}, {name: "so2"}],
            cidade: "Brasília", 
            pais: "BR",
            contagem_medicoes: 890
        }
    ];
    
    estacoesMock.forEach(estacao => {
        const marker = L.marker([estacao.coordenadas.latitude, estacao.coordenadas.longitude]).addTo(map);
        const popupContent = `
            <div style="min-width: 200px">
                <b>📍 ${estacao.nome}</b><br>
                📊 Parâmetros: ${estacao.parametros.map(p => p.name).join(', ')}<br>
                🔢 Medições: ${estacao.contagem_medicoes}
            </div>
        `;
        marker.bindPopup(popupContent);
        currentMarkers.push(marker);
    });
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando dashboard urbano...");
    
    // Inicializar controles
    initializeMapControls();
    
    // Carregar dados iniciais
    carregarDadosCidade("Brasília");
    
    // Configurar atualização automática a cada 5 minutos
    setInterval(() => {
        carregarDadosCidade("Brasília");
    }, 300000);
});


// dashboard.js - Novas funcionalidades

// Variáveis globais
let currentBaseMap = 'padrao';
let baseMapLayer = null;
let analysisMode = false;
let drawnItems = new L.FeatureGroup();

// Inicializar funcionalidades avançadas
function initializeAdvancedFeatures() {
    // Controle de mapas base
    document.getElementById('base-map-select').addEventListener('change', function(e) {
        changeBaseMap(e.target.value);
    });
    
    // Ferramentas de análise
    document.getElementById('area-analysis-btn').addEventListener('click', toggleAreaAnalysis);
    document.getElementById('report-btn').addEventListener('click', generateReport);
    document.getElementById('compare-btn').addEventListener('click', startComparison);
    
    // Adicionar grupo de desenho ao mapa
    map.addLayer(drawnItems);
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
        }
    };
    
    const config = mapConfigs[mapType] || mapConfigs.padrao;
    baseMapLayer = L.tileLayer(config.url, {
        attribution: config.attribution
    }).addTo(map);
    
    currentBaseMap = mapType;
}

// Modo de análise de área
function toggleAreaAnalysis() {
    analysisMode = !analysisMode;
    
    if (analysisMode) {
        // Ativar ferramenta de desenho
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
        
        // Evento quando uma área é desenhada
        map.on(L.Draw.Event.CREATED, function (e) {
            const layer = e.layer;
            drawnItems.addLayer(layer);
            analyzeArea(layer);
        });
        
        alert('Modo de análise ativado. Desenhe uma área no mapa para analisar.');
    } else {
        // Desativar ferramenta de desenho
        map.eachLayer((layer) => {
            if (layer instanceof L.Control.Draw) {
                map.removeControl(layer);
            }
        });
        
        drawnItems.clearLayers();
    }
}

// Analisar área desenhada
async function analyzeArea(layer) {
    const bounds = layer.getBounds();
    const center = bounds.getCenter();
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/analise-area`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                coordenadas: [center.lat, center.lng],
                raio: 1000 // metros
            })
        });
        
        const analysis = await response.json();
        showAnalysisResults(analysis, layer);
    } catch (error) {
        console.error('Erro na análise:', error);
        alert('Erro ao analisar a área selecionada.');
    }
}

// Mostrar resultados da análise
function showAnalysisResults(analysis, layer) {
    const popupContent = `
        <div class="analysis-popup">
            <h4>📊 Análise da Área</h4>
            <div class="analysis-score">
                <strong>Score de Sustentabilidade:</strong> ${analysis.score_sustentabilidade}/100
            </div>
            <div class="analysis-indicators">
                ${Object.entries(analysis.indicadores).map(([key, value]) => `
                    <div class="indicator">
                        <span>${formatIndicatorName(key)}:</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${value}%"></div>
                        </div>
                        <span>${value}%</span>
                    </div>
                `).join('')}
            </div>
            <div class="analysis-recommendations">
                <strong>Recomendações:</strong>
                <ul>
                    ${analysis.recomendacoes.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    
    layer.bindPopup(popupContent).openPopup();
}

// Carregar dados de tráfego
async function carregarDadosTransito() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/transito/Brasília`);
        const data = await response.json();
        
        if (data.principais_vias) {
            // Simular vias no mapa
            data.principais_vias.forEach((via, index) => {
                // Coordenadas simuladas para Brasília
                const coordinates = [
                    [-15.780 + (index * 0.01), -47.930 + (index * 0.01)],
                    [-15.790 + (index * 0.01), -47.920 + (index * 0.01)],
                    [-15.800 + (index * 0.01), -47.910 + (index * 0.01)]
                ];
                
                const color = via.congestionamento > 70 ? 'red' : 
                             via.congestionamento > 50 ? 'orange' : 'green';
                
                const polyline = L.polyline(coordinates, {
                    color: color,
                    weight: 6,
                    opacity: 0.7
                }).addTo(map);
                
                polyline.bindPopup(`
                    <div class="traffic-popup">
                        <h4>🛣️ ${via.via}</h4>
                        <p><strong>Congestionamento:</strong> ${via.congestionamento}%</p>
                        <p><strong>Velocidade média:</strong> ${via.velocidade_media} km/h</p>
                    </div>
                `);
                
                currentMarkers.push(polyline);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar tráfego:', error);
    }
}

// Carregar ilhas de calor
async function carregarIlhasCalor() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/temperatura/Brasília`);
        const data = await response.json();
        
        if (data.ilhas_calor) {
            data.ilhas_calor.forEach(area => {
                // Criar círculos representando ilhas de calor
                const radius = area.temp_diff * 500; // Raio proporcional à diferença de temperatura
                const color = area.temp_diff > 2.5 ? 'red' : 
                             area.temp_diff > 1.5 ? 'orange' : 'yellow';
                
                const circle = L.circle([-15.78 + Math.random() * 0.1, -47.90 + Math.random() * 0.1], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.3,
                    radius: radius
                }).addTo(map);
                
                circle.bindPopup(`
                    <div class="heat-popup">
                        <h4>🔥 ${area.area}</h4>
                        <p><strong>Diferença térmica:</strong> +${area.temp_diff}°C</p>
                        <p><strong>Cobertura:</strong> ${area.cobertura}</p>
                        <p><strong>Vegetação:</strong> ${area.vegetacao}%</p>
                    </div>
                `);
                
                currentMarkers.push(circle);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar ilhas de calor:', error);
    }
}

// Gerar relatório PDF
async function generateReport() {
    try {
        // Coletar todos os dados atuais
        const [clima, transito, temperatura, recursos, saneamento, feedback] = await Promise.all([
            fetch(`${API_BASE_URL}/api/clima/Brasília`).then(r => r.json()),
            fetch(`${API_BASE_URL}/api/transito/Brasília`).then(r => r.json()),
            fetch(`${API_BASE_URL}/api/temperatura/Brasília`).then(r => r.json()),
            fetch(`${API_BASE_URL}/api/recursos-naturais/Brasília`).then(r => r.json()),
            fetch(`${API_BASE_URL}/api/saneamento-energia/Brasília`).then(r => r.json()),
            fetch(`${API_BASE_URL}/api/feedback-populacao/Brasília`).then(r => r.json())
        ]);
        
        // Criar relatório simplificado (em uma aplicação real, usar biblioteca PDF)
        const reportContent = `
            RELATÓRIO URBANO - BRASÍLIA
            Data: ${new Date().toLocaleDateString()}
            
            DADOS CLIMÁTICOS:
            - Temperatura: ${clima.temperatura}°C
            - Umidade: ${clima.umidade}%
            - Vento: ${clima.vento} m/s
            
            TRÁFEGO:
            - Nível de congestionamento: ${transito.nivel_congestionamento}%
            
            SUSTENTABILIDADE:
            - Score: ${saneamento.indicadores?.score_sustentabilidade || 'N/A'}
            
            FEEDBACK POPULACIONAL:
            - Satisfação geral: ${feedback.pesquisa?.satisfacao_geral}%
        `;
        
        // Simular download (em produção, usar biblioteca como jsPDF)
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_brasilia_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        
        alert('Relatório gerado com sucesso!');
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        alert('Erro ao gerar relatório.');
    }
}

// Funções auxiliares
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

// Atualizar a função updateMapLayers para incluir as novas camadas
function updateMapLayers() {
    // Limpar camadas existentes
    if (heatLayer) {
        map.removeLayer(heatLayer);
        heatLayer = null;
    }
    
    currentMarkers.forEach(marker => {
        if (marker instanceof L.Polyline || marker instanceof L.Circle) {
            map.removeLayer(marker);
        }
    });
    currentMarkers = currentMarkers.filter(m => m instanceof L.Marker);
    
    // Aplicar camadas ativas
    if (activeLayers.has('clima')) {
        carregarDadosClimáticos();
    }
    
    if (activeLayers.has('estacoes')) {
        carregarEstacoesMonitoramento();
    }
    
    if (activeLayers.has('heatmap')) {
        carregarHeatmapPoluicao();
        mapLegend.style.display = 'block';
    } else {
        mapLegend.style.display = 'none';
    }
    
    if (activeLayers.has('transito')) {
        carregarDadosTransito();
    }
    
    if (activeLayers.has('temperatura')) {
        carregarIlhasCalor();
    }
    
    // Adicionar outras camadas conforme necessário
}

// Inicializar no DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMapControls();
    initializeAdvancedFeatures(); // Nova inicialização
    carregarDadosCidade("Brasília");
});
# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)  # Agora correto!

# Configurações - USE SUAS PRÓPRIAS CHAVES (grátis)
OPENWEATHER_API_KEY = "sua_chave_gratuita_aqui"  # Obtenha em: https://openweathermap.org/api
OPENAQ_BASE_URL = "https://api.openaq.org/v2"

# Dados mockados para Brasília (caso as APIs falhem)
DADOS_MOCK_BRASILIA = {
    "clima": {
        "cidade": "Brasília",
        "temperatura": 25.5,
        "umidade": 65,
        "pressao": 1013,
        "vento": 3.2,
        "descricao": "céu limpo",
        "coordenadas": {"lat": -15.8267, "lon": -47.9218}
    },
    "poluentes": [
        {
            "parametro": "pm25",
            "valor": 12.5,
            "unidade": "µg/m³",
            "localizacao": "Brasília Central",
            "coordenadas": {"latitude": -15.8267, "longitude": -47.9218},
            "ultima_atualizacao": "2024-01-15T10:00:00Z"
        },
        {
            "parametro": "pm10",
            "valor": 18.2,
            "unidade": "µg/m³",
            "localizacao": "Brasília Norte",
            "coordenadas": {"latitude": -15.7801, "longitude": -47.9292},
            "ultima_atualizacao": "2024-01-15T10:00:00Z"
        }
    ],
    "estacoes": [
        {
            "nome": "Brasília Central",
            "cidade": "Brasília",
            "pais": "BR",
            "coordenadas": {"latitude": -15.8267, "longitude": -47.9218},
            "parametros": [{"name": "pm25"}, {"name": "pm10"}, {"name": "o3"}],
            "contagem_medicoes": 1500
        },
        {
            "nome": "Brasília Norte", 
            "cidade": "Brasília",
            "pais": "BR",
            "coordenadas": {"latitude": -15.7801, "longitude": -47.9292},
            "parametros": [{"name": "pm25"}, {"name": "so2"}],
            "contagem_medicoes": 890
        }
    ]
}

@app.route('/')
def home():
    return jsonify({"message": "API do Simulador Urbano - NASA Space Apps", "status": "online"})

@app.route('/api/clima/<cidade>')
def get_clima(cidade):
    """Busca dados climáticos em tempo real"""
    try:
        # Para MVP, usamos dados mockados de Brasília
        if cidade.lower() in ["brasília", "brasilia"]:
            return jsonify(DADOS_MOCK_BRASILIA["clima"])
        
        # Se tiver chave da API, descomente abaixo:
        """
        geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={cidade}&limit=1&appid={OPENWEATHER_API_KEY}"
        geo_response = requests.get(geo_url)
        geo_data = geo_response.json()
        
        if not geo_data:
            return jsonify({"error": "Cidade não encontrada"}), 404
            
        lat = geo_data[0]['lat']
        lon = geo_data[0]['lon']
        
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric&lang=pt_br"
        weather_response = requests.get(weather_url)
        weather_data = weather_response.json()
        
        return jsonify({
            "cidade": cidade,
            "temperatura": weather_data['main']['temp'],
            "umidade": weather_data['main']['humidity'],
            "pressao": weather_data['main']['pressure'],
            "vento": weather_data['wind']['speed'],
            "descricao": weather_data['weather'][0]['description'],
            "coordenadas": {"lat": lat, "lon": lon}
        })
        """
        
        return jsonify({"error": "Cidade não disponível no MVP. Use 'Brasília'"}), 404
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/poluicao/<cidade>')
def get_poluicao(cidade):
    """Busca dados de qualidade do ar"""
    try:
        # Para MVP, usamos dados mockados
        if cidade.lower() in ["brasília", "brasilia"]:
            return jsonify({
                "cidade": cidade,
                "poluentes": DADOS_MOCK_BRASILIA["poluentes"],
                "total_registros": len(DADOS_MOCK_BRASILIA["poluentes"])
            })
        
        # Código original com OpenAQ (pode ser restaurado depois)
        """
        url = f"{OPENAQ_BASE_URL}/latest?city={cidade}&limit=10"
        response = requests.get(url)
        data = response.json()
        
        poluentes = []
        for result in data.get('results', []):
            for measurement in result.get('measurements', []):
                poluentes.append({
                    "parametro": measurement['parameter'],
                    "valor": measurement['value'],
                    "unidade": measurement['unit'],
                    "localizacao": result['location'],
                    "coordenadas": result['coordinates'],
                    "ultima_atualizacao": measurement['lastUpdated']
                })
        """
        
        return jsonify({"error": "Cidade não disponível no MVP. Use 'Brasília'"}), 404
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/estacoes/<cidade>')
def get_estacoes(cidade):
    """Busca estações de monitoramento disponíveis"""
    try:
        if cidade.lower() in ["brasília", "brasilia"]:
            return jsonify({
                "cidade": cidade,
                "estacoes": DADOS_MOCK_BRASILIA["estacoes"],
                "total_estacoes": len(DADOS_MOCK_BRASILIA["estacoes"])
            })
        
        # Código original com OpenAQ
        """
        url = f"{OPENAQ_BASE_URL}/locations?city={cidade}&limit=50"
        response = requests.get(url)
        data = response.json()
        
        estacoes = []
        for result in data.get('results', []):
            estacoes.append({
                "nome": result['location'],
                "cidade": result['city'],
                "pais": result['country'],
                "coordenadas": result['coordinates'],
                "parametros": result['parameters'],
                "contagem_medicoes": result['count']
            })
        """
        
        return jsonify({"error": "Cidade não disponível no MVP. Use 'Brasília'"}), 404
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/indicadores/<cidade>')
def get_indicadores_urbanos(cidade):
    """Indicadores urbanos consolidados"""
    if cidade.lower() in ["brasília", "brasilia"]:
        return jsonify({
            "cidade": "Brasília",
            "indicadores": {
                "qualidade_ar": "Moderada",
                "indice_poluicao": 68,
                "densidade_populacional": 480.8,  # hab/km²
                "area_verde_per_capita": 94.4,    # m²/hab
                "transporte_publico": 75,
                "infraestrutura_cicloviaria": 42
            },
            "recomendacoes": [
                "Aumentar áreas verdes na região central",
                "Expandir rede de ciclovias",
                "Melhorar qualidade do transporte público"
            ]
        })
    
    return jsonify({"error": "Cidade não disponível"}), 404



# Novas rotas para o backend
@app.route('/api/mapas/<tipo>')
def get_mapas(tipo):
    """Retorna diferentes tipos de mapas base"""
    mapas = {
        "satelite": {
            "url": "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
            "attribution": "OpenTopoMap"
        },
        "transito": {
            "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "attribution": "OpenStreetMap"
        },
        "terreno": {
            "url": "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
            "attribution": "OpenTopoMap"
        },
        "padrao": {
            "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "attribution": "OpenStreetMap"
        }
    }
    return jsonify(mapas.get(tipo, mapas["padrao"]))

@app.route('/api/transito/<cidade>')
def get_transito(cidade):
    """Dados de tráfego em tempo real (usando OpenStreetMap/Overpass API)"""
    try:
        # Para Brasília - dados simulados
        if cidade.lower() in ["brasília", "brasilia"]:
            return jsonify({
                "cidade": cidade,
                "nivel_congestionamento": 65,  # 0-100%
                "principais_vias": [
                    {"via": "Eixo Monumental", "congestionamento": 75, "velocidade_media": 25},
                    {"via": "W3 Sul", "congestionamento": 80, "velocidade_media": 20},
                    {"via": "L2 Norte", "congestionamento": 60, "velocidade_media": 30},
                    {"via": "EPTG", "congestionamento": 45, "velocidade_media": 40}
                ],
                "horario_pico": True,
                "timestamp": datetime.now().isoformat()
            })
        return jsonify({"error": "Cidade não disponível"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/temperatura/<cidade>')
def get_ilha_calor(cidade):
    """Análise de ilhas de calor urbanas"""
    try:
        if cidade.lower() in ["brasília", "brasilia"]:
            return jsonify({
                "cidade": cidade,
                "ilhas_calor": [
                    {"area": "Centro", "temp_diff": 3.2, "cobertura": "asfalto", "vegetacao": 15},
                    {"area": "Asa Norte", "temp_diff": 1.5, "cobertura": "mista", "vegetacao": 40},
                    {"area": "Asa Sul", "temp_diff": 1.8, "cobertura": "mista", "vegetacao": 35},
                    {"area": "Lago Sul", "temp_diff": 0.5, "cobertura": "vegetacao", "vegetacao": 75},
                    {"area": "Taguatinga", "temp_diff": 2.8, "cobertura": "asfalto", "vegetacao": 20}
                ],
                "temp_media": 25.5,
                "recomendacoes": [
                    "Aumentar áreas verdes no centro",
                    "Implementar telhados verdes",
                    "Melhorar permeabilidade do solo"
                ]
            })
        return jsonify({"error": "Cidade não disponível"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recursos-naturais/<cidade>')
def get_recursos_naturais(cidade):
    """Recursos naturais e áreas verdes"""
    try:
        if cidade.lower() in ["brasília", "brasilia"]:
            return jsonify({
                "cidade": cidade,
                "areas_verdes": [
                    {"nome": "Parque da Cidade", "area_ha": 420, "tipo": "parque_urbano"},
                    {"nome": "Jardim Botânico", "area_ha": 526, "tipo": "conservacao"},
                    {"nome": "Parque Nacional", "area_ha": 30000, "tipo": "protegida"},
                    {"nome": "Lago Paranoá", "area_ha": 4000, "tipo": "recurso_hidrico"}
                ],
                "cobertura_vegetal": 45,  # porcentagem
                "qualidade_ar": "moderada",
                "recursos_hidricos": [
                    {"nome": "Lago Paranoá", "capacidade": "4000 ha", "uso": "recreacao/energia"},
                    {"nome": "Bacia do São Bartolomeu", "capacidade": "N/A", "uso": "conservacao"}
                ]
            })
        return jsonify({"error": "Cidade não disponível"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/saneamento-energia/<cidade>')
def get_saneamento_energia(cidade):
    """Indicadores de saneamento e energia"""
    try:
        if cidade.lower() in ["brasília", "brasilia"]:
            return jsonify({
                "cidade": cidade,
                "saneamento": {
                    "cobertura_agua": 98,
                    "cobertura_esgoto": 85,
                    "tratamento_esgoto": 78,
                    "coleta_seletiva": 45
                },
                "energia": {
                    "consumo_per_capita": 1800,  # kWh/ano
                    "fontes_renovaveis": 35,
                    "eficiencia_energetica": 65,
                    "distribuicao": [
                        {"tipo": "residencial", "percentual": 42},
                        {"tipo": "comercial", "percentual": 28},
                        {"tipo": "industrial", "percentual": 18},
                        {"tipo": "publico", "percentual": 12}
                    ]
                },
                "recomendacoes": [
                    "Ampliar tratamento de esgoto",
                    "Aumentar energia renovável",
                    "Melhorar eficiência energética"
                ]
            })
        return jsonify({"error": "Cidade não disponível"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analise-area', methods=['POST'])
def analise_area():
    """Gera relatório de análise para uma área específica"""
    try:
        data = request.json
        coordenadas = data.get('coordenadas')
        raio = data.get('raio', 1000)  # metros
        
        # Simulação de análise
        analise = {
            "area_analisada": f"Raio de {raio}m",
            "coordenadas_centro": coordenadas,
            "indicadores": {
                "densidade_construcao": 65,
                "areas_verdes": 25,
                "acessibilidade_transporte": 70,
                "qualidade_ar": 60,
                "ruido_urbano": 55,
                "infraestrutura_saneamento": 80
            },
            "pontos_fortes": [
                "Boa infraestrutura de saneamento",
                "Acessibilidade moderada a transporte"
            ],
            "pontos_fracos": [
                "Baixa cobertura vegetal",
                "Densidade construtiva elevada"
            ],
            "recomendacoes": [
                "Implementar mais áreas verdes",
                "Melhorar ventilação natural",
                "Otimizar fluxo de tráfego"
            ],
            "score_sustentabilidade": 68,
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(analise)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/feedback-populacao/<cidade>')
def get_feedback_populacao(cidade):
    """Feedback e percepção da população (dados simulados)"""
    try:
        if cidade.lower() in ["brasília", "brasilia"]:
            return jsonify({
                "cidade": cidade,
                "pesquisa": {
                    "satisfacao_geral": 72,
                    "qualidade_vida": 68,
                    "transporte_publico": 55,
                    "areas_verdes": 80,
                    "seguranca": 65,
                    "saneamento": 75
                },
                "reclamacoes_frequentes": [
                    {"categoria": "transporte", "percentual": 35},
                    {"categoria": "seguranca", "percentual": 25},
                    {"categoria": "infraestrutura", "percentual": 20},
                    {"categoria": "meio_ambiente", "percentual": 15},
                    {"categoria": "outros", "percentual": 5}
                ],
                "sugestoes": [
                    "Melhorar frequência do transporte público",
                    "Aumentar vigilância em áreas públicas",
                    "Expandir ciclovias",
                    "Manutenção de parques"
                ]
            })
        return jsonify({"error": "Cidade não disponível"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Servidor iniciando na porta 5000...")
    print("📊 Acesse: http://localhost:5000")
    print("🌍 API disponível para Brasília")
    app.run(debug=True, port=5000)
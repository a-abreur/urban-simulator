// script.js - Página Inicial do Simulador Urbano com Dark Mode

// Dados de cidades para sugestões
const cities = [
    "Brasília", "São Paulo", "Rio de Janeiro", "Belo Horizonte",
    "Salvador", "Fortaleza", "Recife", "Porto Alegre",
    "Curitiba", "Manaus", "Goiânia", "Belém",
    "Campinas", "São Luís", "Natal", "João Pessoa"
];

// Elementos DOM
const cityInput = document.getElementById('cityInput');
const suggestionsList = document.getElementById('suggestions');
const searchBtn = document.getElementById('searchBtn');
const cityTags = document.querySelectorAll('.city-tag');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página inicial do Simulador Urbano carregada');
    
    // Inicializar modo escuro
    initializeDarkModeToggle();
    
    // Configurar eventos
    setupEventListeners();
});

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

// Configurar event listeners
function setupEventListeners() {
    // Input de cidade com sugestões
    cityInput.addEventListener('input', handleCityInput);
    cityInput.addEventListener('focus', showSuggestions);
    
    // Clicar fora para fechar sugestões
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-input-container')) {
            hideSuggestions();
        }
    });
    
    // Botão de busca
    searchBtn.addEventListener('click', handleSearch);
    
    // Tags de cidades populares
    cityTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const city = this.getAttribute('data-city');
            cityInput.value = city;
            handleSearch();
        });
    });
    
    // Enter no input
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// Manipular input da cidade
function handleCityInput() {
    const query = cityInput.value.toLowerCase();
    
    if (query.length === 0) {
        hideSuggestions();
        return;
    }
    
    const filteredCities = cities.filter(city => 
        city.toLowerCase().includes(query)
    );
    
    showFilteredSuggestions(filteredCities);
}

// Mostrar sugestões filtradas
function showFilteredSuggestions(filteredCities) {
    suggestionsList.innerHTML = '';
    
    if (filteredCities.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Nenhuma cidade encontrada';
        li.style.color = 'var(--text-secondary)';
        li.style.cursor = 'default';
        suggestionsList.appendChild(li);
    } else {
        filteredCities.forEach(city => {
            const li = document.createElement('li');
            li.textContent = city;
            li.addEventListener('click', function() {
                cityInput.value = city;
                hideSuggestions();
            });
            suggestionsList.appendChild(li);
        });
    }
    
    showSuggestions();
}

// Mostrar lista de sugestões
function showSuggestions() {
    if (suggestionsList.children.length > 0) {
        suggestionsList.classList.add('active');
    }
}

// Ocultar lista de sugestões
function hideSuggestions() {
    suggestionsList.classList.remove('active');
}

// Manipular busca
function handleSearch() {
    const city = cityInput.value.trim();
    
    if (city === '') {
        showNotification('Por favor, digite o nome de uma cidade', 'warning');
        cityInput.focus();
        return;
    }
    
    // Validar se a cidade existe na lista
    if (!cities.includes(city)) {
        showNotification(`Cidade "${city}" não encontrada em nossa base`, 'warning');
        return;
    }
    
    // Redirecionar para o dashboard com a cidade selecionada
    redirectToDashboard(city);
}

// Redirecionar para o dashboard
function redirectToDashboard(city) {
    // Salvar a cidade no localStorage para o dashboard usar
    localStorage.setItem('selectedCity', city);
    
    // Mostrar loading
    showNotification(`Carregando dados de ${city}...`, 'info');
    
    // Simular carregamento e redirecionar
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    // Remover notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Obter ícone da notificação
function getNotificationIcon(type) {
    const icons = {
        'info': 'info-circle',
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle'
    };
    return icons[type] || 'info-circle';
}

// Obter cor da notificação
function getNotificationColor(type) {
    const colors = {
        'info': '#4299e1',
        'success': '#48bb78',
        'warning': '#ed8936',
        'error': '#f56565'
    };
    return colors[type] || '#4299e1';
}
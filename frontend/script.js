// Lista de cidades para sugestão
const cities = [
    "Brasília", "São Paulo", "Rio de Janeiro", "Belo Horizonte", 
    "Salvador", "Curitiba", "Porto Alegre", "Recife", 
    "Fortaleza", "Manaus", "Belém", "Goiânia", "Campinas",
    "São Luís", "Maceió", "João Pessoa", "Natal", "Teresina",
    "Cuiabá", "Florianópolis", "Vitória", "Porto Velho"
];

// Elementos DOM
const input = document.getElementById("cityInput");
const suggestions = document.getElementById("suggestions");
const searchBtn = document.getElementById("searchBtn");
const cityTags = document.querySelectorAll(".city-tag");

// Mostrar sugestões enquanto digita
input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    suggestions.innerHTML = "";

    if (query) {
        const filtered = cities.filter(city =>
            city.toLowerCase().includes(query)
        );

        if (filtered.length > 0) {
            suggestions.style.display = "block";
            filtered.forEach(city => {
                const li = document.createElement("li");
                li.textContent = city;
                li.addEventListener("click", () => {
                    input.value = city;
                    suggestions.style.display = "none";
                });
                suggestions.appendChild(li);
            });
        } else {
            suggestions.style.display = "none";
        }
    } else {
        suggestions.style.display = "none";
    }
});

// Fechar sugestões ao clicar fora
document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.style.display = "none";
    }
});

// Redirecionar para o dashboard
function goToDashboard(city) {
    // Para o MVP, sempre redireciona para Brasília
    window.location.href = "dashboard.html?city=Brasilia";
}

searchBtn.addEventListener("click", () => {
    const city = input.value.trim() || "Brasília";
    goToDashboard(city);
});

// Enter para buscar
input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const city = input.value.trim() || "Brasília";
        goToDashboard(city);
    }
});

// Tags de cidades populares
cityTags.forEach(tag => {
    tag.addEventListener("click", () => {
        const city = tag.getAttribute("data-city");
        input.value = city;
        goToDashboard(city);
    });
});

// Efeito de digitação no hero
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Inicializar efeitos quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const heroTitle = document.querySelector('.hero-title');
    const originalText = heroTitle.textContent;
    
    // Apenas ativar o efeito de digitação se a página acabou de carregar
    if (!sessionStorage.getItem('pageLoaded')) {
        typeWriter(heroTitle, originalText);
        sessionStorage.setItem('pageLoaded', 'true');
    }
    
    // Adicionar animação aos cards de features
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 300 + (index * 100));
    });
});
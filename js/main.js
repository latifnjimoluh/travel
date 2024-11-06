class TravelApp {
    constructor() {
        this.destinations = [];
        this.bookings = [];
        this.init();
    }

    async init() {
        await this.loadDestinations();
        this.setupEventListeners();
        this.displayFeaturedDestinations();
        this.initializeAnimations();
    }

    async loadDestinations() {
        // Simulation de données avec plus de détails
        this.destinations = [
            {
                id: 1,
                name: "Paris",
                country: "France",
                price: 599,
                image: "paris.jpg",
                description: "La ville de l'amour",
                rating: 4.8,
                reviews: 1250,
                highlights: ["Tour Eiffel", "Louvre", "Notre-Dame"]
            },
            {
                id: 2,
                name: "Tokyo",
                country: "Japon",
                price: 899,
                image: "tokyo.jpg",
                description: "La ville du futur",
                rating: 4.9,
                reviews: 980,
                highlights: ["Shibuya", "Mont Fuji", "Temples"]
            },
            // Ajoutez d'autres destinations...
        ];
    }

    setupEventListeners() {
        // Recherche dynamique
        const searchInput = document.getElementById('destination');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearchInput(e.target.value));
        }

        // Animation des dates
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            input.addEventListener('change', () => this.updateDateSelection(input));
        });

        // Nombre de voyageurs
        const travelersSelect = document.getElementById('travelers');
        if (travelersSelect) {
            travelersSelect.addEventListener('change', () => this.updatePrice());
        }
    }

    handleSearchInput(value) {
        const suggestions = this.destinations.filter(dest => 
            dest.name.toLowerCase().includes(value.toLowerCase()) ||
            dest.country.toLowerCase().includes(value.toLowerCase())
        );

        this.displaySearchSuggestions(suggestions);
    }

    displaySearchSuggestions(suggestions) {
        const container = document.createElement('div');
        container.className = 'search-suggestions';
        
        suggestions.forEach(dest => {
            const suggestion = document.createElement('div');
            suggestion.className = 'suggestion-item';
            suggestion.innerHTML = `
                <img src="images/destinations/${dest.image}" alt="${dest.name}">
                <div class="suggestion-info">
                    <h4>${dest.name}, ${dest.country}</h4>
                    <p>À partir de ${dest.price}€</p>
                </div>
            `;
            suggestion.addEventListener('click', () => this.selectDestination(dest));
            container.appendChild(suggestion);
        });

        // Remplacer les anciennes suggestions
        const existingSuggestions = document.querySelector('.search-suggestions');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }
        document.querySelector('.search-container').appendChild(container);
    }

    selectDestination(destination) {
        document.getElementById('destination').value = `${destination.name}, ${destination.country}`;
        document.querySelector('.search-suggestions')?.remove();
        this.updatePrice(destination);
    }

    updateDateSelection(input) {
        input.classList.add('date-selected');
        this.validateDates();
    }

    updatePrice(destination = null) {
        const travelers = parseInt(document.getElementById('travelers').value);
        const basePrice = destination ? destination.price : 599;
        const totalPrice = basePrice * travelers;

        const priceDisplay = document.createElement('div');
        priceDisplay.className = 'price-display';
        priceDisplay.innerHTML = `
            <p>Prix total estimé: <strong>${totalPrice}€</strong></p>
            <small>Pour ${travelers} voyageur${travelers > 1 ? 's' : ''}</small>
        `;

        // Mettre à jour l'affichage du prix
        const existingPrice = document.querySelector('.price-display');
        if (existingPrice) {
            existingPrice.replaceWith(priceDisplay);
        } else {
            document.querySelector('.search-container').appendChild(priceDisplay);
        }
    }

    displayFeaturedDestinations() {
        const container = document.getElementById('featured-destinations');
        if (!container) return;

        container.innerHTML = ''; // Clear existing content
        this.destinations.forEach(dest => {
            const card = this.createDestinationCard(dest);
            container.appendChild(card);
        });
    }

    createDestinationCard(destination) {
        const card = document.createElement('div');
        card.className = 'destination-card';
        card.innerHTML = `
            <div class="card-image">
                <img src="images/destinations/${destination.image}" alt="${destination.name}">
                <div class="card-rating">
                    <span>★ ${destination.rating}</span>
                    <small>(${destination.reviews})</small>
                </div>
            </div>
            <div class="card-content">
                <h3>${destination.name}</h3>
                <p class="country">${destination.country}</p>
                <p class="description">${destination.description}</p>
                <div class="highlights">
                    ${destination.highlights.map(h => `<span>${h}</span>`).join('')}
                </div>
                <div class="card-footer">
                    <p class="price">À partir de <strong>${destination.price}€</strong></p>
                    <button onclick="app.bookNow(${destination.id})">Réserver</button>
                </div>
            </div>
        `;
        return card;
    }

    initializeAnimations() {
        // Animation des cartes au scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('card-visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.destination-card').forEach(card => {
            observer.observe(card);
        });
    }

    validateDates() {
        const departure = document.getElementById('departure').value;
        const returnDate = document.getElementById('return').value;
        
        if (departure && returnDate) {
            const isValid = this.areDatesValid(departure, returnDate);
            const button = document.querySelector('.search-container button');
            
            button.disabled = !isValid;
            button.classList.toggle('invalid-dates', !isValid);
            
            if (!isValid) {
                this.showDateError();
            } else {
                this.hideDateError();
            }
        }
    }

    areDatesValid(departure, returnDate) {
        const dep = new Date(departure);
        const ret = new Date(returnDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return dep >= today && ret > dep;
    }

    showDateError() {
        let errorMsg = document.querySelector('.date-error');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'date-error';
            errorMsg.textContent = 'Veuillez sélectionner des dates valides';
            document.querySelector('.search-container').appendChild(errorMsg);
        }
    }

    hideDateError() {
        document.querySelector('.date-error')?.remove();
    }

    bookNow(destinationId) {
        const destination = this.destinations.find(d => d.id === destinationId);
        if (!destination) return;

        // Animation de transition
        const card = event.target.closest('.destination-card');
        card.classList.add('booking-selected');
        
        setTimeout(() => {
            window.location.href = `pages/booking.html?id=${destinationId}`;
        }, 500);
    }
}

// Initialisation avec effet de chargement
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loading');
    const app = new TravelApp();
    window.app = app; // Pour l'accès global
    
    setTimeout(() => {
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
    }, 500);
});
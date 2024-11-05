class BookingManager {
    constructor() {
        this.form = document.getElementById('booking-form');
        this.tripData = null;
        this.init();
    }

    init() {
        this.loadTripData();
        this.setupEventListeners();
        this.displayTripSummary();
    }

    loadTripData() {
        const urlParams = new URLSearchParams(window.location.search);
        const tripId = urlParams.get('id');
        
        // Simuler le chargement des données
        this.tripData = {
            id: tripId,
            destination: "Paris",
            price: 599,
            duration: "7 jours",
            departure: "2024-03-01",
            return: "2024-03-08"
        };
    }

    setupEventListeners() {
        this.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBookingSubmit();
        });

        // Masquer le CVV quand on quitte le champ
        document.getElementById('cvv')?.addEventListener('blur', (e) => {
            e.target.value = e.target.value.replace(/./g, '*');
        });
    }

    displayTripSummary() {
        const container = document.getElementById('selected-trip');
        if (!container || !this.tripData) return;

        container.innerHTML = `
            <div class="trip-details">
                <h3>${this.tripData.destination}</h3>
                <p>Départ: ${this.formatDate(this.tripData.departure)}</p>
                <p>Retour: ${this.formatDate(this.tripData.return)}</p>
                <p>Durée: ${this.tripData.duration}</p>
                <p class="price">Prix: ${this.tripData.price}€</p>
            </div>
        `;
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    async handleBookingSubmit() {
        const formData = this.getFormData();
        
        // Validation
        const validation = FormValidator.validateBookingForm(formData);
        if (!validation.isValid) {
            this.showErrors(validation.errors);
            return;
        }

        try {
            // Simuler l'envoi à l'API
            await this.submitBooking(formData);
            this.showSuccessMessage();
            setTimeout(() => {
                window.location.href = '/confirmation.html';
            }, 2000);
        } catch (error) {
            this.showErrors(['Une erreur est survenue lors de la réservation']);
        }
    }

    getFormData() {
        return {
            firstName: document.getElementById('firstName')?.value,
            lastName: document.getElementById('lastName')?.value,
            email: document.getElementById('email')?.value,
            phone: document.getElementById('phone')?.value,
            travelers: document.getElementById('travelers')?.value,
            class: document.getElementById('class')?.value,
            cardNumber: document.getElementById('cardNumber')?.value,
            expiry: document.getElementById('expiry')?.value,
            cvv: document.getElementById('cvv')?.value,
            tripId: this.tripData?.id
        };
    }

    async submitBooking(formData) {
        // Simulation d'une requête API
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Réservation soumise:', formData);
                resolve({ success: true, bookingId: 'BK' + Date.now() });
            }, 1000);
        });
    }

    showErrors(errors) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-messages';
        errorDiv.innerHTML = errors.map(err => `<p>${err}</p>`).join('');
        
        this.form.insertBefore(errorDiv, this.form.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = 'Réservation confirmée ! Redirection...';
        
        this.form.insertBefore(successDiv, this.form.firstChild);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    new BookingManager();
});
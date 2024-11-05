class FormValidator {
    static validateBookingForm(formData) {
        const errors = [];

        if (!formData.firstName?.trim()) {
            errors.push('Le prénom est requis');
        }

        if (!formData.lastName?.trim()) {
            errors.push('Le nom est requis');
        }

        if (!this.validateEmail(formData.email)) {
            errors.push('Email invalide');
        }

        if (!this.validatePhone(formData.phone)) {
            errors.push('Numéro de téléphone invalide');
        }

        if (!this.validateDates(formData.departure, formData.return)) {
            errors.push('Dates invalides');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePhone(phone) {
        const re = /^(\+33|0)[1-9](\d{2}){4}$/;
        return re.test(phone);
    }

    static validateDates(departure, returnDate) {
        const dep = new Date(departure);
        const ret = new Date(returnDate);
        const today = new Date();

        return dep >= today && ret > dep;
    }
}

// Export pour utilisation dans d'autres fichiers
window.FormValidator = FormValidator;
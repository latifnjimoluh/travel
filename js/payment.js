class PaymentProcessor {
    static async processPayment(paymentDetails) {
        // Simulation du traitement du paiement
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.validateCard(paymentDetails)) {
                    resolve({
                        success: true,
                        transactionId: 'TX' + Date.now(),
                        message: 'Paiement accepté'
                    });
                } else {
                    reject({
                        success: false,
                        message: 'Paiement refusé'
                    });
                }
            }, 1500);
        });
    }

    static validateCard(details) {
        return this.luhnCheck(details.cardNumber) &&
               this.validateExpiry(details.expiry) &&
               this.validateCVV(details.cvv);
    }

    static luhnCheck(cardNumber) {
        const digits = cardNumber.replace(/\D/g, '');
        let sum = 0;
        let isEven = false;

        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = parseInt(digits[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }

    static validateExpiry(expiry) {
        const [month, year] = expiry.split('/').map(num => parseInt(num));
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;

        return month >= 1 && month <= 12 &&
               year >= currentYear &&
               (year > currentYear || month >= currentMonth);
    }

    static validateCVV(cvv) {
        return /^\d{3,4}$/.test(cvv);
    }

    static formatCardNumber(number) {
        return number.replace(/\s/g, '')
                    .replace(/(\d{4})/g, '$1 ')
                    .trim();
    }

    static maskCardNumber(number) {
        const last4 = number.slice(-4);
        return `**** **** **** ${last4}`;
    }
}

// Ajouter les écouteurs d'événements pour le formatage de la carte
document.addEventListener('DOMContentLoaded', () => {
    const cardInput = document.getElementById('cardNumber');
    const expiryInput = document.getElementById('expiry');

    if (cardInput) {
        cardInput.addEventListener('input', (e) => {
            e.target.value = PaymentProcessor.formatCardNumber(e.target.value);
        });
    }

    if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
            e.target.value = e.target.value
                .replace(/\D/g, '')
                .replace(/(\d{2})(\d)/, '$1/$2')
                .slice(0, 5);
        });
    }
});
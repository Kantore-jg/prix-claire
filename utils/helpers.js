// Fonctions utilitaires

const calculateAveragePrice = (prices) => {
    if (!prices || prices.length === 0) return 0;
    const sum = prices.reduce((acc, price) => acc + parseFloat(price.prix), 0);
    return (sum / prices.length).toFixed(2);
};

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
};

const detectPriceChange = (currentPrice, previousPrice) => {
    if (!previousPrice) return null;
    const change = ((currentPrice - previousPrice) / previousPrice) * 100;
    return {
        percentage: change.toFixed(2),
        type: change > 0 ? 'hausse' : change < 0 ? 'baisse' : 'stable'
    };
};

module.exports = {
    calculateAveragePrice,
    formatDate,
    formatPrice,
    detectPriceChange
};


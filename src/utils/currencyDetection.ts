// Detect user's currency based on location
export const detectUserCurrency = async (): Promise<'eur' | 'gbp'> => {
  try {
    // Try to get country from Cloudflare trace API (supports CORS)
    const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
    const text = await response.text();
    const data = Object.fromEntries(
      text.trim().split('\n').map(line => line.split('='))
    );
    
    const country = data.loc?.toUpperCase();
    
    // UK countries that should use GBP
    const gbpCountries = ['GB', 'UK', 'IE']; // Great Britain, United Kingdom, Ireland
    
    if (gbpCountries.includes(country)) {
      return 'gbp';
    }
    
    return 'eur';
  } catch (error) {
    console.error('Error detecting currency:', error);
    // Default to EUR if detection fails
    return 'eur';
  }
};

// Format price based on currency
export const formatPrice = (amount: number, currency: 'eur' | 'gbp'): string => {
  const symbol = currency === 'gbp' ? '£' : '€';
  return `${symbol}${amount.toFixed(2)}`;
};

// Convert EUR to GBP (approximate exchange rate)
export const convertEurToGbp = (eurAmount: number): number => {
  // Using approximate exchange rate of 1 EUR = 0.85 GBP
  return Math.round(eurAmount * 0.85 * 100) / 100;
};

// Detect user's currency based on location
export const detectUserCurrency = async (): Promise<'eur' | 'gbp'> => {
  try {
    // Method 1: Try CloudFlare trace (more reliable)
    try {
      const cfResponse = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      const cfText = await cfResponse.text();
      const cfCountry = cfText.match(/loc=([A-Z]+)/)?.[1];
      
      if (cfCountry) {
        const gbpCountries = ['GB', 'UK', 'IE'];
        if (gbpCountries.includes(cfCountry)) {
          console.log('Currency detected via CloudFlare:', 'GBP');
          return 'gbp';
        }
        console.log('Currency detected via CloudFlare:', 'EUR');
        return 'eur';
      }
    } catch (cfError) {
      console.log('CloudFlare detection failed, trying fallback...');
    }

    // Method 2: Try ipapi.co as fallback
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        const country = data.country_code?.toUpperCase();
        
        const gbpCountries = ['GB', 'UK', 'IE'];
        if (gbpCountries.includes(country)) {
          console.log('Currency detected via ipapi:', 'GBP');
          return 'gbp';
        }
        console.log('Currency detected via ipapi:', 'EUR');
        return 'eur';
      }
    } catch (ipapiError) {
      console.log('ipapi.co detection failed, using timezone fallback...');
    }

    // Method 3: Timezone-based detection as last resort
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const ukTimezones = ['Europe/London', 'Europe/Belfast', 'Europe/Dublin', 'Europe/Guernsey', 'Europe/Isle_of_Man', 'Europe/Jersey'];
    
    if (ukTimezones.includes(timezone)) {
      console.log('Currency detected via timezone:', 'GBP');
      return 'gbp';
    }
    
    console.log('Defaulting to EUR');
    return 'eur';
  } catch (error) {
    console.error('Error detecting currency:', error);
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

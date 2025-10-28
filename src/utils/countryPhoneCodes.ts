// Complete list of all countries with phone codes

export interface Country {
  code: string;
  dialCode: string;
  name: string;
  format: RegExp;
  placeholder: string;
  maxLength: number;
}

export const allCountries: Country[] = [
  // A
  { code: 'AF', dialCode: '+93', name: 'Afghanistan', format: /^\d{9}$/, placeholder: '701234567', maxLength: 9 },
  { code: 'AL', dialCode: '+355', name: 'Albania', format: /^\d{9}$/, placeholder: '672123456', maxLength: 9 },
  { code: 'DZ', dialCode: '+213', name: 'Algeria', format: /^\d{9}$/, placeholder: '551234567', maxLength: 9 },
  { code: 'AS', dialCode: '+1684', name: 'American Samoa', format: /^\d{7}$/, placeholder: '7331234', maxLength: 7 },
  { code: 'AD', dialCode: '+376', name: 'Andorra', format: /^\d{6}$/, placeholder: '312345', maxLength: 6 },
  { code: 'AO', dialCode: '+244', name: 'Angola', format: /^\d{9}$/, placeholder: '923123456', maxLength: 9 },
  { code: 'AR', dialCode: '+54', name: 'Argentina', format: /^\d{10}$/, placeholder: '91123456789', maxLength: 10 },
  { code: 'AM', dialCode: '+374', name: 'Armenia', format: /^\d{8}$/, placeholder: '77123456', maxLength: 8 },
  { code: 'AU', dialCode: '+61', name: 'Australia', format: /^\d{9}$/, placeholder: '412345678', maxLength: 9 },
  { code: 'AT', dialCode: '+43', name: 'Austria', format: /^\d{10,11}$/, placeholder: '6641234567', maxLength: 11 },
  { code: 'AZ', dialCode: '+994', name: 'Azerbaijan', format: /^\d{9}$/, placeholder: '401234567', maxLength: 9 },
  
  // B
  { code: 'BH', dialCode: '+973', name: 'Bahrain', format: /^\d{8}$/, placeholder: '36123456', maxLength: 8 },
  { code: 'BD', dialCode: '+880', name: 'Bangladesh', format: /^\d{10}$/, placeholder: '1812345678', maxLength: 10 },
  { code: 'BY', dialCode: '+375', name: 'Belarus', format: /^\d{9}$/, placeholder: '291234567', maxLength: 9 },
  { code: 'BE', dialCode: '+32', name: 'Belgium', format: /^\d{9}$/, placeholder: '470123456', maxLength: 9 },
  { code: 'BZ', dialCode: '+501', name: 'Belize', format: /^\d{7}$/, placeholder: '6221234', maxLength: 7 },
  { code: 'BJ', dialCode: '+229', name: 'Benin', format: /^\d{8}$/, placeholder: '90123456', maxLength: 8 },
  { code: 'BO', dialCode: '+591', name: 'Bolivia', format: /^\d{8}$/, placeholder: '71234567', maxLength: 8 },
  { code: 'BA', dialCode: '+387', name: 'Bosnia', format: /^\d{8}$/, placeholder: '61123456', maxLength: 8 },
  { code: 'BW', dialCode: '+267', name: 'Botswana', format: /^\d{8}$/, placeholder: '71123456', maxLength: 8 },
  { code: 'BR', dialCode: '+55', name: 'Brazil', format: /^\d{11}$/, placeholder: '11987654321', maxLength: 11 },
  { code: 'BN', dialCode: '+673', name: 'Brunei', format: /^\d{7}$/, placeholder: '7123456', maxLength: 7 },
  { code: 'BG', dialCode: '+359', name: 'Bulgaria', format: /^\d{9}$/, placeholder: '878123456', maxLength: 9 },
  { code: 'BF', dialCode: '+226', name: 'Burkina Faso', format: /^\d{8}$/, placeholder: '70123456', maxLength: 8 },
  
  // C
  { code: 'KH', dialCode: '+855', name: 'Cambodia', format: /^\d{8,9}$/, placeholder: '91234567', maxLength: 9 },
  { code: 'CM', dialCode: '+237', name: 'Cameroon', format: /^\d{9}$/, placeholder: '671234567', maxLength: 9 },
  { code: 'CA', dialCode: '+1', name: 'Canada', format: /^\d{10}$/, placeholder: '4165551234', maxLength: 10 },
  { code: 'CL', dialCode: '+56', name: 'Chile', format: /^\d{9}$/, placeholder: '961234567', maxLength: 9 },
  { code: 'CN', dialCode: '+86', name: 'China', format: /^\d{11}$/, placeholder: '13800138000', maxLength: 11 },
  { code: 'CO', dialCode: '+57', name: 'Colombia', format: /^\d{10}$/, placeholder: '3211234567', maxLength: 10 },
  { code: 'CR', dialCode: '+506', name: 'Costa Rica', format: /^\d{8}$/, placeholder: '83123456', maxLength: 8 },
  { code: 'HR', dialCode: '+385', name: 'Croatia', format: /^\d{9}$/, placeholder: '912345678', maxLength: 9 },
  { code: 'CU', dialCode: '+53', name: 'Cuba', format: /^\d{8}$/, placeholder: '51234567', maxLength: 8 },
  { code: 'CY', dialCode: '+357', name: 'Cyprus', format: /^\d{8}$/, placeholder: '96123456', maxLength: 8 },
  { code: 'CZ', dialCode: '+420', name: 'Czech Republic', format: /^\d{9}$/, placeholder: '601123456', maxLength: 9 },
  
  // D
  { code: 'DK', dialCode: '+45', name: 'Denmark', format: /^\d{8}$/, placeholder: '20123456', maxLength: 8 },
  { code: 'DO', dialCode: '+1', name: 'Dominican Republic', format: /^\d{10}$/, placeholder: '8091234567', maxLength: 10 },
  
  // E
  { code: 'EC', dialCode: '+593', name: 'Ecuador', format: /^\d{9}$/, placeholder: '991234567', maxLength: 9 },
  { code: 'EG', dialCode: '+20', name: 'Egypt', format: /^\d{10}$/, placeholder: '1001234567', maxLength: 10 },
  { code: 'SV', dialCode: '+503', name: 'El Salvador', format: /^\d{8}$/, placeholder: '70123456', maxLength: 8 },
  { code: 'EE', dialCode: '+372', name: 'Estonia', format: /^\d{7,8}$/, placeholder: '51234567', maxLength: 8 },
  { code: 'ET', dialCode: '+251', name: 'Ethiopia', format: /^\d{9}$/, placeholder: '911234567', maxLength: 9 },
  
  // F
  { code: 'FI', dialCode: '+358', name: 'Finland', format: /^\d{9,10}$/, placeholder: '412345678', maxLength: 10 },
  { code: 'FR', dialCode: '+33', name: 'France', format: /^\d{9}$/, placeholder: '612345678', maxLength: 9 },
  
  // G
  { code: 'GE', dialCode: '+995', name: 'Georgia', format: /^\d{9}$/, placeholder: '555123456', maxLength: 9 },
  { code: 'DE', dialCode: '+49', name: 'Germany', format: /^\d{10,11}$/, placeholder: '15012345678', maxLength: 11 },
  { code: 'GH', dialCode: '+233', name: 'Ghana', format: /^\d{9}$/, placeholder: '231234567', maxLength: 9 },
  { code: 'GR', dialCode: '+30', name: 'Greece', format: /^\d{10}$/, placeholder: '6912345678', maxLength: 10 },
  { code: 'GT', dialCode: '+502', name: 'Guatemala', format: /^\d{8}$/, placeholder: '51234567', maxLength: 8 },
  
  // H
  { code: 'HN', dialCode: '+504', name: 'Honduras', format: /^\d{8}$/, placeholder: '91234567', maxLength: 8 },
  { code: 'HK', dialCode: '+852', name: 'Hong Kong', format: /^\d{8}$/, placeholder: '51234567', maxLength: 8 },
  { code: 'HU', dialCode: '+36', name: 'Hungary', format: /^\d{9}$/, placeholder: '201234567', maxLength: 9 },
  
  // I
  { code: 'IS', dialCode: '+354', name: 'Iceland', format: /^\d{7}$/, placeholder: '6111234', maxLength: 7 },
  { code: 'IN', dialCode: '+91', name: 'India', format: /^\d{10}$/, placeholder: '9876543210', maxLength: 10 },
  { code: 'ID', dialCode: '+62', name: 'Indonesia', format: /^\d{9,12}$/, placeholder: '812345678', maxLength: 12 },
  { code: 'IR', dialCode: '+98', name: 'Iran', format: /^\d{10}$/, placeholder: '9123456789', maxLength: 10 },
  { code: 'IQ', dialCode: '+964', name: 'Iraq', format: /^\d{10}$/, placeholder: '7912345678', maxLength: 10 },
  { code: 'IE', dialCode: '+353', name: 'Ireland', format: /^\d{9}$/, placeholder: '851234567', maxLength: 9 },
  { code: 'IL', dialCode: '+972', name: 'Israel', format: /^\d{9}$/, placeholder: '501234567', maxLength: 9 },
  { code: 'IT', dialCode: '+39', name: 'Italy', format: /^\d{10}$/, placeholder: '3123456789', maxLength: 10 },
  
  // J
  { code: 'JM', dialCode: '+1', name: 'Jamaica', format: /^\d{10}$/, placeholder: '8765551234', maxLength: 10 },
  { code: 'JP', dialCode: '+81', name: 'Japan', format: /^\d{10}$/, placeholder: '9012345678', maxLength: 10 },
  { code: 'JO', dialCode: '+962', name: 'Jordan', format: /^\d{9}$/, placeholder: '790123456', maxLength: 9 },
  
  // K
  { code: 'KZ', dialCode: '+7', name: 'Kazakhstan', format: /^\d{10}$/, placeholder: '7710123456', maxLength: 10 },
  { code: 'KE', dialCode: '+254', name: 'Kenya', format: /^\d{9}$/, placeholder: '712123456', maxLength: 9 },
  { code: 'KW', dialCode: '+965', name: 'Kuwait', format: /^\d{8}$/, placeholder: '50012345', maxLength: 8 },
  { code: 'KG', dialCode: '+996', name: 'Kyrgyzstan', format: /^\d{9}$/, placeholder: '700123456', maxLength: 9 },
  
  // L
  { code: 'LA', dialCode: '+856', name: 'Laos', format: /^\d{9,10}$/, placeholder: '2023123456', maxLength: 10 },
  { code: 'LV', dialCode: '+371', name: 'Latvia', format: /^\d{8}$/, placeholder: '21234567', maxLength: 8 },
  { code: 'LB', dialCode: '+961', name: 'Lebanon', format: /^\d{7,8}$/, placeholder: '71123456', maxLength: 8 },
  { code: 'LY', dialCode: '+218', name: 'Libya', format: /^\d{9}$/, placeholder: '912345678', maxLength: 9 },
  { code: 'LT', dialCode: '+370', name: 'Lithuania', format: /^\d{8}$/, placeholder: '61234567', maxLength: 8 },
  { code: 'LU', dialCode: '+352', name: 'Luxembourg', format: /^\d{9}$/, placeholder: '628123456', maxLength: 9 },
  
  // M
  { code: 'MO', dialCode: '+853', name: 'Macau', format: /^\d{8}$/, placeholder: '66123456', maxLength: 8 },
  { code: 'MK', dialCode: '+389', name: 'Macedonia', format: /^\d{8}$/, placeholder: '72123456', maxLength: 8 },
  { code: 'MY', dialCode: '+60', name: 'Malaysia', format: /^\d{9,10}$/, placeholder: '123456789', maxLength: 10 },
  { code: 'MV', dialCode: '+960', name: 'Maldives', format: /^\d{7}$/, placeholder: '7712345', maxLength: 7 },
  { code: 'MT', dialCode: '+356', name: 'Malta', format: /^\d{8}$/, placeholder: '79123456', maxLength: 8 },
  { code: 'MX', dialCode: '+52', name: 'Mexico', format: /^\d{10}$/, placeholder: '5512345678', maxLength: 10 },
  { code: 'MD', dialCode: '+373', name: 'Moldova', format: /^\d{8}$/, placeholder: '62012345', maxLength: 8 },
  { code: 'MC', dialCode: '+377', name: 'Monaco', format: /^\d{8,9}$/, placeholder: '612345678', maxLength: 9 },
  { code: 'MN', dialCode: '+976', name: 'Mongolia', format: /^\d{8}$/, placeholder: '88123456', maxLength: 8 },
  { code: 'ME', dialCode: '+382', name: 'Montenegro', format: /^\d{8}$/, placeholder: '67123456', maxLength: 8 },
  { code: 'MA', dialCode: '+212', name: 'Morocco', format: /^\d{9}$/, placeholder: '650123456', maxLength: 9 },
  { code: 'MM', dialCode: '+95', name: 'Myanmar', format: /^\d{8,10}$/, placeholder: '9212345678', maxLength: 10 },
  
  // N
  { code: 'NP', dialCode: '+977', name: 'Nepal', format: /^\d{10}$/, placeholder: '9841234567', maxLength: 10 },
  { code: 'NL', dialCode: '+31', name: 'Netherlands', format: /^\d{9}$/, placeholder: '612345678', maxLength: 9 },
  { code: 'NZ', dialCode: '+64', name: 'New Zealand', format: /^\d{8,10}$/, placeholder: '211234567', maxLength: 10 },
  { code: 'NI', dialCode: '+505', name: 'Nicaragua', format: /^\d{8}$/, placeholder: '81234567', maxLength: 8 },
  { code: 'NG', dialCode: '+234', name: 'Nigeria', format: /^\d{10}$/, placeholder: '8021234567', maxLength: 10 },
  { code: 'NO', dialCode: '+47', name: 'Norway', format: /^\d{8}$/, placeholder: '40612345', maxLength: 8 },
  
  // O
  { code: 'OM', dialCode: '+968', name: 'Oman', format: /^\d{8}$/, placeholder: '92123456', maxLength: 8 },
  
  // P
  { code: 'PK', dialCode: '+92', name: 'Pakistan', format: /^\d{10}$/, placeholder: '3001234567', maxLength: 10 },
  { code: 'PS', dialCode: '+970', name: 'Palestine', format: /^\d{9}$/, placeholder: '599123456', maxLength: 9 },
  { code: 'PA', dialCode: '+507', name: 'Panama', format: /^\d{8}$/, placeholder: '61234567', maxLength: 8 },
  { code: 'PY', dialCode: '+595', name: 'Paraguay', format: /^\d{9}$/, placeholder: '961123456', maxLength: 9 },
  { code: 'PE', dialCode: '+51', name: 'Peru', format: /^\d{9}$/, placeholder: '912345678', maxLength: 9 },
  { code: 'PH', dialCode: '+63', name: 'Philippines', format: /^\d{10}$/, placeholder: '9051234567', maxLength: 10 },
  { code: 'PL', dialCode: '+48', name: 'Poland', format: /^\d{9}$/, placeholder: '512345678', maxLength: 9 },
  { code: 'PT', dialCode: '+351', name: 'Portugal', format: /^\d{9}$/, placeholder: '912345678', maxLength: 9 },
  { code: 'PR', dialCode: '+1', name: 'Puerto Rico', format: /^\d{10}$/, placeholder: '7871234567', maxLength: 10 },
  
  // Q
  { code: 'QA', dialCode: '+974', name: 'Qatar', format: /^\d{8}$/, placeholder: '33123456', maxLength: 8 },
  
  // R
  { code: 'RO', dialCode: '+40', name: 'Romania', format: /^\d{9}$/, placeholder: '712345678', maxLength: 9 },
  { code: 'RU', dialCode: '+7', name: 'Russia', format: /^\d{10}$/, placeholder: '9161234567', maxLength: 10 },
  { code: 'RW', dialCode: '+250', name: 'Rwanda', format: /^\d{9}$/, placeholder: '720123456', maxLength: 9 },
  
  // S
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', format: /^\d{9}$/, placeholder: '501234567', maxLength: 9 },
  { code: 'SN', dialCode: '+221', name: 'Senegal', format: /^\d{9}$/, placeholder: '701234567', maxLength: 9 },
  { code: 'RS', dialCode: '+381', name: 'Serbia', format: /^\d{8,9}$/, placeholder: '601234567', maxLength: 9 },
  { code: 'SG', dialCode: '+65', name: 'Singapore', format: /^\d{8}$/, placeholder: '81234567', maxLength: 8 },
  { code: 'SK', dialCode: '+421', name: 'Slovakia', format: /^\d{9}$/, placeholder: '912123456', maxLength: 9 },
  { code: 'SI', dialCode: '+386', name: 'Slovenia', format: /^\d{8}$/, placeholder: '31234567', maxLength: 8 },
  { code: 'ZA', dialCode: '+27', name: 'South Africa', format: /^\d{9}$/, placeholder: '711234567', maxLength: 9 },
  { code: 'KR', dialCode: '+82', name: 'South Korea', format: /^\d{9,10}$/, placeholder: '1012345678', maxLength: 10 },
  { code: 'ES', dialCode: '+34', name: 'Spain', format: /^\d{9}$/, placeholder: '612345678', maxLength: 9 },
  { code: 'LK', dialCode: '+94', name: 'Sri Lanka', format: /^\d{9}$/, placeholder: '712345678', maxLength: 9 },
  { code: 'SE', dialCode: '+46', name: 'Sweden', format: /^\d{9}$/, placeholder: '701234567', maxLength: 9 },
  { code: 'CH', dialCode: '+41', name: 'Switzerland', format: /^\d{9}$/, placeholder: '781234567', maxLength: 9 },
  { code: 'SY', dialCode: '+963', name: 'Syria', format: /^\d{9}$/, placeholder: '944567890', maxLength: 9 },
  
  // T
  { code: 'TW', dialCode: '+886', name: 'Taiwan', format: /^\d{9}$/, placeholder: '912345678', maxLength: 9 },
  { code: 'TJ', dialCode: '+992', name: 'Tajikistan', format: /^\d{9}$/, placeholder: '917123456', maxLength: 9 },
  { code: 'TZ', dialCode: '+255', name: 'Tanzania', format: /^\d{9}$/, placeholder: '621234567', maxLength: 9 },
  { code: 'TH', dialCode: '+66', name: 'Thailand', format: /^\d{9}$/, placeholder: '812345678', maxLength: 9 },
  { code: 'TN', dialCode: '+216', name: 'Tunisia', format: /^\d{8}$/, placeholder: '20123456', maxLength: 8 },
  { code: 'TR', dialCode: '+90', name: 'Turkey', format: /^\d{10}$/, placeholder: '5321234567', maxLength: 10 },
  { code: 'TM', dialCode: '+993', name: 'Turkmenistan', format: /^\d{8}$/, placeholder: '65123456', maxLength: 8 },
  
  // U
  { code: 'UG', dialCode: '+256', name: 'Uganda', format: /^\d{9}$/, placeholder: '712345678', maxLength: 9 },
  { code: 'UA', dialCode: '+380', name: 'Ukraine', format: /^\d{9}$/, placeholder: '501234567', maxLength: 9 },
  { code: 'AE', dialCode: '+971', name: 'UAE', format: /^\d{9}$/, placeholder: '501234567', maxLength: 9 },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', format: /^\d{10}$/, placeholder: '7400123456', maxLength: 10 },
  { code: 'US', dialCode: '+1', name: 'United States', format: /^\d{10}$/, placeholder: '2025551234', maxLength: 10 },
  { code: 'UY', dialCode: '+598', name: 'Uruguay', format: /^\d{8}$/, placeholder: '94123456', maxLength: 8 },
  { code: 'UZ', dialCode: '+998', name: 'Uzbekistan', format: /^\d{9}$/, placeholder: '901234567', maxLength: 9 },
  
  // V
  { code: 'VE', dialCode: '+58', name: 'Venezuela', format: /^\d{10}$/, placeholder: '4241234567', maxLength: 10 },
  { code: 'VN', dialCode: '+84', name: 'Vietnam', format: /^\d{9,10}$/, placeholder: '912345678', maxLength: 10 },
  
  // Y
  { code: 'YE', dialCode: '+967', name: 'Yemen', format: /^\d{9}$/, placeholder: '712345678', maxLength: 9 },
  
  // Z
  { code: 'ZM', dialCode: '+260', name: 'Zambia', format: /^\d{9}$/, placeholder: '955123456', maxLength: 9 },
  { code: 'ZW', dialCode: '+263', name: 'Zimbabwe', format: /^\d{9}$/, placeholder: '712345678', maxLength: 9 },
];

// Helper function to get country by code
export const getCountryByCode = (code: string): Country | undefined => {
  return allCountries.find(c => c.code === code);
};

// Helper function to detect country from IP
export const detectCountryFromIP = async (): Promise<string | null> => {
  try {
    // Try Cloudflare trace API first
    const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
    const text = await response.text();
    const data = Object.fromEntries(
      text.trim().split('\n').map(line => line.split('='))
    );
    return data.loc?.toUpperCase() || null;
  } catch (error) {
    console.error('Error detecting country from IP:', error);
    return null;
  }
};

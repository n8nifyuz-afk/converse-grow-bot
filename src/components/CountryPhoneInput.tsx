import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Country {
  code: string;
  dialCode: string;
  name: string;
  format: RegExp;
  placeholder: string;
  maxLength: number;
}

const countries: Country[] = [
  { code: 'US', dialCode: '+1', name: 'United States', format: /^\d{10}$/, placeholder: '2025551234', maxLength: 10 },
  { code: 'UZ', dialCode: '+998', name: 'Uzbekistan', format: /^\d{9}$/, placeholder: '901234567', maxLength: 9 },
  { code: 'VE', dialCode: '+58', name: 'Venezuela', format: /^\d{10}$/, placeholder: '4241234567', maxLength: 10 },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', format: /^\d{10}$/, placeholder: '7400123456', maxLength: 10 },
  { code: 'CN', dialCode: '+86', name: 'China', format: /^\d{11}$/, placeholder: '13800138000', maxLength: 11 },
  { code: 'IN', dialCode: '+91', name: 'India', format: /^\d{10}$/, placeholder: '9876543210', maxLength: 10 },
  { code: 'RU', dialCode: '+7', name: 'Russia', format: /^\d{10}$/, placeholder: '9161234567', maxLength: 10 },
  { code: 'BR', dialCode: '+55', name: 'Brazil', format: /^\d{11}$/, placeholder: '11987654321', maxLength: 11 },
  { code: 'JP', dialCode: '+81', name: 'Japan', format: /^\d{10}$/, placeholder: '9012345678', maxLength: 10 },
  { code: 'DE', dialCode: '+49', name: 'Germany', format: /^\d{10,11}$/, placeholder: '15012345678', maxLength: 11 },
  { code: 'FR', dialCode: '+33', name: 'France', format: /^\d{9}$/, placeholder: '612345678', maxLength: 9 },
  { code: 'IT', dialCode: '+39', name: 'Italy', format: /^\d{10}$/, placeholder: '3123456789', maxLength: 10 },
  { code: 'ES', dialCode: '+34', name: 'Spain', format: /^\d{9}$/, placeholder: '612345678', maxLength: 9 },
  { code: 'CA', dialCode: '+1', name: 'Canada', format: /^\d{10}$/, placeholder: '4165551234', maxLength: 10 },
  { code: 'AU', dialCode: '+61', name: 'Australia', format: /^\d{9}$/, placeholder: '412345678', maxLength: 9 },
  { code: 'MX', dialCode: '+52', name: 'Mexico', format: /^\d{10}$/, placeholder: '5512345678', maxLength: 10 },
  { code: 'TR', dialCode: '+90', name: 'Turkey', format: /^\d{10}$/, placeholder: '5321234567', maxLength: 10 },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', format: /^\d{9}$/, placeholder: '501234567', maxLength: 9 },
  { code: 'AE', dialCode: '+971', name: 'UAE', format: /^\d{9}$/, placeholder: '501234567', maxLength: 9 },
  { code: 'PK', dialCode: '+92', name: 'Pakistan', format: /^\d{10}$/, placeholder: '3001234567', maxLength: 10 },
];

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (isValid: boolean) => void;
  className?: string;
  disabled?: boolean;
  showValidation?: boolean;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  value,
  onChange,
  onValidation,
  className = '',
  disabled = false,
  showValidation = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Parse initial value if provided
    if (value && value.startsWith('+')) {
      const country = countries.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.dialCode.length));
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validatePhoneNumber = (number: string, country: Country): boolean => {
    if (!number) return false;
    const cleanNumber = number.replace(/\D/g, '');
    return country.format.test(cleanNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    const truncated = input.slice(0, selectedCountry.maxLength);
    setPhoneNumber(truncated);
    
    const fullNumber = selectedCountry.dialCode + truncated;
    onChange(fullNumber);
    
    const valid = validatePhoneNumber(truncated, selectedCountry);
    setIsValid(truncated.length > 0 ? valid : null);
    onValidation?.(valid);
  };

  const handleInputFocus = () => {
    // Close dropdown when focusing input on mobile to prevent conflicts
    setIsDropdownOpen(false);
    
    // Scroll input into view on mobile after a short delay
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center'
      });
    }, 300);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery('');
    
    // Revalidate with new country
    if (phoneNumber) {
      const valid = validatePhoneNumber(phoneNumber, country);
      setIsValid(valid);
      onValidation?.(valid);
      onChange(country.dialCode + phoneNumber);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery)
  );

  return (
    <div className={`country-phone-input-container ${className}`} ref={dropdownRef}>
      <div className="country-phone-input-wrapper">
        {/* Country Code Selector */}
        <button
          type="button"
          onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          className="country-selector"
        >
          <span className="dial-code">{selectedCountry.dialCode}</span>
          <ChevronDown className={`chevron ${isDropdownOpen ? 'rotate' : ''}`} size={16} />
        </button>

        {/* Phone Number Input */}
        <input
          ref={inputRef}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          onFocus={handleInputFocus}
          placeholder={selectedCountry.placeholder}
          disabled={disabled}
          className={`phone-input ${isValid === false ? 'invalid' : ''} ${isValid === true ? 'valid' : ''}`}
          maxLength={selectedCountry.maxLength}
        />
      </div>

      {/* Validation Message */}
      {showValidation && isValid === false && phoneNumber.length > 0 && (
        <p className="validation-message">
          Invalid phone number for {selectedCountry.name}
        </p>
      )}

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="country-dropdown">
          <input
            type="text"
            placeholder="Search country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="country-search"
            autoFocus
          />
          <div className="country-list">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className={`country-option ${country.code === selectedCountry.code ? 'selected' : ''}`}
              >
                <span className="country-name">{country.name}</span>
                <span className="country-dial-code">{country.dialCode}</span>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="no-results">No countries found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

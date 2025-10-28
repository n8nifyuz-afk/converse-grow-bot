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
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', format: /^\d{10}$/, placeholder: '7400123456', maxLength: 10 },
  { code: 'IN', dialCode: '+91', name: 'India', format: /^\d{10}$/, placeholder: '9876543210', maxLength: 10 },
];

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (isValid: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  value,
  onChange,
  onValidation,
  className = '',
  disabled = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={selectedCountry.placeholder}
          disabled={disabled}
          className={`phone-input ${isValid === false ? 'invalid' : ''} ${isValid === true ? 'valid' : ''}`}
          maxLength={selectedCountry.maxLength}
        />
      </div>

      {/* Validation Message */}
      {isValid === false && phoneNumber.length > 0 && (
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

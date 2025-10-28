import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { allCountries, type Country, getCountryByCode, detectCountryFromIP } from '@/utils/countryPhoneCodes';

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
  const [selectedCountry, setSelectedCountry] = useState<Country>(allCountries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isDetectingCountry, setIsDetectingCountry] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-detect country on mount
    const detectAndSetCountry = async () => {
      try {
        // First, try to get country from user's profile
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('country')
            .eq('user_id', user.id)
            .single();
          
          if (profile?.country) {
            const detectedCountry = getCountryByCode(profile.country);
            if (detectedCountry) {
              setSelectedCountry(detectedCountry);
              console.log('Country detected from profile:', detectedCountry.name);
              setIsDetectingCountry(false);
              return;
            }
          }
        }
        
        // If no profile country, try IP-based detection
        const countryCode = await detectCountryFromIP();
        if (countryCode) {
          const detectedCountry = getCountryByCode(countryCode);
          if (detectedCountry) {
            setSelectedCountry(detectedCountry);
            console.log('Country detected from IP:', detectedCountry.name);
          }
        }
      } catch (error) {
        console.error('Error detecting country:', error);
      } finally {
        setIsDetectingCountry(false);
      }
    };

    // Parse initial value if provided
    if (value && value.startsWith('+')) {
      const country = allCountries.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.dialCode.length));
        setIsDetectingCountry(false);
      } else {
        detectAndSetCountry();
      }
    } else {
      detectAndSetCountry();
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
    // Close dropdown when focusing input to prevent conflicts
    setIsDropdownOpen(false);
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

  const toggleDropdown = () => {
    if (!disabled && !isDetectingCountry) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const filteredCountries = allCountries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`country-phone-input-container ${className}`} ref={containerRef}>
      <div className="country-phone-input-wrapper" ref={dropdownRef}>
        {/* Country Code Selector */}
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled || isDetectingCountry}
          className="country-selector"
          title={selectedCountry.name}
        >
          <span className="dial-code">
            {isDetectingCountry ? '...' : selectedCountry.dialCode}
          </span>
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
                <div className="country-info">
                  <span className="country-flag">{country.code}</span>
                  <span className="country-name">{country.name}</span>
                </div>
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

// lib/utils/phone.ts
// This file is used to handle the phone number formatting and validation
// It is used to handle the phone number formatting and validation for the users phone number

type CountryCode = {
    code: string;
    pattern: string;  // A rough format pattern (not used directly in the code here)
    example: string;  // Example phone number for placeholders
    minLength: number;
    maxLength: number;
  };
  
  export const countryCodes: { [key: string]: CountryCode } = {
    US: { code: "+1",  pattern: "(###) ###-####",   example: "(555) 555-5555", minLength: 10, maxLength: 10 },
    CA: { code: "+1",  pattern: "(###) ###-####",   example: "(555) 555-5555", minLength: 10, maxLength: 10 },
    UK: { code: "+44", pattern: "#### ######",      example: "7911 123456", minLength: 10, maxLength: 11 },
    MX: { code: "+52", pattern: "## #### ####",     example: "+52 55 1234 5678", minLength: 10, maxLength: 10 },
    AU: { code: "+61", pattern: "#### ### ###",     example: "+61 401 234 567", minLength: 10, maxLength: 10 },
    NZ: { code: "+64", pattern: "### ### ####",     example: "+64 21 234 5678", minLength: 10, maxLength: 10 },
    IN: { code: "+91", pattern: "#### ### ###",     example: "+91 98765 43210", minLength: 10, maxLength: 10 },
    CN: { code: "+86", pattern: "### #### ####",    example: "+86 138 1234 5678", minLength: 10, maxLength: 10 },
    JP: { code: "+81", pattern: "##-####-####",     example: "+81 70-1234-5678", minLength: 10, maxLength: 10 },
    DE: { code: "+49", pattern: "#### ########",    example: "+49 1512 3456789", minLength: 10, maxLength: 10 },
    FR: { code: "+33", pattern: "## ## ## ## ##",   example: "+33 6 12 34 56 78", minLength: 10, maxLength: 10 },
    IT: { code: "+39", pattern: "### #######",      example: "+39 320 123 4567", minLength: 10, maxLength: 10 },
    ES: { code: "+34", pattern: "### ## ## ##",     example: "+34 612 345 678", minLength: 10, maxLength: 10 },
    RU: { code: "+7",  pattern: "### ###-##-##",    example: "+7 911 123-45-67", minLength: 10, maxLength: 10 },
    AE: { code: "+971", pattern: "## ### ####",     example: "+971 50 123 4567", minLength: 10, maxLength: 10 },
    EG: { code: "+20", pattern: "## ### ####",      example: "+20 10 1234 5678", minLength: 10, maxLength: 10 },
    // ...add as many as you need
  }
  
  /**
   * Format a phone number based on the user's chosen countryCode.
   * Adjust logic to handle the country patterns you need more precisely.
   */
  export function formatPhoneNumber(phone: string | null | undefined, countryCode: string = "US"): string {
    // Return empty string if phone is null or undefined
    if (!phone) return '';
  
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
  
    // Get country specific format
    const format = countryCodes[countryCode]?.pattern || countryCodes['US'].pattern;
  
    // If cleaned number is too short, return as is
    if (cleaned.length < 10) return cleaned;
  
    // Apply the format
    let formatted = format;
    let i = 0;
    formatted = formatted.replace(/9/g, () => cleaned[i++] || '');
  
    return formatted;
  }
  
  /**
   * Basic validation that checks length of the digits
   * Adjust for stricter rules / more countries
   */
  export function isValidPhoneNumber(phone: string, countryCode: string = "US"): boolean {
    const cleaned = phone.replace(/\D/g, '');
  
    // Basic validation rules by country
    switch(countryCode) {
      case 'US':
      case 'CA':
        return cleaned.length === 10;
      case 'UK':
        return cleaned.length === 10 || cleaned.length === 11;
      case 'AU':
        return cleaned.length === 10;
      // Add more country-specific validation as needed
      default:
        return cleaned.length >= 10 && cleaned.length <= 15;
    }
  }
  
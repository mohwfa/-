import { CompanySettings, PrintLogoSize, PrintFontSize } from '../types';

export interface ResolvedPrintStyles {
  showLogo: boolean;
  logoWrapperClass: string;
  logoImgClass: string;
  fallbackIconClass: string;
  fontSizeClass: string;
  tableFontClass: string;
  showTaxAndCR: boolean;
  showAddressPhone: boolean;
  showEmail: boolean;
  recipientLabel: string;
  auditorLabel: string;
}

export const getPrintStyles = (settings: CompanySettings): ResolvedPrintStyles => {
  const printLogoSize: PrintLogoSize = settings.printLogoSize || 'sm';
  const showLogoInPrint = settings.showLogoInPrint !== false && printLogoSize !== 'hidden';

  // Logo dimensions
  let logoWrapperClass = 'w-10 h-10 max-h-10 max-w-16'; // default 'sm' (40px)
  let logoImgClass = 'max-h-full max-w-full object-contain';
  let fallbackIconClass = 'w-5 h-5';

  if (printLogoSize === 'xs') {
    // Extra small (32px) - very compact
    logoWrapperClass = 'w-8 h-8 max-h-8 max-w-12';
    fallbackIconClass = 'w-4 h-4';
  } else if (printLogoSize === 'sm') {
    // Small (40px) - clean & compact
    logoWrapperClass = 'w-10 h-10 max-h-10 max-w-16';
    fallbackIconClass = 'w-5 h-5';
  } else if (printLogoSize === 'md') {
    // Medium (52px)
    logoWrapperClass = 'w-13 h-13 max-h-13 max-w-22';
    fallbackIconClass = 'w-6 h-6';
  } else if (printLogoSize === 'lg') {
    // Large (68px)
    logoWrapperClass = 'w-16 h-16 max-h-16 max-w-28';
    fallbackIconClass = 'w-7 h-7';
  }

  // Print typography size
  const printFontSize: PrintFontSize = settings.printFontSize || 'normal';
  let fontSizeClass = 'text-xs';
  if (printFontSize === 'compact') {
    fontSizeClass = 'text-[11px]';
  } else if (printFontSize === 'comfortable') {
    fontSizeClass = 'text-sm';
  }

  return {
    showLogo: showLogoInPrint,
    logoWrapperClass,
    logoImgClass,
    fallbackIconClass,
    fontSizeClass,
    tableFontClass: fontSizeClass,
    showTaxAndCR: settings.showTaxAndCRInPrint !== false,
    showAddressPhone: settings.showAddressPhoneInPrint !== false,
    showEmail: settings.showEmailInPrint !== false,
    recipientLabel: settings.recipientSignatureLabel?.trim() || 'توقيع المستلم / العميل',
    auditorLabel: settings.auditorSignatureLabel?.trim() || 'المحاسب المسؤول / الإدارة',
  };
};

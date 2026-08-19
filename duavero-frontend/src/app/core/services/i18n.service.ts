import { Injectable, signal, computed } from '@angular/core';

export type Language = 'en' | 'hi';

export interface TranslationDictionary {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly STORAGE_KEY = 'duavero_language';

  // Reactive signal for active locale
  readonly currentLanguage = signal<Language>(this.getInitialLanguage());
  readonly isHindi = computed(() => this.currentLanguage() === 'hi');

  private translations: Record<Language, TranslationDictionary> = {
    en: {},
    hi: {}
  };

  constructor() {
    this.loadDictionaries();
  }

  setLanguage(lang: Language): void {
    this.currentLanguage.set(lang);
    try {
      localStorage.setItem(this.STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch (e) {}
  }

  toggleLanguage(): void {
    this.setLanguage(this.currentLanguage() === 'en' ? 'hi' : 'en');
  }

  /**
   * Translates a key by navigating nested properties (e.g., 'COMMON.DASHBOARD', 'QUOTATIONS.PENDING_APPROVAL')
   */
  t(path: string, defaultValue?: string): string {
    const lang = this.currentLanguage();
    const dict = this.translations[lang] || {};

    const keys = path.split('.');
    let current: any = dict;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if missing in Hindi
        if (lang !== 'en') {
          let fallback: any = this.translations.en;
          for (const fbKey of keys) {
            if (fallback && typeof fallback === 'object' && fbKey in fallback) {
              fallback = fallback[fbKey];
            } else {
              fallback = null;
              break;
            }
          }
          if (fallback && typeof fallback === 'string') {
            return fallback;
          }
        }
        return defaultValue || path;
      }
    }

    return typeof current === 'string' ? current : (defaultValue || path);
  }

  private getInitialLanguage(): Language {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'en' || stored === 'hi') {
        return stored as Language;
      }
    } catch (e) {}
    return 'en';
  }

  private loadDictionaries(): void {
    // Synchronous comprehensive embedded base dictionaries for instant zero-latency translation
    this.translations.en = {
      PLATFORM: {
        NAME: 'DuaVero',
        TAGLINE: 'Enterprise B2B Industrial ERP & Management Platform',
        ORG_WORKSPACE: 'Organization Account',
        SUPER_ADMIN: 'Super Admin Control Center'
      },
      NAV: {
        DASHBOARD: 'Dashboard Telemetry',
        STAFF_RBAC: 'Staff & Role Permissions',
        CATEGORIES: 'Category Master',
        PRODUCTS: 'Products & Inventory',
        QUOTATIONS: 'Quotations & Approvals',
        APPROVAL_QUEUE: 'Manager Approval Queue',
        INVOICES: 'GST Invoices & Billing',
        SETTINGS: 'Company Settings',
        SIGN_OUT: 'Sign Out'
      },
      COMMON: {
        SEARCH: 'Search records...',
        STATUS: 'Status',
        ACTIONS: 'Actions',
        CREATE: 'Create New',
        EDIT: 'Edit',
        DELETE: 'Delete',
        CANCEL: 'Cancel',
        SAVE: 'Save Changes',
        CONFIRM: 'Confirm',
        APPROVE: 'Approve',
        REJECT: 'Reject',
        ACTIVE: 'Active',
        DISABLED: 'Disabled',
        PENDING: 'Pending',
        SUCCESS: 'Success',
        ERROR: 'Error',
        LANGUAGE: 'Language',
        REFRESH: 'Refresh',
        SUBTOTAL: 'Subtotal',
        DISCOUNT: 'Discount',
        TAX_GST: 'GST Tax (18%)',
        GRAND_TOTAL: 'Grand Total',
        ADVANCE_DUE: 'Advance Due',
        BALANCE_DUE: 'Remaining Balance'
      },
      CATEGORIES: {
        TITLE: 'Category Master Management',
        SUBTITLE: 'Governed taxonomy for sofa manufacturing, upholstery, acoustic paneling & hardware',
        DRAWER_CREATE_TITLE: 'Create Master Category',
        DRAWER_EDIT_TITLE: 'Edit Master Category',
        NAME: 'Category Name',
        CODE: 'Category Code / SKU Prefix',
        PARENT: 'Parent Category',
        HSN: 'HSN / SAC Code',
        TAX_SLAB: 'Default Tax Slab (%)',
        DESCRIPTION: 'Description & Scope',
        ACTIVE_STATUS: 'Active Status',
        CUSTOM_ATTRIBUTES: 'Configured Custom Attributes',
        DELETE_CONFIRM_TITLE: 'Delete Category Safeguard',
        DELETE_CONFIRM_MSG: 'Are you sure you want to soft-delete this category? Products linked to this category will be preserved but the category will be archived from active catalogs.',
        NO_CATEGORIES: 'No master categories found. Click "+ Add Category" to create one.'
      },
      RBAC: {
        TITLE: 'Granular Role-Based Access Control (RBAC)',
        SUBTITLE: 'Configure dynamic operational & approval permissions matrix per organizational role',
        ROLE: 'Role Name',
        CODE: 'Role Code',
        PERMISSIONS_COUNT: 'Active Permissions',
        TOGGLE_HINT: 'Toggle checkboxes to immediately grant or revoke permissions for this role.',
        MODULE_QUOTATION: 'Quotation Workflow',
        MODULE_PRODUCT: 'Catalog & Inventory',
        MODULE_USER: 'User & Staff Directory',
        MODULE_ROLE: 'Permissions Matrix',
        MODULE_INVOICE: 'Tax Invoices',
        MODULE_CATEGORY: 'Category Master'
      },
      QUOTATIONS: {
        TITLE: 'Quotations & Tiered Approval Pipeline',
        SUBTITLE: 'Generate cost estimates with automated discount checks and manager authorization',
        CREATE_BTN: '+ Create Quotation',
        TAB_ALL: 'All Quotations',
        TAB_APPROVALS: 'Manager Approval Queue',
        CUSTOMER: 'Customer / Client Name',
        QUOTE_NUM: 'Quote #',
        ISSUE_DATE: 'Issue Date',
        VALID_UNTIL: 'Valid Until',
        STATUS_DRAFT: 'Draft',
        STATUS_PENDING: 'Pending Manager Approval',
        STATUS_APPROVED: 'Approved',
        STATUS_REJECTED: 'Rejected',
        STATUS_SENT: 'Issued to Client',
        DISCOUNT_PCT: 'Overall Discount (%)',
        DISCOUNT_WARNING_TITLE: 'High Discount Threshold Notice (>20%)',
        DISCOUNT_WARNING_MSG: 'Standard staff authorization permits up to 20% discount. A discount of {pct}% requires mandatory management approval.',
        DISCOUNT_REASON_LABEL: 'Mandatory Reason for Extra Discount',
        DISCOUNT_REASON_PLACEHOLDER: 'Explain reason (e.g., bulk order contract, strategic account acquisition)...',
        APPROVAL_QUEUE_EMPTY: 'No quotations currently awaiting manager approval.',
        APPROVE_ACTION: '✓ Approve Discount',
        REJECT_ACTION: '✕ Reject Quote',
        REASON_GIVEN: 'Justification Provided by Staff'
      }
    };

    this.translations.hi = {
      PLATFORM: {
        NAME: 'दुआवेरो',
        TAGLINE: 'औद्योगिक बी2बी एंटरप्राइज ईआरपी और प्रबंधन प्रणाली',
        ORG_WORKSPACE: 'कंपनी / व्यापार कार्यक्षेत्र',
        SUPER_ADMIN: 'सुपर एडमिन नियंत्रण केंद्र'
      },
      NAV: {
        DASHBOARD: 'डैशबोर्ड अवलोकन',
        STAFF_RBAC: 'कर्मचारी और अनुमतियां',
        CATEGORIES: 'श्रेणी मास्टर प्रबंधन',
        PRODUCTS: 'उत्पाद और सूची',
        QUOTATIONS: 'कोटेशन और अनुमोदन',
        APPROVAL_QUEUE: 'प्रबंधक अनुमोदन कतार',
        INVOICES: 'जीएसटी चालान और बिलिंग',
        SETTINGS: 'कंपनी सेटिंग्स',
        SIGN_OUT: 'लॉग आउट'
      },
      COMMON: {
        SEARCH: 'खोजें...',
        STATUS: 'स्थिति',
        ACTIONS: 'कार्रवाई',
        CREATE: 'नया बनाएं',
        EDIT: 'संपादित करें',
        DELETE: 'हटाएं',
        CANCEL: 'रद्द करें',
        SAVE: 'सहेजें',
        CONFIRM: 'पुष्टि करें',
        APPROVE: 'स्वीकृत करें',
        REJECT: 'अस्वीकार करें',
        ACTIVE: 'सक्रिय',
        DISABLED: 'निष्क्रिय',
        PENDING: 'लंबित',
        SUCCESS: 'सफल',
        ERROR: 'त्रुटि',
        LANGUAGE: 'भाषा',
        REFRESH: 'ताज़ा करें',
        SUBTOTAL: 'उप-योग',
        DISCOUNT: 'छूट (डिस्काउंट)',
        TAX_GST: 'जीएसटी कर (18%)',
        GRAND_TOTAL: 'कुल योग',
        ADVANCE_DUE: 'अग्रिम देय राशि',
        BALANCE_DUE: 'शेष देय राशि'
      },
      CATEGORIES: {
        TITLE: 'श्रेणी मास्टर प्रबंधन (Category Master)',
        SUBTITLE: 'सोफा निर्माण, कपड़े, दीवार पैनलिंग और हार्डवेयर के लिए संरचित टैक्सोनॉमी',
        DRAWER_CREATE_TITLE: 'नई श्रेणी बनाएं',
        DRAWER_EDIT_TITLE: 'श्रेणी संपादित करें',
        NAME: 'श्रेणी का नाम',
        CODE: 'श्रेणी कोड / एसकेयू उपसर्ग',
        PARENT: 'मूल श्रेणी (Parent Category)',
        HSN: 'एचएसएन / सैक कोड (HSN/SAC)',
        TAX_SLAB: 'डिफ़ॉल्ट जीएसटी दर (%)',
        DESCRIPTION: 'विवरण और कार्यक्षेत्र',
        ACTIVE_STATUS: 'सक्रिय स्थिति',
        CUSTOM_ATTRIBUTES: 'कॉन्फ़िगर की गई कस्टम विशेषताएं',
        DELETE_CONFIRM_TITLE: 'श्रेणी हटाने की सुरक्षा',
        DELETE_CONFIRM_MSG: 'क्या आप वाकई इस श्रेणी को सॉफ्ट-डिलीट करना चाहते हैं? इससे जुड़े उत्पाद सुरक्षित रहेंगे पर यह श्रेणी सक्रिय सूची से हट जाएगी।',
        NO_CATEGORIES: 'कोई श्रेणी नहीं मिली। नई श्रेणी जोड़ने के लिए "+ श्रेणी जोड़ें" पर क्लिक करें।'
      },
      RBAC: {
        TITLE: 'भूमिका-आधारित अभिगम नियंत्रण (RBAC Permissions)',
        SUBTITLE: 'प्रत्येक व्यावसायिक भूमिका के लिए गतिशील संचालन और अनुमोदन अनुमति मैट्रिक्स सेट करें',
        ROLE: 'भूमिका का नाम',
        CODE: 'भूमिका कोड',
        PERMISSIONS_COUNT: 'सक्रिय अनुमतियां',
        TOGGLE_HINT: 'इस भूमिका के लिए अनुमतियां तुरंत देने या हटाने के लिए चेकबॉक्स पर क्लिक करें।',
        MODULE_QUOTATION: 'कोटेशन वर्कफ़्लो',
        MODULE_PRODUCT: 'कैटलॉग और इन्वेंट्री',
        MODULE_USER: 'कर्मचारी निर्देशिका',
        MODULE_ROLE: 'अनुमति मैट्रिक्स',
        MODULE_INVOICE: 'टैक्स इनवॉइस',
        MODULE_CATEGORY: 'श्रेणी मास्टर'
      },
      QUOTATIONS: {
        TITLE: 'कोटेशन और स्तरीय अनुमोदन कार्यप्रवाह',
        SUBTITLE: 'स्वचालित छूट जांच और प्रबंधक प्राधिकरण के साथ लागत अनुमान उत्पन्न करें',
        CREATE_BTN: '+ नया कोटेशन बनाएं',
        TAB_ALL: 'सभी कोटेशन',
        TAB_APPROVALS: 'प्रबंधक अनुमोदन कतार',
        CUSTOMER: 'ग्राहक / क्लाइंट का नाम',
        QUOTE_NUM: 'कोटेशन सं.',
        ISSUE_DATE: 'जारी करने की तिथि',
        VALID_UNTIL: 'मान्य तिथि',
        STATUS_DRAFT: 'ड्राफ्ट',
        STATUS_PENDING: 'प्रबंधक अनुमोदन हेतु लंबित',
        STATUS_APPROVED: 'स्वीकृत',
        STATUS_REJECTED: 'अस्वीकृत',
        STATUS_SENT: 'क्लाइंट को भेजा गया',
        DISCOUNT_PCT: 'कुल छूट प्रतिशत (%)',
        DISCOUNT_WARNING_TITLE: 'अतिरिक्त छूट सूचना (>20%)',
        DISCOUNT_WARNING_MSG: 'मानक कर्मचारी छूट सीमा अधिकतम 20% है। {pct}% छूट के लिए प्रबंधक का पूर्व अनुमोदन अनिवार्य है।',
        DISCOUNT_REASON_LABEL: 'अतिरिक्त छूट का अनिवार्य कारण',
        DISCOUNT_REASON_PLACEHOLDER: 'छूट का कारण बताएं (जैसे: बड़ा थोक ऑर्डर, वार्षिक अनुबंध)...',
        APPROVAL_QUEUE_EMPTY: 'वर्तमान में प्रबंधक अनुमोदन के लिए कोई कोटेशन लंबित नहीं है।',
        APPROVE_ACTION: '✓ छूट स्वीकृत करें',
        REJECT_ACTION: '✕ अस्वीकार करें',
        REASON_GIVEN: 'कर्मचारी द्वारा दिया गया औचित्य'
      }
    };
  }
}

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertHundreds(num) {
  let result = '';
  if (num > 99) {
    result += `${ones[Math.floor(num / 100)]} Hundred `;
    num %= 100;
  }
  if (num > 19) {
    result += `${tens[Math.floor(num / 10)]} `;
    num %= 10;
  }
  if (num > 0) {
    result += `${ones[num]} `;
  }
  return result.trim();
}

function convertIndian(num) {
  if (num === 0) return 'Zero';

  let result = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  if (crore) result += `${convertHundreds(crore)} Crore `;
  if (lakh) result += `${convertHundreds(lakh)} Lakh `;
  if (thousand) result += `${convertHundreds(thousand)} Thousand `;
  if (hundred) result += convertHundreds(hundred);

  return result.trim();
}

export const DECIMAL_INPUT = /^\d*\.?\d*$/;

export const fmtMoney = (n) => {
  const num = typeof n === 'number' ? n : parseFloat(n);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
};

/** Discount is stored as percentage of rate (e.g. 10 = 10%). */
export function getDiscountPercent(item) {
  return Math.min(100, Math.max(0, parseFloat(item.discount) || 0));
}

export function getDiscountAmount(rate, discountPercent) {
  const r = parseFloat(rate) || 0;
  const pct = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0));
  return (r * pct) / 100;
}

export function amountToWords(amount) {
  const safe = Math.max(0, Number(amount) || 0);
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);

  let words = `Rupees ${convertIndian(rupees)}`;
  if (paise > 0) {
    words += ` and ${convertIndian(paise)} Paise`;
  }
  words += ' Only';
  return words;
}

/** Extract gross rate from a tax-inclusive total (as if discount were 0%). */
export function getRateFromEnteredTotal(item, totalAmount) {
  const total = parseFloat(totalAmount) || 0;
  const cgstRate = parseFloat(item.cgstRate) || 0;
  const sgstRate = parseFloat(item.sgstRate) || 0;
  const igstRate = parseFloat(item.igstRate) || 0;
  const taxMultiplier = 1 + (cgstRate + sgstRate + igstRate) / 100;
  if (!total || !taxMultiplier) return 0;
  return Math.round((total / taxMultiplier) * 100) / 100;
}

/** Merge parent item with live form fields (line-item component). */
export function mergeLineItemSnapshot(item = {}, fields = {}) {
  const hasManualTotal = fields.manualTotal != null && fields.manualTotal !== '';
  const stored = normalizeStoredItem(item);

  return {
    ...stored,
    description: fields.description ?? stored.description,
    sacCode: fields.sacCode ?? stored.sacCode,
    rate: fields.rate !== '' && fields.rate != null ? fields.rate : stored.rate,
    discount: fields.discount !== '' && fields.discount != null ? fields.discount : stored.discount,
    cgstRate: fields.cgstRate ?? stored.cgstRate,
    sgstRate: fields.sgstRate ?? stored.sgstRate,
    igstRate: fields.igstRate ?? stored.igstRate,
    manualTotal: hasManualTotal ? fields.manualTotal : stored.manualTotal,
  };
}

/** Resolve line item for display/calculations (handles total-first entry). */
export function getEffectiveItem(item) {
  const base = normalizeStoredItem(item);
  if (base.manualTotal != null && base.manualTotal !== '') {
    const rate = getRateFromEnteredTotal(base, base.manualTotal);
    return calculateItem({ ...base, rate });
  }
  return calculateItem(base);
}

export function calculateItem(item) {
  const rate = parseFloat(item.rate) || 0;
  const discountPercent = getDiscountPercent(item);
  const discountAmount = getDiscountAmount(rate, discountPercent);
  const taxableValue = Math.max(0, rate - discountAmount);
  const cgstRate = parseFloat(item.cgstRate) || 0;
  const sgstRate = parseFloat(item.sgstRate) || 0;
  const igstRate = parseFloat(item.igstRate) || 0;
  const cgstAmount = (taxableValue * cgstRate) / 100;
  const sgstAmount = (taxableValue * sgstRate) / 100;
  const igstAmount = (taxableValue * igstRate) / 100;
  const total = taxableValue + cgstAmount + sgstAmount + igstAmount;

  return {
    ...item,
    discountAmount,
    taxableValue,
    cgstAmount,
    sgstAmount,
    igstAmount,
    total,
  };
}

/** Reverse-calculate rate & tax breakdown when user enters line total */
export function calculateItemFromTotal(item, totalAmount) {
  const total = parseFloat(totalAmount) || 0;
  const discountPercent = getDiscountPercent(item);
  const discountFactor = Math.max(0, 1 - discountPercent / 100);
  const cgstRate = parseFloat(item.cgstRate) || 0;
  const sgstRate = parseFloat(item.sgstRate) || 0;
  const igstRate = parseFloat(item.igstRate) || 0;
  const taxMultiplier = 1 + (cgstRate + sgstRate + igstRate) / 100;

  if (!total || !taxMultiplier) {
    return {
      ...item,
      rate: 0,
      discountAmount: 0,
      taxableValue: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      total: 0,
      manualTotal: total || null,
    };
  }

  const taxableValue = total / taxMultiplier;
  const rate = discountFactor > 0 ? taxableValue / discountFactor : taxableValue;
  const discountAmount = rate - taxableValue;
  const cgstAmount = (taxableValue * cgstRate) / 100;
  const sgstAmount = (taxableValue * sgstRate) / 100;
  const igstAmount = (taxableValue * igstRate) / 100;
  const round = (n) => Math.round(n * 100) / 100;

  return {
    ...item,
    rate: round(rate),
    discountAmount: round(discountAmount),
    taxableValue: round(taxableValue),
    cgstAmount: round(cgstAmount),
    sgstAmount: round(sgstAmount),
    igstAmount: round(igstAmount),
    total: round(total),
    manualTotal: totalAmount === '' || totalAmount == null ? null : totalAmount,
  };
}

/** Keep only user-editable fields in React state (not calculated totals). */
export function normalizeStoredItem(item = {}) {
  const stored = {
    description: item.description ?? '',
    sacCode: item.sacCode ?? DEFAULT_SAC_CODE,
    rate: item.rate ?? '',
    discount: item.discount ?? '',
    cgstRate: item.cgstRate ?? 9,
    sgstRate: item.sgstRate ?? 9,
    igstRate: item.igstRate ?? 0,
    manualTotal: item.manualTotal ?? null,
  };
  if (item._key) stored._key = item._key;
  return stored;
}

export function applyItemFieldChange(item, field, value) {
  const base = normalizeStoredItem(item);
  const hasManualTotal = base.manualTotal != null && base.manualTotal !== '';

  if (field === 'total') {
    if (value === '' || value == null) {
      return { ...base, manualTotal: null };
    }
    const rate = getRateFromEnteredTotal({ ...base, manualTotal: null }, value);
    return {
      ...base,
      manualTotal: value,
      rate: rate ? String(rate) : '',
    };
  }

  if (field === 'rate') {
    return { ...base, rate: value, manualTotal: null };
  }

  // Total-first: re-extract rate when discount or tax % changes, then apply discount forward
  if (hasManualTotal && ['discount', 'cgstRate', 'sgstRate', 'igstRate'].includes(field)) {
    const updated = { ...base, [field]: value };
    const rate = getRateFromEnteredTotal(updated, updated.manualTotal);
    return {
      ...updated,
      rate: rate ? String(rate) : '',
    };
  }

  return { ...base, [field]: value };
}

export function calculateInvoiceTotals(items) {
  const calculated = items.map(getEffectiveItem);
  const subtotal = calculated.reduce((sum, i) => sum + i.taxableValue, 0);
  const cgst = calculated.reduce((sum, i) => sum + i.cgstAmount, 0);
  const sgst = calculated.reduce((sum, i) => sum + i.sgstAmount, 0);
  const igst = calculated.reduce((sum, i) => sum + i.igstAmount, 0);
  const totalTax = cgst + sgst + igst;
  const grandTotal = subtotal + totalTax;

  return {
    items: calculated,
    subtotal,
    cgst,
    sgst,
    igst,
    totalTax,
    grandTotal,
    amountInWords: amountToWords(grandTotal),
  };
}

export const INDIAN_STATES = [
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' },
  { name: 'Bihar', code: '10' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Goa', code: '30' },
  { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' },
  { name: 'Kerala', code: '32' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' },
  { name: 'Odisha', code: '21' },
  { name: 'Punjab', code: '03' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Sikkim', code: '11' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' },
  { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' },
  { name: 'Delhi', code: '07' },
  { name: 'Jammu and Kashmir', code: '01' },
  { name: 'Ladakh', code: '38' },
  { name: 'Chandigarh', code: '04' },
  { name: 'Puducherry', code: '34' },
];

export const DEFAULT_COMPANY_STATE = 'Maharashtra';
export const DEFAULT_COMPANY_STATE_CODE = '27';
export const DEFAULT_SAC_CODE = '998512';

export const STATE_OPTIONS = INDIAN_STATES.map((s) => ({
  value: s.name,
  label: `${s.name} (${s.code})`,
  searchText: `${s.name} ${s.code}`,
}));

let itemKeyCounter = 0;

export const emptyItem = () => ({
  ...normalizeStoredItem({}),
  _key: `item-${++itemKeyCounter}`,
});

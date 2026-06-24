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

export function amountToWords(amount) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = `Rupees ${convertIndian(rupees)}`;
  if (paise > 0) {
    words += ` and ${convertIndian(paise)} Paise`;
  }
  words += ' Only';
  return words;
}

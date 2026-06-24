import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toPublicSlug(invoiceNumber) {
  return invoiceNumber?.replace(/\//g, '-') || '';
}

export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return path;
}

/** Merge per-invoice / per-format overrides onto company settings for preview & PDF */
export function mergeInvoiceDisplaySettings(settings, invoice = {}) {
  return {
    ...(settings || {}),
    bankName: invoice.bankName || settings?.bankName,
    accountNumber: invoice.accountNumber || settings?.accountNumber,
    ifscCode: invoice.ifscCode || settings?.ifscCode,
    branchName: invoice.branchName || settings?.branchName,
    terms: invoice.terms != null && invoice.terms !== '' ? invoice.terms : settings?.terms,
    footerNote: invoice.footerNote || '',
  };
}

export const CUSTOMIZATION_FIELDS = ['terms', 'bankName', 'accountNumber', 'ifscCode', 'branchName', 'footerNote'];

export function pickCustomization(source = {}) {
  return {
    terms: source.terms || '',
    bankName: source.bankName || '',
    accountNumber: source.accountNumber || '',
    ifscCode: source.ifscCode || '',
    branchName: source.branchName || '',
    footerNote: source.footerNote || '',
  };
}

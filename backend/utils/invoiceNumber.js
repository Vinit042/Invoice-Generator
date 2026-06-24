import prisma from '../config/db.js';

export async function generateInvoiceNumber(userId) {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  const prefix = settings?.invoicePrefix || 'BGS';
  const financialYear = settings?.financialYear || '26-27';

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      userId,
      invoiceNumber: { contains: `/${financialYear}` },
    },
    orderBy: { id: 'desc' },
  });

  let nextNum = 1;
  if (lastInvoice) {
    const match = lastInvoice.invoiceNumber.match(/\/(\d+)\//);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  const padded = String(nextNum).padStart(4, '0');
  return `${prefix}/${padded}/${financialYear}`;
}

export function toPublicSlug(invoiceNumber) {
  return invoiceNumber.replace(/\//g, '-');
}

export function fromPublicSlug(slug) {
  const parts = slug.split('-');
  if (parts.length >= 3) {
    const fy = parts.slice(-2).join('-');
    const num = parts[parts.length - 3];
    const prefix = parts.slice(0, -3).join('-');
    return `${prefix}/${num}/${fy}`;
  }
  return slug.replace(/-/g, '/');
}

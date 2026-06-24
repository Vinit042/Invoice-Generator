import prisma from '../config/db.js';
import { amountToWords } from '../utils/numberToWords.js';
import { generateInvoiceNumber } from '../utils/invoiceNumber.js';

function calculateItemTotals(item) {
  const rate = parseFloat(item.rate) || 0;
  const discountPercent = Math.min(100, Math.max(0, parseFloat(item.discount) || 0));
  const discountAmount = (rate * discountPercent) / 100;
  const taxableValue = Math.max(0, rate - discountAmount);
  const cgstRate = parseFloat(item.cgstRate) || 0;
  const sgstRate = parseFloat(item.sgstRate) || 0;
  const igstRate = parseFloat(item.igstRate) || 0;
  const cgstAmount = (taxableValue * cgstRate) / 100;
  const sgstAmount = (taxableValue * sgstRate) / 100;
  const igstAmount = (taxableValue * igstRate) / 100;
  const total = taxableValue + cgstAmount + sgstAmount + igstAmount;

  return {
    description: item.description ?? '',
    sacCode: item.sacCode || null,
    rate,
    discount: discountPercent,
    taxableValue,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    total,
  };
}

function calculateInvoiceTotals(items) {
  const calculated = items.map(calculateItemTotals);
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

export const getInvoices = async (req, res) => {
  try {
    const { search, status, startDate, endDate } = req.query;
    const where = { userId: req.userId };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customerName: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) where.invoiceDate.lte = new Date(endDate);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { customerName: true, companyName: true } },
      },
    });

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const settings = await prisma.settings.findUnique({ where: { userId: req.userId } });
    res.json({ invoice, settings });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.userId;
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter((i) => i.status === 'PAID').length,
      pendingInvoices: invoices.filter((i) => i.status === 'SENT').length,
      draftInvoices: invoices.filter((i) => i.status === 'DRAFT').length,
      totalRevenue: invoices
        .filter((i) => i.status === 'PAID')
        .reduce((sum, i) => sum + i.grandTotal, 0),
      recentInvoices: invoices.slice(0, 5),
      revenueByMonth: {},
    };

    invoices
      .filter((i) => i.status === 'PAID')
      .forEach((inv) => {
        const month = new Date(inv.invoiceDate).toLocaleString('default', {
          month: 'short',
          year: 'numeric',
        });
        stats.revenueByMonth[month] = (stats.revenueByMonth[month] || 0) + inv.grandTotal;
      });

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const {
      customerId,
      invoiceNumber,
      invoiceDate,
      supplyDate,
      placeOfSupply,
      state,
      stateCode,
      customerName,
      customerAddress,
      customerGst,
      customerState,
      customerStateCode,
      status,
      items,
      terms,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      footerNote,
    } = req.body;

    const totals = calculateInvoiceTotals(items || []);
    const invNumber = invoiceNumber || (await generateInvoiceNumber(req.userId));

    const invoice = await prisma.invoice.create({
      data: {
        userId: req.userId,
        customerId: customerId ? parseInt(customerId) : null,
        invoiceNumber: invNumber,
        invoiceDate: new Date(invoiceDate),
        supplyDate: supplyDate ? new Date(supplyDate) : null,
        placeOfSupply,
        state,
        stateCode,
        customerName,
        customerAddress,
        customerGst,
        customerState: customerState || null,
        customerStateCode: customerStateCode || null,
        subtotal: totals.subtotal,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        totalTax: totals.totalTax,
        grandTotal: totals.grandTotal,
        amountInWords: totals.amountInWords,
        status: status || 'DRAFT',
        terms: terms || null,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        ifscCode: ifscCode || null,
        branchName: branchName || null,
        footerNote: footerNote || null,
        items: {
          create: totals.items.map((item) => ({
            description: item.description,
            sacCode: item.sacCode,
            rate: item.rate,
            discount: item.discount,
            taxableValue: item.taxableValue,
            cgstRate: item.cgstRate,
            cgstAmount: item.cgstAmount,
            sgstRate: item.sgstRate,
            sgstAmount: item.sgstAmount,
            igstRate: item.igstRate,
            igstAmount: item.igstAmount,
            total: item.total,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Invoice number already exists. Please use a different number.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const {
      customerId,
      invoiceDate,
      supplyDate,
      placeOfSupply,
      state,
      stateCode,
      customerName,
      customerAddress,
      customerGst,
      customerState,
      customerStateCode,
      status,
      items,
      terms,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      footerNote,
    } = req.body;

    const totals = calculateInvoiceTotals(items || []);

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });

    const invoice = await prisma.invoice.update({
      where: { id: existing.id },
      data: {
        customerId: customerId ? parseInt(customerId) : null,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : existing.invoiceDate,
        supplyDate: supplyDate ? new Date(supplyDate) : null,
        placeOfSupply,
        state,
        stateCode,
        customerName,
        customerAddress,
        customerGst,
        customerState: customerState || null,
        customerStateCode: customerStateCode || null,
        subtotal: totals.subtotal,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        totalTax: totals.totalTax,
        grandTotal: totals.grandTotal,
        amountInWords: totals.amountInWords,
        status: status || existing.status,
        terms: terms ?? existing.terms,
        bankName: bankName ?? existing.bankName,
        accountNumber: accountNumber ?? existing.accountNumber,
        ifscCode: ifscCode ?? existing.ifscCode,
        branchName: branchName ?? existing.branchName,
        footerNote: footerNote ?? existing.footerNote,
        items: {
          create: totals.items.map((item) => ({
            description: item.description,
            sacCode: item.sacCode,
            rate: item.rate,
            discount: item.discount,
            taxableValue: item.taxableValue,
            cgstRate: item.cgstRate,
            cgstAmount: item.cgstAmount,
            sgstRate: item.sgstRate,
            sgstAmount: item.sgstAmount,
            igstRate: item.igstRate,
            igstAmount: item.igstAmount,
            total: item.total,
          })),
        },
      },
      include: { items: true },
    });

    res.json(invoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Invoice number already exists. Please use a different number.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await prisma.invoice.delete({ where: { id: existing.id } });
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getNextInvoiceNumber = async (req, res) => {
  try {
    const number = await generateInvoiceNumber(req.userId);
    res.json({ invoiceNumber: number });
  } catch (error) {
    console.error('Next invoice number error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

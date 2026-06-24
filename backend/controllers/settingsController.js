import prisma from '../config/db.js';
import { fromPublicSlug } from '../utils/invoiceNumber.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { userId: req.userId } });

    if (!settings) {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user) {
        return res.status(401).json({ message: 'Session invalid. Please log in again.' });
      }
      settings = await prisma.settings.create({
        data: {
          userId: req.userId,
          companyName: user?.companyName,
          invoicePrefix: 'BGS',
          financialYear: '26-27',
          state: 'Maharashtra',
          stateCode: '27',
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const {
      companyName,
      gstNumber,
      panNumber,
      address,
      email,
      phone,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      invoicePrefix,
      financialYear,
      state,
      stateCode,
      terms,
    } = req.body;

    const data = {
      companyName,
      gstNumber,
      panNumber,
      address,
      email,
      phone,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      invoicePrefix,
      financialYear,
      state,
      stateCode,
      terms,
    };

    if (req.files?.logo?.[0]) {
      data.logo = `/uploads/${req.files.logo[0].filename}`;
    }
    if (req.files?.signature?.[0]) {
      data.signature = `/uploads/${req.files.signature[0].filename}`;
    }

    const settings = await prisma.settings.upsert({
      where: { userId: req.userId },
      update: data,
      create: {
        userId: req.userId,
        ...data,
        invoicePrefix: invoicePrefix || 'BGS',
        financialYear: financialYear || '26-27',
      },
    });

    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicInvoice = async (req, res) => {
  try {
    const invoiceNumber = fromPublicSlug(req.params.invoiceNumber);

    const invoice = await prisma.invoice.findFirst({
      where: { invoiceNumber },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: invoice.userId },
    });

    res.json({ invoice, settings });
  } catch (error) {
    console.error('Public invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

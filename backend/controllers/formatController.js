import prisma from '../config/db.js';

function stripItems(items = []) {
  return items.map((item) => ({
    description: item.description || '',
    sacCode: item.sacCode || '',
    rate: parseFloat(item.rate) || 0,
    discount: parseFloat(item.discount) || 0,
    cgstRate: parseFloat(item.cgstRate) || 0,
    sgstRate: parseFloat(item.sgstRate) || 0,
    igstRate: parseFloat(item.igstRate) || 0,
  }));
}

export const getFormats = async (req, res) => {
  try {
    const formats = await prisma.invoiceFormat.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        placeOfSupply: true,
        state: true,
        stateCode: true,
        terms: true,
        bankName: true,
        accountNumber: true,
        ifscCode: true,
        branchName: true,
        footerNote: true,
        createdAt: true,
        updatedAt: true,
        items: true,
      },
    });
    res.json(formats);
  } catch (error) {
    console.error('Get formats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFormat = async (req, res) => {
  try {
    const format = await prisma.invoiceFormat.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!format) {
      return res.status(404).json({ message: 'Format not found' });
    }
    res.json(format);
  } catch (error) {
    console.error('Get format error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createFormat = async (req, res) => {
  try {
    const { name, placeOfSupply, state, stateCode, items, terms, bankName, accountNumber, ifscCode, branchName, footerNote } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Format name is required' });
    }
    if (!items?.length) {
      return res.status(400).json({ message: 'At least one line item is required' });
    }

    const format = await prisma.invoiceFormat.create({
      data: {
        userId: req.userId,
        name: name.trim(),
        placeOfSupply: placeOfSupply || null,
        state: state || null,
        stateCode: stateCode || null,
        items: stripItems(items),
        terms: terms || null,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        ifscCode: ifscCode || null,
        branchName: branchName || null,
        footerNote: footerNote || null,
      },
    });

    res.status(201).json(format);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'A format with this name already exists' });
    }
    console.error('Create format error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateFormat = async (req, res) => {
  try {
    const existing = await prisma.invoiceFormat.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Format not found' });
    }

    const { name, placeOfSupply, state, stateCode, items, terms, bankName, accountNumber, ifscCode, branchName, footerNote } = req.body;

    const format = await prisma.invoiceFormat.update({
      where: { id: existing.id },
      data: {
        name: name?.trim() || existing.name,
        placeOfSupply: placeOfSupply ?? existing.placeOfSupply,
        state: state ?? existing.state,
        stateCode: stateCode ?? existing.stateCode,
        items: items ? stripItems(items) : existing.items,
        terms: terms ?? existing.terms,
        bankName: bankName ?? existing.bankName,
        accountNumber: accountNumber ?? existing.accountNumber,
        ifscCode: ifscCode ?? existing.ifscCode,
        branchName: branchName ?? existing.branchName,
        footerNote: footerNote ?? existing.footerNote,
      },
    });

    res.json(format);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'A format with this name already exists' });
    }
    console.error('Update format error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteFormat = async (req, res) => {
  try {
    const existing = await prisma.invoiceFormat.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Format not found' });
    }

    await prisma.invoiceFormat.delete({ where: { id: existing.id } });
    res.json({ message: 'Format deleted' });
  } catch (error) {
    console.error('Delete format error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

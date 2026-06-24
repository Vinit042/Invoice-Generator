import prisma from '../config/db.js';

export const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const where = { userId: req.userId };

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { companyName: { contains: search } },
        { gstNumber: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { invoices: true } },
      },
    });

    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            grandTotal: true,
            status: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { customerName, companyName, gstNumber, phone, email, address, state, stateCode } = req.body;

    if (!customerName) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    const customer = await prisma.customer.create({
      data: {
        userId: req.userId,
        customerName,
        companyName,
        gstNumber,
        phone,
        email,
        address,
        state,
        stateCode,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const existing = await prisma.customer.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const { customerName, companyName, gstNumber, phone, email, address, state, stateCode } = req.body;

    const customer = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        customerName,
        companyName,
        gstNumber,
        phone,
        email,
        address,
        state,
        stateCode,
      },
    });

    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const existing = await prisma.customer.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await prisma.customer.delete({ where: { id: existing.id } });
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

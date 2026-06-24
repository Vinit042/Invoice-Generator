import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const register = async (req, res) => {
  try {
    const { companyName, username, password } = req.body;

    if (!companyName || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        companyName,
        username,
        password: hashedPassword,
        settings: {
          create: {
            companyName,
            invoicePrefix: 'BGS',
            financialYear: '26-27',
            state: 'Maharashtra',
            stateCode: '27',
          },
        },
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        companyName: user.companyName,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    res.json({
      token,
      user: {
        id: user.id,
        companyName: user.companyName,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

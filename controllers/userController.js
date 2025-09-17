const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const userController = {
  // Create a new user
  createUser: async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all users
  getUsers: async (req, res, next) => {
    try {
      // Simplified to match original prompt requirements - no pagination or search
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        data: { users }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user by ID
  getUserById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
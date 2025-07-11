const userService = require("../service/userService");
const sanitize = require('../utils/sanitizeInput');
const logger = require('../utils/logger');
const { validationResult } = require("express-validator");
const Timetable = require("../models/Timetable");

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorArray = errors.array();
      logger.warn(`Register validation failed: ${errorArray.map(e => `${e.param}: ${e.msg}`).join(", ")}`);
      return res.status(400).json({ errors: errorArray });
    }
    logger.info(`Register attempt: ${req.body.username}`);
    const sanitizedBody = sanitize(req.body);
    const result = await userService.createUser(sanitizedBody);
    logger.info(`Register success: ${result.username}`);
    res.status(201).json(result);
  } catch (err) {
    logger.error(`Register failed for ${req.body.username}: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    logger.info(`Login attempt: ${req.body.username}`);
    const sanitizedBody = sanitize(req.body);
    const result = await userService.login(sanitizedBody);
    logger.info(`Login success: ${result.user.username}`);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Login failed for ${req.body.username}: ${err.message}`);
    res.status(401).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    logger.info(`Password reset requested for: ${req.body.username}`);
    const sanitizedBody = sanitize(req.body);
    const result = await userService.resetPassword(sanitizedBody);
    logger.info(`Password reset success for: ${req.body.username}`);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Password reset failed for ${req.body.username}: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ פונקציית עדכון פרטי משתמש
const updateUser = async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    res.json(updatedUser);
  } catch (error) {
    console.error("שגיאה בעדכון משתמש:", error);
    res.status(500).json({ error: "Server error during user update" });
  }
};

const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};




module.exports = { register, login, getAllUsers, updateUser, deleteUser, resetPassword };
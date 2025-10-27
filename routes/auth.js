const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth');
const User = require('../models/user');
const isAuth = require('../middleware/is-auth');


const router = express.Router();

router.post('/signup', 
  [
    body('name').trim().not().isEmpty(),
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .normalizeEmail()
    .custom(async (value)=>{
      const user = await User.findOne({ email: value });
       if (user){
         throw new Error('E-Mail address already exists!. please login instead.');
       }
       return true;
    }),
    body('password').trim().isLength({ min: 8 })
  ], 
  authController.signup);

router.post('/login', 
  [
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .normalizeEmail()
    .custom(async (value)=>{
      const user = await User.findOne({ email: value });
       if (!user){
         throw new Error('No account found with this email. Please sign up first.');
       }
       return true;
    }),
    body('password').trim().isLength({ min: 8 })
  ], 
  authController.login);

  router.get('/status', isAuth , authController.getUserStatus);

  router.put('/status', isAuth , authController.updateUserStatus);

module.exports = router;

const User = require('../models/user');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.signup = async (req, res, next) => {
  const {name , email , password} = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     return res.status(422).json({ 
      message: 'Validation failed. Please check your input.', 
      errors: errors.array()
     });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      name: name,
      email: email,
      password: hashedPassword
    });
    const result = await user.save();
    res.status(201).json({ message: 'User created successfully!', userId: result._id });
  }
   catch (err)
   {
     if(!err.statusCode){
       err.statusCode = 500;
     }
     next(err);
   }
};


exports.login = async (req, res, next) => {
  const { email , password} = req.body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     return res.status(422).json({ 
      message: 'Validation failed. Please check your input.', 
      errors: errors.array()
     });
  }

  try {
    const user = await User.findOne({ email: email });
  
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      return res.status(401).json({ message: 'Wrong password!' });
    }

    const token = jwt.sign(
      {userId : user._id.toString() , email: user.email},
      'mySuperSecretKey123!@#',
      {expiresIn: '1h'}
    )
    res.status(200).json({ message: 'Logged in!', userId: user._id.toString(), token: token });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};


exports.getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user){
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ status: user.status });  
  }
  catch(err)
  {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
 };


  exports.updateUserStatus = async (req, res, next) => {
    const newStatus = req.body.status;

    try{
    const user = await User.findById(req.userId);
    if (!user){
      return  res.status(404).json({ message: 'User not found.' });
    }
    user.status = newStatus;
    await user.save();
    res.status(200).json({ message: 'User status updated.' , status: user.status  });
    }
    catch(err){
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };
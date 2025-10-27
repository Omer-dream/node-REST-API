const express = require('express');
const { body } = require('express-validator');
const feedController = require('../controllers/feed');
const multer = require('multer');
const {v4 : uuidv4} = require('uuid');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/images');
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if(
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ){
    cb(null, true);
  }
  else{
    cb(null, false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });



// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

// POST /feed/post
router.post('/post', isAuth,
  [
  body('title').trim().notEmpty().isLength({ min: 5 }).withMessage('Title must be at least 5 characters long.'),
  body('content').trim().notEmpty().isLength({ min: 5 }).withMessage('Content must be at least 5 characters long.'),
  ],
  feedController.createPost
);

router.post('/upload-image' , isAuth, upload.single('image') , feedController.uploadImage);

router.get('/singlePost/:postId', isAuth, feedController.getSinglePost);

router.delete('/deletePost/:postId', isAuth, feedController.deletePost);

router.put('/updatePost/:postId', isAuth,
  [
    body('title').trim().notEmpty().isLength({ min: 5 }).withMessage('Title must be at least 5 characters long.'),
    body('content').trim().notEmpty().isLength({ min: 5 }).withMessage('Content must be at least 5 characters long.'),
  ],
  feedController.updatePost
);

module.exports = router;
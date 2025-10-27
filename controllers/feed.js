const { validationResult } = require("express-validator");
const Post = require("../models/post");
const { deleteImageFile } = require("../utils/file");
const User = require("../models/user");
const { getIO } = require("../utils/socket");

exports.getPosts = async (req, res, next) => {
  const page = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // <-- Sort by newest first
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("creator");
    res.status(200).json({
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    res.status(500).json({ message: "Fetcing posts failed. ", error: err });
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed. Please check your input.");
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.body.imageUrl;
  const creator = req.userId;
  try {
    const post = new Post({
      title: title,
      content: content,
      imageUrl: imageUrl,
      creator: creator,
    });
    const result = await post.save();

    const user = await User.findById(creator);
    user.posts.push(result._id);
    await user.save();
    const populatedPost = await result.populate("creator");

    getIO().emit("posts", { action: "create", post: populatedPost });

    res.status(201).json({
      message: "Post created successfully!",
      post: populatedPost,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.uploadImage = (req, res, next) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "No file uploaded or invalid file type." });
  }
  res.status(201).json({ imageUrl: "/images/" + req.file.filename });
};

exports.getSinglePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  console.log("this is postId for deletion:", postId);
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized!" });
    }

    if (post.imageUrl) {
      deleteImageFile(post.imageUrl);
    }

    await Post.findByIdAndDelete(postId);
    await User.findByIdAndUpdate(req.userId, { $pull: { posts: postId } });

    getIO().emit("posts", { action: "delete", post: postId });

    res.status(200).json({ message: "Post deleted successfully." });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed. Please check your input.");
      error.statusCode = 422;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized!" });
    }
    const { title, content, imageUrl } = req.body;
    post.title = title;
    post.content = content;

    if (imageUrl && post.imageUrl && imageUrl !== post.imageUrl) {
      deleteImageFile(post.imageUrl);
      post.imageUrl = imageUrl;
    } else if (imageUrl) {
      post.imageUrl = imageUrl;
    }

    const result = await post.save();

    const populatedPost = await result.populate("creator");

    getIO().emit("posts", { action: "update", post: populatedPost });

    res
      .status(200)
      .json({ message: "Post updated successfully!", post: populatedPost });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

require("dotenv").config();

const checkAuth = require("./middleware/auth");

const jwt = require("jsonwebtoken");

const express = require("express");

const mongoose = require("mongoose");

const mongooseID = process.env.MONGODB_URI;

const bcrypt = require("bcrypt");

const User = require("./models/User");

const Post = require("./models/Post");

const Comment = require("./models/Comments");

const app = express();

// Connect to Mongoose
mongoose
  .connect(mongooseID)
  .then(() => console.log("connected to mongoose"))
  .catch((err) => console.log(`Server ran into error ${err}`));

app.use(express.json());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`running on port ${PORT}`);
});

// Users route
app.post("/users", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields before querying DB
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate field lengths
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user object
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Save to database before confirming to the user
    await newUser.save();
    res.json({
      message: "User successfully created",
      user: { username, email },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "Username or password already in use." });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields before querying DB
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Check the DB and find the corresponding user
    const user = await User.findOne({ username: username });

    // Check if user exsits before proceeding
    if (user === null) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check the passwords match
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch === false) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // If password matches, create JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      message: "Login successful",
      token: token,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Posts route
app.post("/posts", checkAuth, async (req, res) => {
  try {
    const { title, content } = req.body;

    // Validate required fields before querying the DB
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    // Creates a new Post
    const newPost = new Post({
      title,
      content,
      author: req.userId,
    });

    // Wait for the post to be saved to the DB
    await newPost.save();
    // Let the user know the post has been created
    res.status(201).json({
      message: "Post created successfully",
      post: newPost, // Sends back created post data
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all posts
app.get("/posts", async (req, res) => {
  try {
    // Extract pagination params
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default 10 per page
    const skip = (page - 1) * limit; // Calculate how many to skip

    // Get total count for pagination metadata
    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find()
      .limit(limit)
      .skip(skip)
      .populate("author", "username email");

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        postsPerPage: limit,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get post by ID
app.get("/posts/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Find the post and populate author with username and email
    const post = await Post.findById(id).populate("author", "username email");

    // Check if post exsits before continueing
    if (!post) {
      return res.status(404).json({
        message: "The post could not be found",
        id,
      });
    }

    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update post route
app.put("/posts/:id", checkAuth, async (req, res) => {
  try {
    const { title, content } = req.body;

    // Validate required fields before querying DB
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const id = req.params.id;
    const post = await Post.findById(id);

    // check if post exsits before proceeding
    if (!post) {
      return res.status(404).json({
        message: "The post could not be found",
        id,
      });
    }

    // Check if the post auther matches the userID
    if (!post.author.equals(req.userId)) {
      return res.status(403).json({
        error: "Not authorized to update this post",
      });
    }

    Object.assign(post, { title, content });
    await post.save();

    res.status(200).json({
      message: "Post successfully updated",
      post,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete Post
app.delete("/posts/:id", checkAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id);

    // Check the post exsits before procceeding
    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    // Check if the user is authorized
    if (!post.author.equals(req.userId)) {
      return res.status(403).json({
        error: "You are not authorized to delete this post",
      });
    }

    await Post.findByIdAndDelete(id);

    res.json({
      message: "post successfully deleted",
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Post comment route
app.post("/posts/:postId/comments", checkAuth, async (req, res) => {
  try {
    const content = req.body.content;

    // Validate required fields before querying DB
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const postId = req.params.postId;
    const post = await Post.findById(postId);

    // Check if post exsits before procceeding
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const newComment = new Comment({
      content,
      author: req.userId,
      post: postId,
    });

    await newComment.save();
    await newComment.populate("author", "username email");

    res.json({
      message: "Comment successfully posted",
      comment: newComment,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get comments under a post
app.get("/posts/:postId/comments", async (req, res) => {
  try {
    const postId = req.params.postId;

    // Pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count
    const totalComments = await Comment.countDocuments({ post: postId });
    const totalPages = Math.ceil(totalComments / limit);

    // Find all comments under that post
    const comments = await Comment.find({ post: postId })
      .limit(limit)
      .skip(skip)
      .populate("author", "username email");

    res.json({
      comments,
      pagination: {
        currentPage: page,
        totalPages,
        totalComments,
        commentsPerPage: limit,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update comment route
app.put("/comments/:id", checkAuth, async (req, res) => {
  try {
    const content = req.body.content;

    // Validate required fields before querying DB
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const id = req.params.id;
    const comment = await Comment.findById(id);

    // Check the comment exsits before procceeding
    if (!comment) {
      return res.status(404).json({
        error: "Comment was not found",
      });
    }

    // Check author
    if (!comment.author.equals(req.userId)) {
      return res.status(403).json({
        error: "User unauthorized",
      });
    }

    comment.content = content;
    await comment.save();

    res.json({
      message: "Comment successfully saved",
      comment,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete Comment Route
app.delete("/comments/:id", checkAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const comment = await Comment.findById(id);

    // Check comment exsits before proceeding
    if (!comment) {
      return res.status(404).json({
        error: "The comment was not found",
      });
    }

    // Check user is authorised
    if (!comment.author.equals(req.userId)) {
      return res.status(403).json({
        error: "User is unauthorised.",
      });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(id);
    res.json({
      message: "Comment successfully deleted",
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

import express from "express";
const router = express.Router();
import Book from "../models/Book.js";
import Comment from "../models/Comment.js";
import verifyToken from "../middleware/verifyToken.js";
import { emitNewComment } from "../socket/comments.js";

router.get("/books", async (req, res) => {
  try {
    const { sort, limit, userId } = req.query;
    let query = {};
    let sortOption = { createdAt: -1 };

    if (userId) query.userId = userId;
    if (sort === "rating") sortOption = { rating: -1, createdAt: -1 };

    const books = await Book.find(query)
      .sort(sortOption)
      .limit(parseInt(limit) || 0);

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: "Error fetching books", error: error.message });
  }
});

router.get("/books/latest", async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 }).limit(6);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: "Error fetching latest books", error: error.message });
  }
});

router.get("/books/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.status(200).json(book);
  } catch (error) {
    res.status(400).json({ message: "Invalid Book ID", error: error.message });
  }
});

router.get("/books/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ bookId: req.params.id }).sort({ createdAt: 1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments", error: error.message });
  }
});

router.post("/books", verifyToken, async (req, res) => {
  const { title, author, description, imageUrl, category, price, rating, userName } = req.body;
  const userId = req.user.uid;

  if (!title || !author || !category || !price || !description || !imageUrl || !userName || !rating) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const newBook = new Book({ title, author, description, imageUrl, category, price, rating, userName, userId });
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    res.status(400).json({ message: "Error creating book", error: error.message });
  }
});

router.put("/books/:id", verifyToken, async (req, res) => {
  const bookId = req.params.id;
  const updateData = req.body;
  const verifiedUserId = req.user.uid;

  delete updateData.userId;
  delete updateData.userName;
  delete updateData.createdAt;
  delete updateData.updatedAt;

  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.userId !== verifiedUserId) {
      return res.status(403).json({ message: "Forbidden. You do not own this book." });
    }

    const updatedBook = await Book.findByIdAndUpdate(bookId, updateData, { new: true, runValidators: true });
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(400).json({ message: "Error updating book", error: error.message });
  }
});

router.delete("/books/:id", verifyToken, async (req, res) => {
  const bookId = req.params.id;
  const verifiedUserId = req.user.uid;

  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.userId !== verifiedUserId) {
      return res.status(403).json({ message: "Forbidden. You do not own this book." });
    }

    await Book.findByIdAndDelete(bookId);
    await Comment.deleteMany({ bookId });

    res.status(200).json({ message: "Book and associated comments deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting book", error: error.message });
  }
});

router.post("/books/:id/comments", verifyToken, async (req, res) => {
  const bookId = req.params.id;
  const { text, userEmail, userName, photoURL } = req.body;

  if (!text || !userEmail || !userName) {
    return res.status(400).json({ message: "Comment text, user email, and user name are required." });
  }

  if (req.user.email !== userEmail) {
    return res.status(403).json({ message: "Forbidden. Token email mismatch." });
  }

  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const newComment = new Comment({
      bookId,
      userEmail,
      userName,
      photoURL: photoURL || req.user.picture,
      text,
    });

    const savedComment = await newComment.save();
    emitNewComment(bookId, savedComment);
    res.status(201).json(savedComment);
  } catch (error) {
    res.status(400).json({ message: "Error adding comment", error: error.message });
  }
});

export default router;

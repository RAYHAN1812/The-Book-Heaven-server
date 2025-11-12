import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Fiction', 'Non-Fiction', 'Science', 'Fantasy', 'Mystery', 'Biography', 'Other'] 
  },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  rating: { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });

const Book = mongoose.model('Book', bookSchema);

export default Book;

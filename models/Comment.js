import mongoose from 'mongoose';
const { Schema } = mongoose;

const commentSchema = new Schema({
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    photoURL: { 
        type: String, 
        default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' 
    },
    text: { type: String, required: true, trim: true },
}, {
    timestamps: true
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;

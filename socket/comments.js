let ioInstance;

export const commentSocketHandler = (io) => {
    ioInstance = io;

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('joinBookRoom', (bookId) => {
            socket.join(bookId);
            console.log(`Socket ${socket.id} joined room: ${bookId}`);
        });

        socket.on('leaveBookRoom', (bookId) => {
            socket.leave(bookId);
            console.log(`Socket ${socket.id} left room: ${bookId}`);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};

export const emitNewComment = (bookId, comment) => {
    if (ioInstance) {
        ioInstance.to(bookId.toString()).emit('newComment', comment);
        console.log(`Emitted new comment to room: ${bookId}`);
    }
};

export default commentSocketHandler;
import { app, startServer } from './common';

startServer().catch(error => {
    console.error('Failed to start the server:', error);
});

// Listen to the server if not in production environment
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

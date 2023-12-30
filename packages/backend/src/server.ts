import app from './common';

const PORT = process.env.PORT || 4000;

// Start the local server for development purposes
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

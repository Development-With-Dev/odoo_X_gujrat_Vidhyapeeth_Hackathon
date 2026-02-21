import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error(
                'Missing MONGODB_URI. Provide a MongoDB connection string with credentials, e.g. mongodb+srv://<user>:<password>@<host>/<db>?retryWrites=true&w=majority'
            );
        }
        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (err) {
        try {
            const raw = process.env.MONGODB_URI || '';
            const parsed = raw ? new URL(raw) : null;
            const user = parsed?.username ? decodeURIComponent(parsed.username) : 'unknown';
            const host = parsed?.host || 'unknown-host';
            if (err?.code === 18 || /auth/i.test(err.message)) {
                console.error(`❌ MongoDB authentication failed for user "${user}" on ${host}. Check username/password in MONGODB_URI.`);
            } else {
                console.error('❌ MongoDB connection error:', err.message);
            }
        } catch {
            console.error('❌ MongoDB connection error:', err.message);
        }
        process.exit(1);
    }
};

export default connectDB;

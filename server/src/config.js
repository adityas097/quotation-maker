require('dotenv').config();

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey_myapp_2025_secure',
    PORT: process.env.PORT || 3000
};

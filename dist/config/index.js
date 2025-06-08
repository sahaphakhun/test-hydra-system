"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_CONFIG = exports.SERVER_CONFIG = void 0;
exports.SERVER_CONFIG = {
    PORT: process.env.PORT || 3001,
    HOST: process.env.HOST || 'localhost',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
exports.DB_CONFIG = {
    MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017/line-automation',
};

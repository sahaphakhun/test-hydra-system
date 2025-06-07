"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const baseURL = process.env.NEXT_PUBLIC_API_URL;
if (!baseURL) {
    console.warn('NEXT_PUBLIC_API_URL is not defined, axios will use relative URLs');
}
const api = axios_1.default.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});
exports.default = api;

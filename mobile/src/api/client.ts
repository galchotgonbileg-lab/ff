import axios from "axios";
import { secureStorage } from "../lib/secureStorage";
import { API_BASE_URL } from "./config";

export const TOKEN_KEY = "ff_auth_token";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

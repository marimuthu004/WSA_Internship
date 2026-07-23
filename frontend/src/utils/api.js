//centeralized API setup

import axios from "axios";
import qs from "qs";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
});

export default api;

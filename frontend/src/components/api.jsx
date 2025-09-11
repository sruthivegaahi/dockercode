import axios from "axios";

const api = axios.create({
//  baseURL: "/", // 
 baseURL: "http://localhost:8100/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",   
    Accept: "application/json",
  },
});

export default api;

import axios from 'axios';

export default axios.create({
  baseURL: 'http://localhost:4001',
  withCredentials: true   // <-- send the HTTP‐only cookie
});
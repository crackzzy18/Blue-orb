export const ADMIN_CREDENTIALS = {
  username: 'kehnmarv',
  password: '#Dronestech2021'
};

export const createAuthHeader = (username, password) => {
  return 'Basic ' + btoa(`${username}:${password}`);
};

export const getStoredAuth = () => {
  return sessionStorage.getItem('adminAuth');
};

export const setStoredAuth = (authHeader) => {
  sessionStorage.setItem('adminAuth', authHeader);
};

export const clearStoredAuth = () => {
  sessionStorage.removeItem('adminAuth');
};

export const validateAuth = (username, password) => {
  return username === ADMIN_CREDENTIALS.username &&
         password === ADMIN_CREDENTIALS.password;
};

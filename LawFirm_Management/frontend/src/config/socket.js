export const getSocketServerUrl = () => {
    if (process.env.REACT_APP_SOCKET_URL) {
      return process.env.REACT_APP_SOCKET_URL;
    }
    
    const hostname = window.location.hostname;
    const port = 9000;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${port}`;
    }
    
    return `http://${hostname}:${port}`;
  };
export const getBackendUrl = (): string => {
  const envUrl = (import.meta as any).env.VITE_WS_URL;
  const hostname = window.location.hostname;
  
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1') {
    return `http://${hostname}:8082`;
  }
  
  return envUrl || 'http://localhost:8082';
};

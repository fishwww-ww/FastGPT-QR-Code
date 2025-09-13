import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://hrdqrlsmwrcz.sealosbja.site',
});

export const createQRCode = (payload: { codes: string[]; url: string }) => {
  return instance.post('/api/couponCode', payload);
};

export const getQRCode = () => {
  return instance.get('/api/qrCode');
};

export const markCodeUsed = (code: string) => {
  return instance.post('/api/couponCode/use', { code });
};

export const deleteQRCode = () => {
  return instance.delete('/api/qrCode/delete');
};
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://hrdqrlsmwrcz.sealosbja.site',
});

export const createQRCode = (couponCode: string[]) => {
  return instance.post('/api/couponCode', { couponCode });
};

export const getQRCode = () => {
  return instance.get('/api/qrCode');
};
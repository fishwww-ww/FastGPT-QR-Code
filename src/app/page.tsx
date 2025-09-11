'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Typography, Space, Spin, Empty, Image } from '@douyinfe/semi-ui';
import { useRouter } from 'next/navigation';
import { getQRCode } from './api/request';

const { Title, Text } = Typography;

interface QRCodeData {
  id: string;
  code: string;
  qrCode: string;
  redirectUrl: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCodes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getQRCode();
      if (response.data.success) {
        setQrCodes(response.data.data);
      } else {
        setError('获取二维码数据失败');
      }
    } catch (err) {
      setError('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const availableCount = qrCodes.filter(qr => !qr.isUsed).length;
  const totalCount = qrCodes.length;
  const currentQR = qrCodes[currentIndex];

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < qrCodes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title heading={2} className="text-gray-800 mb-2">
                FastGPT QR Code
              </Title>
              <Text type="secondary">
                管理兑换码二维码，查看使用状态
              </Text>
            </div>
            <Space>
              <Button 
                type="primary" 
                theme="solid"
                onClick={() => router.push('/import')}
              >
                导入兑换码
              </Button>
              <Button 
                type="tertiary"
                onClick={fetchQRCodes}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </div>
        </div>


        {/* 单个二维码展示 */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <Title heading={4}>二维码展示</Title>
            <Text type="tertiary">
              {totalCount > 0 ? `${currentIndex + 1} / ${totalCount}` : '0 / 0'}
            </Text>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spin size="large" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">⚠️ {error}</div>
              <Button onClick={fetchQRCodes}>重试</Button>
            </div>
          ) : qrCodes.length === 0 ? (
            <Empty 
              title="暂无二维码数据"
              description="点击导入按钮添加兑换码"
            />
          ) : (
            <div className="text-center">
              {/* 二维码卡片 */}
              <Card 
                className={`inline-block border-2 ${
                  currentQR.isUsed 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="p-6">
                  {/* 二维码图片 */}
                  <div className="mb-4">
                    <Image
                      src={currentQR.qrCode}
                      alt={`QR Code for ${currentQR.code}`}
                      width={200}
                      height={200}
                      className="mx-auto rounded shadow-lg"
                    />
                  </div>
                  
                  {/* 兑换码信息 */}
                  <div className="mb-3">
                    <Text strong className="text-xl">{currentQR.code}</Text>
                  </div>
                  
                  {/* 状态标签 */}
                  <div className="mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentQR.isUsed 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {currentQR.isUsed ? '已使用' : '可用'}
                    </span>
                  </div>
                  
                  {/* 使用时间 */}
                  {currentQR.isUsed && currentQR.usedAt && (
                    <div className="text-sm text-gray-500 mb-2">
                      使用时间: {new Date(currentQR.usedAt).toLocaleString()}
                    </div>
                  )}
                  
                  {/* 创建时间 */}
                  <div className="text-sm text-gray-400">
                    创建时间: {new Date(currentQR.createdAt).toLocaleString()}
                  </div>
                </div>
              </Card>

              {/* 导航按钮 */}
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button 
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  type="tertiary"
                  size="large"
                >
                  ← 上一个
                </Button>
                
                <div className="flex gap-2">
                  {qrCodes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-3 h-3 rounded-full ${
                        index === currentIndex 
                          ? 'bg-blue-500' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
                
                <Button 
                  onClick={goToNext}
                  disabled={currentIndex === qrCodes.length - 1}
                  type="tertiary"
                  size="large"
                >
                  下一个 →
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

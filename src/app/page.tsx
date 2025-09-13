'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Typography, Space, Spin, Empty, Modal } from '@douyinfe/semi-ui';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getQRCode, markCodeUsed, deleteQRCode } from './api/request';

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
  const [switching, setSwitching] = useState(false);
  const [showEndMessage, setShowEndMessage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);


  const fetchQRCodes = async (resetIndex: boolean) => {
    setLoading(true);
    setError(null);
    setShowEndMessage(false); // 重置结束消息状态
    
    try {
      const response = await getQRCode();
      if (response.data.success) {
        const list: QRCodeData[] = response.data.data;
        setQrCodes(list);
        setCurrentIndex((idx) => {
          if (resetIndex) return 0; // 手动刷新从第一个开始
          // 否则维持当前位置，但要夹紧到有效范围（用于"下一个"后移除当前项的场景）
          const max = Math.max(list.length - 1, 0);
          return Math.min(idx, max);
        });
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
    fetchQRCodes(false);
  }, []);

  const totalCount = qrCodes.length;
  const currentQR = qrCodes[currentIndex];

  const goToNext = () => {
    if (currentIndex < qrCodes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNext = async () => {
    if (!currentQR || switching) return;
    setSwitching(true);
    try {
      await markCodeUsed(currentQR.code);
      
      // 如果是最后一个二维码，显示结束消息
      if (currentIndex === qrCodes.length - 1) {
        setShowEndMessage(true);
      } else {
        // 否则正常切换到下一个
        goToNext();
      }
    } catch (e) {
      // 可加提示
    } finally {
      setSwitching(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteQRCode();
      setQrCodes([]);
      setCurrentIndex(0);
      setShowEndMessage(false);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleCopyLink = async () => {
    if (!currentQR) return;
    
    try {
      await navigator.clipboard.writeText(currentQR.redirectUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-y-auto">
      <div className="mx-auto max-w-4xl">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="mt-2">
                <Image src="/fastgpt.svg" alt="FastGPT" width={173} height={48} />
              </div>
            </div>
            <Space>
              <Button 
                type="primary" 
                theme="solid"
                onClick={() => router.push('/import')}
                className="rounded-full px-5 w-16"
              >
                导入
              </Button>
              <Button 
                type="secondary" 
                theme="solid"
                onClick={() => fetchQRCodes(true)}
                loading={loading}
                className="rounded-full px-5 w-16"
              >
                刷新
              </Button>
              <Button 
                onClick={handleDeleteClick}
                type="danger"
                theme="solid"
                className="rounded-full px-5 w-16"
              >
                删除
              </Button>
            </Space>
          </div>
        </div>

        {/* 单个二维码展示 */}
        <div className="w-full min-h-96 flex flex-col">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spin size="large" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">⚠️ {error}</div>
              <Button onClick={() => fetchQRCodes(true)}>重试</Button>
            </div>
          ) : qrCodes.length === 0 ? (
            <Empty 
              title="暂无二维码数据"
              description="点击导入按钮添加兑换码"
            />
          ) : showEndMessage ? (
            <div className="text-center py-20">
              <Title heading={2} className="text-gray-700 mb-4">
                二维码就没有啦，需要的话重新导入吧
              </Title>
              <div className="mt-8">
                <Button 
                  type="primary" 
                  theme="solid"
                  onClick={() => router.push('/import')}
                  className="rounded-full px-6 py-3"
                >
                  重新导入
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {/* 二维码卡片 */}
              <div >
                <div className="p-6 pt-20">
                  {/* 二维码图片 */}
                  <div className="mb-4">
                    <Image
                      src={currentQR.qrCode}
                      alt={`QR Code for ${currentQR.code}`}
                      width={500}
                      height={500}
                      className="mx-auto rounded shadow-lg max-w-full h-auto"
                      style={{ maxWidth: 'min(500px, 90vw)' }}
                    />
                  </div>
                  
                  {/* 跳转链接展示框 */}
                  <div className="mt-6 max-w-lg mx-auto">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      {/* <Text className="text-sm text-gray-600 mb-2 block">跳转链接：</Text> */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <Text 
                            className="text-sm text-blue-600 break-all cursor-pointer hover:text-blue-800 transition-colors"
                            onClick={handleCopyLink}
                            title="点击复制链接"
                          >
                            {currentQR.redirectUrl}
                          </Text>
                        </div>
                        <Button
                          size="small"
                          type="primary"
                          theme="solid"
                          onClick={handleCopyLink}
                          className="flex-shrink-0"
                        >
                          {copySuccess ? '已复制' : '复制'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center">
                <span className="px-3 py-1 rounded-full  text-xl">
                  剩余的二维码数量：{Math.max(totalCount - currentIndex - 1, 0)}
                </span>
              </div>
              <div className="flex justify-center items-center gap-3 mt-5">
                <Button 
                  onClick={handleNext}
                  disabled={switching}
                  type="primary"
                  theme="solid"
                  size="large"
                  className="rounded-full px-5 shadow-sm h-32 w-32 sm:h-48 sm:w-48 md:h-64 md:w-64"
                  loading={switching}
                >
                  {currentIndex === qrCodes.length - 1 ? '这是最后一个了' : '下一个 →'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 删除确认Modal */}
      <Modal
        title="确认删除"
        visible={showDeleteModal}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ loading: deleting, type: 'danger' }}
        cancelButtonProps={{ disabled: deleting }}
        width={400}
        centered
      >
        <div className="py-4">
          <Text className="text-lg">
            确定要删除所有兑换码吗？
          </Text>
          <Text className="text-gray-600 mt-2 block">
            此操作将永久删除数据库中的所有二维码数据，无法恢复。
          </Text>
        </div>
      </Modal>
    </div>
  );
}

'use client';

import { Button, TextArea, Typography, Space, Card, Toast } from '@douyinfe/semi-ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const { Title, Text } = Typography;

export default function Import() {
  const router = useRouter();
  const [codes, setCodes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!codes.trim()) {
      Toast.warning('请输入兑换码');
      return;
    }
    
    setLoading(true);
    try {
      // 将文本按行分割成数组
      const codesArray = codes.split('\n').filter(line => line.trim());
      
      const response = await fetch('/api/couponCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(codesArray),
      });

      const result = await response.json();

      if (result.success) {
        Toast.success(result.message);
        setCodes(''); // 清空输入框
        router.push('/');
      } else {
        Toast.error(result.error || '导入失败');
      }
    } catch (error) {
      console.error('导入失败:', error);
      Toast.error('导入失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto p-8 bg-[#E5E9F6]">
        <div className="mb-6">
          <Button 
            type="primary" 
            theme="solid"
            // icon="arrow-left"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            返回
          </Button>
          <Title heading={3} className="text-gray-800 mb-2">
            导入
          </Title>
          <Text type="secondary" className="text-sm">
            批量导入兑换码，每行一个
          </Text>
        </div>
        <div>
          <TextArea
            value={codes}
            onChange={setCodes}
            placeholder="请输入兑换码，每行一个&#10;例如：&#10;VIP123456&#10;DISCOUNT789&#10;GENERAL000"
            rows={12}
            className="w-full h-100"
            style={{ 
              resize: 'none',
              fontSize: '16px',
              lineHeight: '1.6',
              minHeight: '200px'
            }}
          />
          <Text type="tertiary" className="text-xs mt-2 block">
            已输入 {codes.split('\n').filter(line => line.trim()).length} 个兑换码
          </Text>
        </div>

        <div className="pt-2">
          <Button
            type="primary"
            theme="solid"
            size="large"
            loading={loading}
            onClick={handleImport}
            className="w-full h-12 text-base font-medium"
            disabled={!codes.trim()}
          >
            {loading ? '导入中...' : '开始导入'}
          </Button>
        </div>
      </div>
    </div>
  );
}
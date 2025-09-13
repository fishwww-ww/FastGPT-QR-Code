'use client';

import { Button, TextArea, Typography, Card, Input } from '@douyinfe/semi-ui';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { createQRCode } from '../api/request';

const { Text } = Typography;

type ToastKind = 'success' | 'error' | 'warning';

export default function Import() {
  const router = useRouter();
  const [codes, setCodes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastKind, setToastKind] = useState<ToastKind>('success');
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [url, setUrl] = useState<string>("https://cloud.fastgpt.cn");

  const showToast = (msg: string, kind: ToastKind = 'success') => {
    setToastMsg(msg);
    setToastKind(kind);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2000);
  };

  const handleImport = async () => {
    if (!url.trim()) {
      showToast('请输入跳转地址', 'warning');
      return;
    }
    if (!codes.trim()) {
      showToast('请输入兑换码', 'warning');
      return;
    }
    
    // 在这里清洗：去括号、引号，按换行或逗号切分，去空格与末尾逗号
    const codesArray = codes
      .replace(/[\[\]"]+/g, '')
      .split(/[\n,]+/)
      .map(v => v.trim().replace(/,+$/, ''))
      .filter(Boolean);

    if (codesArray.length === 0) {
      showToast('未检测到有效兑换码', 'warning');
      return;
    }

    setLoading(true);
    try {
      // 发送 { codes, url } 给后端
      const response = await createQRCode({ codes: codesArray, url: url.trim() });
      const result = response.data;

      if (result.success) {
        setCodes('');
        showToast(result.message || '导入成功', 'success');
      } else {
        showToast(result.error || '导入失败', 'error');
      }
    } catch (error) {
      console.error('导入失败:', error);
      showToast('导入失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const kindStyles = {
    success: {
      wrap: 'bg-white/90 border-green-400 text-green-800',
      icon: '✅',
    },
    error: {
      wrap: 'bg-white/90 border-red-400 text-red-800',
      icon: '❌',
    },
    warning: {
      wrap: 'bg-white/90 border-amber-400 text-amber-800',
      icon: '⚠️',
    },
  } as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-lg mx-auto pt-8">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="mt-2">
                <Image src="/fastgpt.svg" alt="FastGPT" width={173} height={48} />
              </div>
            </div>
            <Button 
              type="primary"
              theme="solid"
              onClick={() => router.push('/')}
              className="rounded-full px-4"
            >
              返回首页
            </Button>
          </div>
        </div>

        {/* 表单卡片 */}
        <Card className="shadow-lg border-0">
          <div className="p-5">
            <div className="mb-3">
              <Text strong className="block mb-2 text-gray-700 ">
                跳转地址
              </Text>
              <Input value={url} onChange={(value: string) => setUrl(value)} placeholder="输入地址,如: https://cloud.fastgpt.cn" />
            </div>
            <div className="mb-3">
              <Text strong className="block mb-2 text-gray-700 ">
                兑换码
              </Text>
              <TextArea
                value={codes}
                onChange={(value) => setCodes(value)}
                placeholder={
                  '请输入兑换码，以字符串数组格式输入,如：\n[\n    "aaaaaa",\n    "bbbbbb",\n    "cccccc"\n]'
                }
                rows={24}
                className="w-full"
                style={{ 
                  resize: 'none',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  minHeight: '400px'
                }}
              />
            </div>

            <div className="mt-8">
              <Button
                type="primary"
                theme="solid"
                size="large"
                loading={loading}
                onClick={handleImport}
                className="w-full h-12 text-base font-medium rounded-full shadow-sm"
                disabled={!codes.trim() || !url.trim()}
              >
                {loading ? '导入中...' : '开始导入'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* 漂亮的 Toast 提示 */}
      <div className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-50 transition-all duration-300 ${
        toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-xl backdrop-blur-sm border ${kindStyles[toastKind].wrap}`}>
          <span className="text-base">{kindStyles[toastKind].icon}</span>
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      </div>
    </div>
  );
}
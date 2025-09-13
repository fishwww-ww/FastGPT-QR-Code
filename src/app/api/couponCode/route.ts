import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CouponCode from '@/lib/models/couponCode';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    // 读取请求体：期望 { codes: string[], url: string }
    const body = await req.json();

    // 类型校验
    if (
      !body ||
      !Array.isArray(body.codes) ||
      !body.codes.every((v: unknown) => typeof v === 'string') ||
      typeof body.url !== 'string' ||
      !body.url.trim()
    ) {
      return NextResponse.json(
        { success: false, message: '参数错误：应为 { codes: string[], url: string }，且两者都不能为空' },
        { status: 400 }
      );
    }

    const codes: string[] = body.codes;
    const baseUrl: string = body.url.trim();

    if (codes.length === 0) {
      return NextResponse.json(
        { success: false, message: '兑换码数组不能为空' },
        { status: 400 }
      );
    }

    // 确保所有兑换码都是字符串类型，去除可能的引号
    const cleanCodes = codes.map(code => String(code).replace(/^["']|["']$/g, ''));

    // 使用Fisher-Yates洗牌算法进行随机排序
    const shuffledCodes = [...cleanCodes];
    for (let i = shuffledCodes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCodes[i], shuffledCodes[j]] = [shuffledCodes[j], shuffledCodes[i]];
    }

    await connectToDatabase();

    // 生成二维码与重定向地址
    const couponCodesWithQR = await Promise.all(
      shuffledCodes.map(async (code) => {
        const trimmedCode = code.trim();
        // 拼接重定向地址（兼容已有查询参数）
        const sep = baseUrl.includes('?') ? '&' : '?';
        const fullRedirectUrl = `${baseUrl}${sep}couponCode=${encodeURIComponent(trimmedCode)}`;

        const qrCodeDataURL = await QRCode.toDataURL(fullRedirectUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        return {
          code: trimmedCode,
          isUsed: false,
          qrCode: qrCodeDataURL,
          redirectUrl: fullRedirectUrl,
        };
      })
    );

    // 批量插入（仍允许部分重复时不中断）
    const result = await CouponCode.insertMany(couponCodesWithQR, {
      ordered: false,
    });

    return NextResponse.json({
      success: true,
      message: `成功导入 ${result.length} 个兑换码并生成二维码（已随机排序）`,
      data: {
        total: codes.length,
        inserted: result.length,
        coupons: result.map((item) => ({
          code: item.code,
          qrCode: item.qrCode,
          redirectUrl: item.redirectUrl,
        })),
      },
    });
  } catch (error: any) {
    console.error('导入兑换码失败:', error);

    return NextResponse.json(
      { success: false, message: '导入兑换码失败' },
      { status: 500 }
    );
  }
}

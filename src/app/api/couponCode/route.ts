import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CouponCode from '@/lib/models/couponCode';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {

    const RedictUrl = "https://www.baidu.com"

    
    // 从请求体中获取兑换码数据
    const requestData = await req.json();
    
    // 连接数据库
    await connectToDatabase();

    console.log('接收到的数据:', requestData);
    
    // 处理不同的数据格式
    let couponCode: string[];
    if (Array.isArray(requestData)) {
      // 直接数组格式
      couponCode = requestData;
    } else if (requestData && Array.isArray(requestData.codes)) {
      // 对象格式 { codes: [...] }
      couponCode = requestData.codes;
    } else {
      return NextResponse.json(
        { success: false, message: '兑换码数据格式错误，应为字符串数组或包含codes字段的对象' },
        { status: 400 }
      );
    }
    
    // 验证输入数据
    if (!Array.isArray(couponCode) || couponCode.length === 0) {
      return NextResponse.json(
        { success: false, message: '兑换码数据格式错误，应为非空字符串数组' },
        { status: 400 }
      );
    }
    
    // 过滤空字符串和重复的兑换码
    const validCodes = [...new Set(couponCode.filter(code => code && code.trim()))];
    
    if (validCodes.length === 0) {
      return NextResponse.json(
        { success: false, message: '没有有效的兑换码' },
        { status: 400 }
      );
    }
    
    // 为每个兑换码生成二维码
    const couponCodesWithQR = await Promise.all(
      validCodes.map(async (code) => {
        const trimmedCode = code.trim();
        // 构建重定向URL，包含兑换码参数
        const fullRedirectUrl = `${RedictUrl}?couponCode=${encodeURIComponent(trimmedCode)}`;
        
        // 生成二维码
        const qrCodeDataURL = await QRCode.toDataURL(fullRedirectUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        return {
          code: trimmedCode,
          isUsed: false,
          qrCode: qrCodeDataURL,
          redirectUrl: fullRedirectUrl
        };
      })
    );
    
    // 批量插入兑换码和二维码
    const result = await CouponCode.insertMany(couponCodesWithQR, {
      ordered: false // 允许部分插入成功，即使有重复的兑换码
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `成功导入 ${result.length} 个兑换码并生成二维码`,
      data: {
        total: validCodes.length,
        inserted: result.length,
        coupons: result.map(item => ({
          code: item.code,
          qrCode: item.qrCode,
          redirectUrl: item.redirectUrl
        }))
      }
    });
  } catch (error: any) {
    console.error('导入兑换码失败:', error);
    
    // 处理重复兑换码错误
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: '部分兑换码已存在，请检查重复项' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: '导入兑换码失败' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CouponCode from '@/lib/models/couponCode';

export async function GET(req: NextRequest) {
  try {
    // 连接数据库
    await connectToDatabase();
    
    // 从数据库获取所有兑换码和二维码数据
    const coupons = await CouponCode.find({}).sort({ createdAt: -1 });
    
    // 提取二维码相关数据
    const qrCodes = coupons.map(coupon => ({
      id: coupon._id,
      code: coupon.code,
      qrCode: coupon.qrCode,
      redirectUrl: coupon.redirectUrl,
      isUsed: coupon.isUsed,
      usedAt: coupon.usedAt,
      createdAt: coupon.createdAt
    }));
    
    return NextResponse.json({ 
      success: true, 
      message: `成功获取 ${qrCodes.length} 个二维码`,
      data: qrCodes
    });
  } catch (error) {
    console.error('获取二维码数据失败:', error);
    return NextResponse.json(
      { success: false, message: '获取二维码数据失败' },
      { status: 500 }
    );
  }
}
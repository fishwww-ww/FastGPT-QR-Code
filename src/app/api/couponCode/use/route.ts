import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CouponCode from '@/lib/models/couponCode';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const code = typeof body === 'string' ? body : body?.code;
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: '缺少有效的 code 字段' },
        { status: 400 }
      );
    }

    const result = await CouponCode.updateOne(
      { code: code.trim(), isUsed: false },
      { $set: { isUsed: true, usedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: '未找到未使用的对应兑换码或已被使用' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: '标记为已使用成功' });
  } catch (error) {
    console.error('标记兑换码为已使用失败:', error);
    return NextResponse.json(
      { success: false, message: '标记兑换码失败' },
      { status: 500 }
    );
  }
}

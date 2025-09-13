import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CouponCode from '@/lib/models/couponCode';

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const result = await CouponCode.deleteMany({});
    return NextResponse.json({ 
      success: true, 
      message: `成功删除 ${result.deletedCount} 个二维码` 
    });
  } catch (error) {
    console.error('删除二维码失败:', error);
    return NextResponse.json(
      { success: false, message: '删除失败' },
      { status: 500 }
    );
  }
}
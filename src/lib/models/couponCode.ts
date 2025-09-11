import mongoose, { Schema, Document } from 'mongoose';

// 定义兑换码接口
export interface ICouponCode extends Document {
  code: string;
  isUsed: boolean;
  usedAt?: Date;
  qrCode: string; // 二维码数据URL
  redirectUrl: string; // 重定向URL
  createdAt: Date;
  updatedAt: Date;
}

// 定义兑换码Schema
const CouponCodeSchema: Schema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date,
    default: null
  },
  qrCode: {
    type: String,
    required: true
  },
  redirectUrl: {
    type: String,
    required: true
  }
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt
});

// 创建模型
const CouponCode = mongoose.models.CouponCode || mongoose.model<ICouponCode>('CouponCode', CouponCodeSchema);

export default CouponCode;

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ unique: true, sparse: true })
  phone?: string;

  @Prop({ required: true })
  password_hash!: string;

  @Prop({
    type: [String],
    enum: ['customer', 'photographer', 'admin'],
    default: ['customer'],
  })
  roles!: string[];

  @Prop({
    enum: ['active', 'suspended', 'pending_verification'],
    default: 'pending_verification',
  })
  status!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

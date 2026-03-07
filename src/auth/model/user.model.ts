import { prop, getModelForClass, modelOptions, index } from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

@modelOptions({
  schemaOptions: {
    collection: 'users',
    timestamps: true,
  },
})
@index({ email: 1 }, { unique: true })
export class User extends TimeStamps {
  @prop({ required: true})
  name!: string;

  @prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @prop({ required: true })
  passwordHash!: string;

  @prop({ required: true, default: true })
  isActive!: boolean;

  @prop({ type: String, default: null })
  refreshTokenHash?: string | null;

  @prop({ type: Date, default: null })
  refreshTokenExpiresAt?: Date | null;
}

export const UserModel = getModelForClass(User);


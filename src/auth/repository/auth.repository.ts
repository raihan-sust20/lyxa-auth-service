import { Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import type {  ReturnModelType } from '@typegoose/typegoose';
import { User } from '../model/user.model';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(User)
    private readonly userModel: ReturnModelType<typeof User>,
  ) {}

  async createUser(email: string, passwordHash: string): Promise<User> {
    const user = new this.userModel({ email, passwordHash });
    return user.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string | null,
    refreshTokenExpiresAt: Date | null,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { refreshTokenHash, refreshTokenExpiresAt })
      .exec();
  }

  async setUserActive(userId: string, isActive: boolean): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { isActive }).exec();
  }
}

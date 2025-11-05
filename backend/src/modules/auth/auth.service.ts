import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { UserSettings } from '../../entities/user-settings.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSettings)
    private userSettingsRepository: Repository<UserSettings>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      emailVerified: false, // Will be verified later
    });

    const savedUser = await this.userRepository.save(user);

    // Create default settings
    const settings = this.userSettingsRepository.create({
      userId: savedUser.id,
    });
    await this.userSettingsRepository.save(settings);

    // Create audit log
    await this.createAuditLog(
      savedUser.id,
      AuditAction.REGISTER,
      ipAddress,
      userAgent,
      'users',
      savedUser.id,
    );

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    return {
      user: savedUser,
      tokens,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    // Find user
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Create audit log
    await this.createAuditLog(user.id, AuditAction.LOGIN, ipAddress, userAgent, 'users', user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user,
      tokens,
    };
  }

  async refreshToken(user: User): Promise<AuthTokens> {
    return this.generateTokens(user);
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    // Create audit log
    await this.createAuditLog(userId, AuditAction.LOGOUT, ipAddress, userAgent, 'users', userId);

    // In a production app, you would also invalidate the refresh token
    // by storing it in a blacklist or removing it from a whitelist
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    user.passwordHash = newPasswordHash;
    await this.userRepository.save(user);

    // Create audit log
    await this.createAuditLog(
      userId,
      AuditAction.PASSWORD_CHANGE,
      ipAddress,
      userAgent,
      'users',
      userId,
    );
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['settings'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already in use
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }

      user.email = dto.email.toLowerCase();
      user.emailVerified = false; // Need to re-verify new email
    }

    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }

    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }

    return this.userRepository.save(user);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    // Don't reveal if user exists or not
    if (!user) {
      return;
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'password-reset' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      },
    );

    // TODO: Send email with reset token
    // For now, we'll just log it (in production, send via email service)
    console.log(`Password reset token for ${user.email}: ${resetToken}`);
    console.log(`Reset URL: http://localhost:3000/reset-password?token=${resetToken}`);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    try {
      // Verify token
      const payload = await this.jwtService.verifyAsync(dto.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Invalid token type');
      }

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

      // Update password
      user.passwordHash = newPasswordHash;
      await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    try {
      // Verify token
      const payload = await this.jwtService.verifyAsync(dto.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'email-verification') {
        throw new BadRequestException('Invalid token type');
      }

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Mark email as verified
      user.emailVerified = true;
      await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate verification token (valid for 24 hours)
    const verificationToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'email-verification' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '24h',
      },
    );

    // TODO: Send email with verification token
    // For now, we'll just log it (in production, send via email service)
    console.log(`Email verification token for ${user.email}: ${verificationToken}`);
    console.log(`Verification URL: http://localhost:3000/verify-email?token=${verificationToken}`);
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async createAuditLog(
    userId: string,
    action: AuditAction,
    ipAddress?: string,
    userAgent?: string,
    resourceType?: string,
    resourceId?: string,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
    });

    await this.auditLogRepository.save(auditLog);
  }
}

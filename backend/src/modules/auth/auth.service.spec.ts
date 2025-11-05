import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { UserSettings } from '../../entities/user-settings.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let userSettingsRepository: Repository<UserSettings>;
  let auditLogRepository: Repository<AuditLog>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    passwordHash: '$2b$10$mockHashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserSettingsRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserSettings),
          useValue: mockUserSettingsRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userSettingsRepository = module.get<Repository<UserSettings>>(
      getRepositoryToken(UserSettings),
    );
    auditLogRepository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Test123456',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockUserSettingsRepository.create.mockReturnValue({});
      mockUserSettingsRepository.save.mockResolvedValue({});
      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});
      mockJwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email.toLowerCase() },
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockUserSettingsRepository.save).toHaveBeenCalled();
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Test123456',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email.toLowerCase() },
      });
    });

    it('should hash password before saving', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Test123456',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockImplementation((user) => {
        expect(user.passwordHash).toBeDefined();
        expect(user.passwordHash).not.toBe(registerDto.password);
        return Promise.resolve(mockUser);
      });
      mockUserSettingsRepository.create.mockReturnValue({});
      mockUserSettingsRepository.save.mockResolvedValue({});
      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});
      mockJwtService.signAsync.mockResolvedValue('token');

      await service.register(registerDto);

      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Test123456',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const userWithHashedPassword = { ...mockUser, passwordHash: hashedPassword };

      mockUserRepository.findOne.mockResolvedValue(userWithHashedPassword);
      mockUserRepository.save.mockResolvedValue(userWithHashedPassword);
      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});
      mockJwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens.accessToken).toBe('access-token');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email.toLowerCase() },
      });
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      const loginDto = {
        email: 'wrong@example.com',
        password: 'Test123456',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const hashedPassword = await bcrypt.hash('Test123456', 10);
      const userWithHashedPassword = { ...mockUser, passwordHash: hashedPassword };

      mockUserRepository.findOne.mockResolvedValue(userWithHashedPassword);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Test123456',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const inactiveUser = { ...mockUser, passwordHash: hashedPassword, isActive: false };

      mockUserRepository.findOne.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should update lastLoginAt timestamp', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Test123456',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const userWithHashedPassword = { ...mockUser, passwordHash: hashedPassword };

      mockUserRepository.findOne.mockResolvedValue(userWithHashedPassword);
      mockUserRepository.save.mockImplementation((user) => {
        expect(user.lastLoginAt).toBeInstanceOf(Date);
        return Promise.resolve(user);
      });
      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});
      mockJwtService.signAsync.mockResolvedValue('token');

      await service.login(loginDto);

      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should successfully change password with valid current password', async () => {
      const userId = 'test-user-id';
      const changePasswordDto = {
        currentPassword: 'Test123456',
        newPassword: 'NewPassword123',
      };

      const hashedPassword = await bcrypt.hash(changePasswordDto.currentPassword, 10);
      const userWithHashedPassword = { ...mockUser, passwordHash: hashedPassword };

      mockUserRepository.findOne.mockResolvedValue(userWithHashedPassword);
      mockUserRepository.save.mockResolvedValue(userWithHashedPassword);
      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});

      await service.changePassword(userId, changePasswordDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with incorrect current password', async () => {
      const userId = 'test-user-id';
      const changePasswordDto = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123',
      };

      const hashedPassword = await bcrypt.hash('Test123456', 10);
      const userWithHashedPassword = { ...mockUser, passwordHash: hashedPassword };

      mockUserRepository.findOne.mockResolvedValue(userWithHashedPassword);

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-id';
      const changePasswordDto = {
        currentPassword: 'Test123456',
        newPassword: 'NewPassword123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userId = 'test-user-id';

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['settings'],
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-id';

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const userId = 'test-user-id';
      const updateDto = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.updateProfile(userId, updateDto);

      expect(result.firstName).toBe(updateDto.firstName);
      expect(result.lastName).toBe(updateDto.lastName);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if new email already exists', async () => {
      const userId = 'test-user-id';
      const updateDto = {
        email: 'existing@example.com',
      };

      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ id: 'other-user-id', email: 'existing@example.com' });

      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-id';
      const updateDto = { firstName: 'Jane' };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens', async () => {
      mockJwtService.signAsync.mockResolvedValueOnce('new-access-token').mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshToken(mockUser as unknown as User);

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('logout', () => {
    it('should create audit log on logout', async () => {
      const userId = 'test-user-id';

      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});

      await service.logout(userId);

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          action: AuditAction.LOGOUT,
        }),
      );
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
    });
  });
});


import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same global pipes as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clean up test data
    if (dataSource) {
      await dataSource.query('DELETE FROM audit_logs');
      await dataSource.query('DELETE FROM user_settings');
      await dataSource.query('DELETE FROM users');
    }
    await app.close();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'e2etest@example.com',
          password: 'Test123456',
          firstName: 'E2E',
          lastName: 'Test',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data).toHaveProperty('tokens');
          expect(res.body.data.user.email).toBe('e2etest@example.com');
          expect(res.body.data.user.firstName).toBe('E2E');
          expect(res.body.data.user.lastName).toBe('Test');
          expect(res.body.data.tokens).toHaveProperty('accessToken');
          expect(res.body.data.tokens).toHaveProperty('refreshToken');

          // Save for later tests
          accessToken = res.body.data.tokens.accessToken;
          refreshToken = res.body.data.tokens.refreshToken;
        });
    });

    it('should fail with weak password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'weak',
          firstName: 'Test',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBeDefined();
        });
    });

    it('should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'e2etest@example.com',
          password: 'Test123456',
          firstName: 'Duplicate',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.message).toContain('already exists');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123456',
          firstName: 'Test',
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'e2etest@example.com',
          password: 'Test123456',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data).toHaveProperty('tokens');
          expect(res.body.data.user.email).toBe('e2etest@example.com');

          // Update tokens
          accessToken = res.body.data.tokens.accessToken;
          refreshToken = res.body.data.tokens.refreshToken;
        });
    });

    it('should fail with incorrect password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'e2etest@example.com',
          password: 'WrongPassword123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.message).toContain('Invalid credentials');
        });
    });

    it('should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123456',
        })
        .expect(401);
    });

    it('should fail with missing credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'e2etest@example.com',
        })
        .expect(400);
    });
  });

  describe('/api/auth/me (GET)', () => {
    it('should get current user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.email).toBe('e2etest@example.com');
          expect(res.body.data.firstName).toBe('E2E');
          expect(res.body.data).not.toHaveProperty('passwordHash');
        });
    });

    it('should fail without authorization token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/api/auth/me (PATCH)', () => {
    it('should update user profile successfully', () => {
      return request(app.getHttpServer())
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.firstName).toBe('Updated');
          expect(res.body.data.lastName).toBe('Name');
        });
    });

    it('should fail without authorization', () => {
      return request(app.getHttpServer())
        .patch('/api/auth/me')
        .send({
          firstName: 'Updated',
        })
        .expect(401);
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('/api/auth/change-password (POST)', () => {
    it('should change password successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Test123456',
          newPassword: 'NewPassword123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toContain('Password changed successfully');
        });
    });

    it('should login with new password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'e2etest@example.com',
          password: 'NewPassword123',
        })
        .expect(200)
        .expect((res) => {
          // Update token after password change
          accessToken = res.body.data.tokens.accessToken;
        });
    });

    it('should fail with incorrect current password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'AnotherPassword123',
        })
        .expect(401);
    });

    it('should fail with weak new password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'NewPassword123',
          newPassword: 'weak',
        })
        .expect(400);
    });
  });

  describe('/api/auth/refresh (POST)', () => {
    it('should refresh tokens successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');
          expect(res.body.data.accessToken).toBeDefined();
          expect(res.body.data.refreshToken).toBeDefined();
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);
    });

    it('should fail without refresh token', () => {
      return request(app.getHttpServer()).post('/api/auth/refresh').send({}).expect(400);
    });
  });

  describe('/api/auth/logout (POST)', () => {
    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toContain('Logged out successfully');
        });
    });

    it('should fail without authorization', () => {
      return request(app.getHttpServer()).post('/api/auth/logout').expect(401);
    });
  });

  describe('/api/auth/forgot-password (POST)', () => {
    it('should request password reset successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'e2etest@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toBeDefined();
        });
    });

    it('should not reveal if email exists', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full registration -> login -> profile update -> logout flow', async () => {
      const uniqueEmail = `flow-test-${Date.now()}@example.com`;

      // Step 1: Register
      const registerRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: 'FlowTest123',
          firstName: 'Flow',
          lastName: 'Test',
        })
        .expect(201);

      expect(registerRes.body.success).toBe(true);
      const flowAccessToken = registerRes.body.data.tokens.accessToken;

      // Step 2: Get Profile
      const profileRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${flowAccessToken}`)
        .expect(200);

      expect(profileRes.body.data.email).toBe(uniqueEmail);

      // Step 3: Update Profile
      const updateRes = await request(app.getHttpServer())
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${flowAccessToken}`)
        .send({
          firstName: 'Updated Flow',
        })
        .expect(200);

      expect(updateRes.body.data.firstName).toBe('Updated Flow');

      // Step 4: Logout
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${flowAccessToken}`)
        .expect(200);

      // Step 5: Login Again
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: 'FlowTest123',
        })
        .expect(200);

      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.tokens).toHaveProperty('accessToken');
    });
  });
});

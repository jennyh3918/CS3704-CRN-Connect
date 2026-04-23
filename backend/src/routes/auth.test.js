const express = require('express');
const request = require('supertest');

const mockUser = {
	id: 'user-1',
	email: 'hokie@vt.edu',
	user_metadata: {
		full_name: 'Hokie Bird',
		avatar_url: 'https://example.com/avatar.png'
	}
};

jest.mock('../lib/prisma', () => ({
	user: {
		upsert: jest.fn()
	}
}));

jest.mock('../middleware/auth', () => (req, res, next) => {
	req.user = mockUser;
	next();
});

const prisma = require('../lib/prisma');
const authRouter = require('./auth');

function createApp() {
	const app = express();
	app.use(express.json());
	app.use('/api/auth', authRouter);
	return app;
}

describe('auth routes', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUser.id = 'user-1';
		mockUser.email = 'hokie@vt.edu';
		mockUser.user_metadata = {
			full_name: 'Hokie Bird',
			avatar_url: 'https://example.com/avatar.png'
		};
	});

	it('POST /api/auth/sync syncs user and returns record', async () => {
		const syncedUser = {
			id: 'user-1',
			username: 'Hokie Bird'
		};
		prisma.user.upsert.mockResolvedValue(syncedUser);

		const res = await request(createApp()).post('/api/auth/sync').send({});

		expect(res.status).toBe(200);
		expect(res.body).toEqual(syncedUser);
		expect(prisma.user.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'user-1' },
				update: expect.objectContaining({
					username: 'Hokie Bird'
				}),
				create: expect.objectContaining({
					username: 'Hokie Bird'
				})
			})
		);
	});

	it('POST /api/auth/sync uses email prefix when full_name is missing', async () => {
		mockUser.id = 'user-2';
		mockUser.email = 'student@vt.edu';
		mockUser.user_metadata = {
			avatar_url: 'https://example.com/avatar-2.png'
		};

		const syncedUser = { id: 'user-2', username: 'student' };
		prisma.user.upsert.mockResolvedValue(syncedUser);

		const res = await request(createApp()).post('/api/auth/sync').send({});

		expect(res.status).toBe(200);
		expect(prisma.user.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'user-2' },
				update: expect.objectContaining({ username: 'student' }),
				create: expect.objectContaining({ username: 'student' })
			})
		);
	});

	it('POST /api/auth/sync returns 500 on prisma error', async () => {
		prisma.user.upsert.mockRejectedValue(new Error('db unavailable'));

		const res = await request(createApp()).post('/api/auth/sync').send({});

		expect(res.status).toBe(500);
		expect(res.body).toEqual({ error: 'Failed to sync user' });
	});
});

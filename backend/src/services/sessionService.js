// backend/src/services/sessionService.js
const { Session, User } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

class SessionService {
  /**
   * Create a new session for a user with IP tracking
   */
  static async createSession(userId, ipAddress, userAgent, expiresIn = '30d') {
    try {
      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
      const token = jwt.sign(
        { id: userId },
        jwtSecret.trim(),
        { expiresIn }
      );

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

      // Create session record
      const session = await Session.create({
        user_id: userId,
        token,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt,
        is_active: true
      });

      console.log(`✅ Session created for user ${userId} from IP ${ipAddress}`);

      return {
        token,
        sessionId: session.id,
        expiresAt
      };
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Validate session by token and IP address
   */
  static async validateSession(token, ipAddress) {
    try {
      // Find active session
      const session = await Session.findOne({
        where: {
          token,
          is_active: true,
          expires_at: {
            [Op.gt]: new Date()
          }
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'role', 'kyc_status', 'company_name']
        }]
      });

      if (!session) {
        console.log('❌ No active session found for token');
        return null;
      }

      // Check if IP address matches (with some flexibility for dynamic IPs)
      if (session.ip_address !== ipAddress) {
        console.log(`⚠️ IP mismatch: stored=${session.ip_address}, current=${ipAddress}`);
        
        // For now, allow IP changes but log them
        // In production, you might want to be more strict
        await session.update({
          ip_address: ipAddress,
          last_activity: new Date()
        });
      } else {
        // Update last activity
        await session.update({
          last_activity: new Date()
        });
      }

      return {
        user: session.user,
        sessionId: session.id,
        ipAddress: session.ip_address
      };
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return null;
    }
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserSessions(userId) {
    try {
      const sessions = await Session.findAll({
        where: {
          user_id: userId,
          is_active: true,
          expires_at: {
            [Op.gt]: new Date()
          }
        },
        attributes: ['id', 'ip_address', 'user_agent', 'created_at', 'last_activity', 'expires_at']
      });

      return sessions;
    } catch (error) {
      console.error('❌ Failed to get user sessions:', error);
      throw error;
    }
  }

  /**
   * Invalidate a specific session
   */
  static async invalidateSession(sessionId) {
    try {
      await Session.update(
        { is_active: false },
        { where: { id: sessionId } }
      );
      console.log(`✅ Session ${sessionId} invalidated`);
      return true;
    } catch (error) {
      console.error('❌ Failed to invalidate session:', error);
      return false;
    }
  }

  /**
   * Invalidate all sessions for a user (except current one)
   */
  static async invalidateAllUserSessions(userId, excludeSessionId = null) {
    try {
      const whereClause = {
        user_id: userId,
        is_active: true
      };

      if (excludeSessionId) {
        whereClause.id = {
          [Op.ne]: excludeSessionId
        };
      }

      await Session.update(
        { is_active: false },
        { where: whereClause }
      );

      console.log(`✅ All sessions invalidated for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to invalidate user sessions:', error);
      return false;
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions() {
    try {
      const result = await Session.update(
        { is_active: false },
        {
          where: {
            expires_at: {
              [Op.lt]: new Date()
            },
            is_active: true
          }
        }
      );

      console.log(`🧹 Cleaned up ${result[0]} expired sessions`);
      return result[0];
    } catch (error) {
      console.error('❌ Failed to cleanup expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get client IP address from request
   */
  static getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
  }

  /**
   * Get user agent from request
   */
  static getUserAgent(req) {
    return req.headers['user-agent'] || 'unknown';
  }
}

module.exports = SessionService; 
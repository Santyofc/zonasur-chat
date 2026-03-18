import { Injectable } from '@nestjs/common';

/**
 * In-memory presence tracker (v1).
 * Maps userId → Set of socketIds (a user can have multiple sessions).
 * In v2 this will be replaced with a Redis-backed solution for horizontal scaling.
 */
@Injectable()
export class PresenceService {
  private readonly sessions = new Map<string, Set<string>>();

  join(userId: string, socketId: string): void {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, new Set());
    }
    this.sessions.get(userId)!.add(socketId);
  }

  leave(userId: string, socketId: string): boolean {
    const sockets = this.sessions.get(userId);
    if (!sockets) return false;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.sessions.delete(userId);
      return true; // truly offline
    }
    return false;
  }

  isOnline(userId: string): boolean {
    const sockets = this.sessions.get(userId);
    return !!sockets && sockets.size > 0;
  }

  getOnlineUsers(): string[] {
    return Array.from(this.sessions.keys());
  }
}

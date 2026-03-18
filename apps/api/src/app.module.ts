import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ConversationsModule } from "./modules/conversations/conversations.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { ContactsModule } from "./modules/contacts/contacts.module";
import { PresenceModule } from "./modules/presence/presence.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { WebsocketModule } from "./modules/websocket/websocket.module";
import { SupabaseModule } from "./config/supabase.module";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController],
  imports: [
    // Config — available everywhere
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000, // 1 second
        limit: 10,
      },
      {
        name: "medium",
        ttl: 60_000, // 1 minute
        limit: 200,
      },
    ]),

    // Core infrastructure
    SupabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ConversationsModule,
    MessagesModule,
    ContactsModule,
    PresenceModule,
    NotificationsModule,
    WebsocketModule,
  ],
})
export class AppModule {}

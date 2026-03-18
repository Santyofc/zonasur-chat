import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService, JwtGuard],
  exports: [ContactsService],
})
export class ContactsModule {}

import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { ContactsService } from "./contacts.service";
import { JwtGuard } from "../../common/guards/jwt.guard";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { ContactRequestDto } from "./dto/contact-request.dto";

@Controller("contacts")
@UseGuards(JwtGuard)
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  /** GET /api/contacts */
  @Get()
  async getAll(@CurrentUser() user: AuthUser) {
    return this.contacts.findAll(user.id);
  }

  /** POST /api/contacts/request */
  @Post("request")
  async sendRequest(
    @CurrentUser() user: AuthUser,
    @Body() dto: ContactRequestDto,
  ) {
    return this.contacts.sendRequest(user.id, dto);
  }

  /** POST /api/contacts/:id/accept */
  @Post(":id/accept")
  async acceptRequest(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.contacts.acceptRequest(user.id, id);
  }
}

import { Controller, Get, Post, Delete, Query, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WritingSessionsService } from './writing-sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateWritingSessionDto } from './dto/writing-session.dto';

@ApiTags('writing-sessions')
@Controller('writing-sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WritingSessionsController {
  constructor(private readonly sessionsService: WritingSessionsService) {}

  @Get()
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'storyId', required: false })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('storyId') storyId?: string,
  ) {
    return this.sessionsService.findAll(user.id, from, to, storyId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWritingSessionDto) {
    return this.sessionsService.create(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.sessionsService.remove(user.id, id);
  }
}

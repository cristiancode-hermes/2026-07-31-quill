import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateTimelineEventDto, UpdateTimelineEventDto } from './dto/timeline.dto';

@ApiTags('timeline')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get('stories/:storyId/timeline')
  findAll(@CurrentUser() user: AuthenticatedUser, @Param('storyId') storyId: string) {
    return this.timelineService.findAll(user.id, storyId);
  }

  @Get('timeline/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.timelineService.findOne(user.id, id);
  }

  @Post('stories/:storyId/timeline')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storyId') storyId: string,
    @Body() dto: CreateTimelineEventDto,
  ) {
    return this.timelineService.create(user.id, storyId, dto);
  }

  @Patch('timeline/:id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateTimelineEventDto) {
    return this.timelineService.update(user.id, id, dto);
  }

  @Delete('timeline/:id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.timelineService.remove(user.id, id);
  }
}

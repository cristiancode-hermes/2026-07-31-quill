import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('stats')
@Controller('stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  getDashboardStats(@CurrentUser() user: AuthenticatedUser) {
    return this.statsService.getDashboardStats(user.id);
  }

  @Get('weekly-words')
  getWeeklyWords(@CurrentUser() user: AuthenticatedUser) {
    return this.statsService.getWeeklyWords(user.id);
  }

  @Get('story/:storyId')
  getStoryStats(@CurrentUser() user: AuthenticatedUser, @Param('storyId') storyId: string) {
    return this.statsService.getStoryStats(user.id, storyId);
  }
}

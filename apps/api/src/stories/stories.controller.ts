import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateStoryDto, UpdateStoryDto } from './dto/story.dto';

@ApiTags('stories')
@Controller('stories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.storiesService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.storiesService.findWithStats(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStoryDto) {
    return this.storiesService.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateStoryDto) {
    return this.storiesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.storiesService.archive(user.id, id);
  }
}

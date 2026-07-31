import { Controller, Get, Post, Patch, Delete, Put, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChaptersService } from './chapters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateChapterDto, UpdateChapterDto, ReorderChaptersDto } from './dto/chapter.dto';

@ApiTags('chapters')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get('stories/:storyId/chapters')
  findAll(@CurrentUser() user: AuthenticatedUser, @Param('storyId') storyId: string) {
    return this.chaptersService.findAll(user.id, storyId);
  }

  @Get('chapters/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.chaptersService.findOne(user.id, id);
  }

  @Post('stories/:storyId/chapters')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storyId') storyId: string,
    @Body() dto: CreateChapterDto,
  ) {
    return this.chaptersService.create(user.id, storyId, dto);
  }

  @Patch('chapters/:id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateChapterDto) {
    return this.chaptersService.update(user.id, id, dto);
  }

  @Delete('chapters/:id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.chaptersService.remove(user.id, id);
  }

  @Put('stories/:storyId/chapters/reorder')
  reorder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storyId') storyId: string,
    @Body() dto: ReorderChaptersDto,
  ) {
    return this.chaptersService.reorder(user.id, storyId, dto.orderedIds);
  }
}

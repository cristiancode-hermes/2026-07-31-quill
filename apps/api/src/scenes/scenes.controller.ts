import { Controller, Get, Post, Patch, Delete, Put, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ScenesService } from './scenes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateSceneDto, UpdateSceneDto, ReorderScenesDto } from './dto/scene.dto';

@ApiTags('scenes')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScenesController {
  constructor(private readonly scenesService: ScenesService) {}

  @Get('chapters/:chapterId/scenes')
  findAll(@CurrentUser() user: AuthenticatedUser, @Param('chapterId') chapterId: string) {
    return this.scenesService.findAll(user.id, chapterId);
  }

  @Get('scenes/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.scenesService.findOne(user.id, id);
  }

  @Post('chapters/:chapterId/scenes')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chapterId') chapterId: string,
    @Body() dto: CreateSceneDto,
  ) {
    return this.scenesService.create(user.id, chapterId, dto);
  }

  @Patch('scenes/:id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateSceneDto) {
    return this.scenesService.update(user.id, id, dto);
  }

  @Delete('scenes/:id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.scenesService.remove(user.id, id);
  }

  @Put('chapters/:chapterId/scenes/reorder')
  reorder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chapterId') chapterId: string,
    @Body() dto: ReorderScenesDto,
  ) {
    return this.scenesService.reorder(user.id, chapterId, dto.orderedIds);
  }
}

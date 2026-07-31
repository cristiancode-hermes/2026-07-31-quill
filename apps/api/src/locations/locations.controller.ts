import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';

@ApiTags('locations')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('stories/:storyId/locations')
  findAll(@CurrentUser() user: AuthenticatedUser, @Param('storyId') storyId: string) {
    return this.locationsService.findAll(user.id, storyId);
  }

  @Get('stories/:storyId/locations/tree')
  getTree(@CurrentUser() user: AuthenticatedUser, @Param('storyId') storyId: string) {
    return this.locationsService.getTree(user.id, storyId);
  }

  @Get('locations/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.locationsService.findOne(user.id, id);
  }

  @Post('stories/:storyId/locations')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storyId') storyId: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.locationsService.create(user.id, storyId, dto);
  }

  @Patch('locations/:id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.update(user.id, id, dto);
  }

  @Delete('locations/:id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.locationsService.remove(user.id, id);
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CharactersService } from './characters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateCharacterDto, UpdateCharacterDto, CreateRelationshipDto, UpdateRelationshipDto } from './dto/character.dto';

@ApiTags('characters')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get('stories/:storyId/characters')
  findAll(@CurrentUser() user: AuthenticatedUser, @Param('storyId') storyId: string) {
    return this.charactersService.findAll(user.id, storyId);
  }

  @Get('characters/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.charactersService.findOne(user.id, id);
  }

  @Post('stories/:storyId/characters')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storyId') storyId: string,
    @Body() dto: CreateCharacterDto,
  ) {
    return this.charactersService.create(user.id, storyId, dto);
  }

  @Patch('characters/:id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCharacterDto) {
    return this.charactersService.update(user.id, id, dto);
  }

  @Delete('characters/:id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.charactersService.remove(user.id, id);
  }

  @Get('characters/:id/relationships')
  getRelationships(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.charactersService.getRelationships(user.id, id);
  }

  @Post('characters/:id/relationships')
  addRelationship(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateRelationshipDto,
  ) {
    return this.charactersService.addRelationship(user.id, id, dto);
  }

  @Patch('relationships/:id')
  updateRelationship(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRelationshipDto,
  ) {
    return this.charactersService.updateRelationship(user.id, id, dto);
  }

  @Delete('relationships/:id')
  @HttpCode(204)
  async removeRelationship(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.charactersService.removeRelationship(user.id, id);
  }
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsIn, Min, Max, MaxLength } from 'class-validator';

export class CreateTimelineEventDto {
  @ApiProperty({ example: 'The Fall of the Amber Throne' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'The old king vanishes and the realm fractures...' })
  @IsString()
  description: string;

  @ApiProperty({ example: 124 })
  @IsNumber()
  eventDate: number;

  @ApiPropertyOptional({ example: 'plot', enum: ['plot', 'character', 'location', 'battle', 'revelation'] })
  @IsOptional()
  @IsString()
  @IsIn(['plot', 'character', 'location', 'battle', 'revelation'])
  eventType?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  importance?: number;

  @ApiPropertyOptional({ example: ['uuid-character-1'] })
  @IsOptional()
  @IsString({ each: true })
  characterIds?: string[];

  @ApiPropertyOptional({ example: ['uuid-location-1'] })
  @IsOptional()
  @IsString({ each: true })
  locationIds?: string[];
}

export class UpdateTimelineEventDto {
  @ApiPropertyOptional({ example: 'The Fall of the Amber Throne' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 124 })
  @IsOptional()
  @IsNumber()
  eventDate?: number;

  @ApiPropertyOptional({ example: 'plot' })
  @IsOptional()
  @IsString()
  @IsIn(['plot', 'character', 'location', 'battle', 'revelation'])
  eventType?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  importance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  characterIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  locationIds?: string[];
}

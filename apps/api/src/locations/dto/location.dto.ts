import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsIn, MaxLength, Min } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'The Verdant Reach' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'region', enum: ['world', 'continent', 'realm', 'city', 'town', 'building', 'room', 'landmark', 'region'] })
  @IsString()
  @IsIn(['world', 'continent', 'realm', 'city', 'town', 'building', 'room', 'landmark', 'region'])
  type: string;

  @ApiPropertyOptional({ example: 'uuid-of-parent-location' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: 'A misty valley guarded by ancient pines...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Temperate, foggy mornings' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  climate?: string;

  @ApiPropertyOptional({ example: 12000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  population?: number;
}

export class UpdateLocationDto {
  @ApiPropertyOptional({ example: 'The Verdant Reach' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'region' })
  @IsOptional()
  @IsString()
  @IsIn(['world', 'continent', 'realm', 'city', 'town', 'building', 'room', 'landmark', 'region'])
  type?: string;

  @ApiPropertyOptional({ example: 'uuid-of-parent-location' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  climate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  population?: number;
}

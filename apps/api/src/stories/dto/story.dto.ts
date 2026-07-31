import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateStoryDto {
  @ApiProperty({ example: 'The Amber Throne' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Fantasy' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  genre?: string;

  @ApiPropertyOptional({ example: 'A disgraced cartographer discovers a hidden kingdom...' })
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional({ example: '#5C2D1A' })
  @IsOptional()
  @IsString()
  coverColor?: string;
}

export class UpdateStoryDto {
  @ApiPropertyOptional({ example: 'The Amber Throne' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Fantasy' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  genre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional({ example: '#5C2D1A' })
  @IsOptional()
  @IsString()
  coverColor?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

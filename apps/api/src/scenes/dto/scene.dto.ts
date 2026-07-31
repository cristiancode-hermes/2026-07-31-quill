import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateSceneDto {
  @ApiPropertyOptional({ example: 'The map room' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Kael unrolled the parchment...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSceneDto {
  @ApiPropertyOptional({ example: 'The map room' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Kael unrolled the parchment...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReorderScenesDto {
  @ApiProperty({ example: ['uuid-1', 'uuid-2'] })
  @IsString({ each: true })
  orderedIds: string[];
}

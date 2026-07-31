import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsIn, MaxLength } from 'class-validator';

export class CreateChapterDto {
  @ApiProperty({ example: 'The Cartographer\'s Map' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  wordGoal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateChapterDto {
  @ApiPropertyOptional({ example: 'The Cartographer\'s Map' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  wordGoal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'draft', enum: ['draft', 'drafting', 'revising', 'done'] })
  @IsOptional()
  @IsIn(['draft', 'drafting', 'revising', 'done'])
  status?: string;
}

export class ReorderChaptersDto {
  @ApiProperty({ example: ['uuid-1', 'uuid-2', 'uuid-3'] })
  @IsString({ each: true })
  orderedIds: string[];
}

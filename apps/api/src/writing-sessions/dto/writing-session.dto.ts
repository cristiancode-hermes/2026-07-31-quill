import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, Min, MaxLength } from 'class-validator';

export class CreateWritingSessionDto {
  @ApiProperty({ example: 350 })
  @IsNumber()
  @Min(0)
  wordsWritten: number;

  @ApiProperty({ example: 45 })
  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @ApiPropertyOptional({ example: 'uuid-of-story' })
  @IsOptional()
  @IsString()
  storyId?: string;

  @ApiPropertyOptional({ example: 'Morning pages, café by the window' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  sessionDate?: string;
}

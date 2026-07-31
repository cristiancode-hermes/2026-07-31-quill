import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsIn, MaxLength, Min } from 'class-validator';

export class CreateCharacterDto {
  @ApiProperty({ example: 'Kael Ashford' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'protagonist', enum: ['protagonist', 'antagonist', 'side', 'mentor', 'supporting'] })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;

  @ApiPropertyOptional({ example: 27 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  age?: number;

  @ApiPropertyOptional({ example: 'stubborn, curious, loyal' })
  @IsOptional()
  @IsString()
  traits?: string;

  @ApiPropertyOptional({ example: 'Tall, with a scar across his left brow...' })
  @IsOptional()
  @IsString()
  appearance?: string;

  @ApiPropertyOptional({ example: 'Raised in the harbor district...' })
  @IsOptional()
  @IsString()
  backstory?: string;

  @ApiPropertyOptional({ example: 'Find the lost atlas of Veyra' })
  @IsOptional()
  @IsString()
  goals?: string;

  @ApiPropertyOptional({ example: '#8B5E3C' })
  @IsOptional()
  @IsString()
  avatarColor?: string;
}

export class UpdateCharacterDto {
  @ApiPropertyOptional({ example: 'Kael Ashford' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'protagonist' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: 27 })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  traits?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appearance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backstory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  goals?: string;

  @ApiPropertyOptional({ example: '#8B5E3C' })
  @IsOptional()
  @IsString()
  avatarColor?: string;
}

export class CreateRelationshipDto {
  @ApiProperty({ example: 'uuid-of-target-character' })
  @IsString()
  targetCharacterId: string;

  @ApiProperty({ example: 'friend', enum: ['friend', 'rival', 'family', 'lover', 'enemy', 'mentor', 'ally'] })
  @IsString()
  @IsIn(['friend', 'rival', 'family', 'lover', 'enemy', 'mentor', 'ally'])
  type: string;

  @ApiPropertyOptional({ example: 'Childhood friends from the harbor' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRelationshipDto {
  @ApiPropertyOptional({ example: 'rival' })
  @IsOptional()
  @IsString()
  @IsIn(['friend', 'rival', 'family', 'lover', 'enemy', 'mentor', 'ally'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

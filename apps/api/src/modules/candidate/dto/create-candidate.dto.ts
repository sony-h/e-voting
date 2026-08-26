import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  @IsNotEmpty()
  election_id!: string;

  @IsInt()
  @Min(1)
  candidate_number!: number;

  @IsString()
  @IsNotEmpty()
  chairman_name!: string;

  @IsString()
  @IsOptional()
  vice_chairman_name?: string;

  @IsString()
  @IsNotEmpty()
  vision!: string;

  @IsString()
  @IsNotEmpty()
  mission!: string;

  @IsString()
  @IsOptional()
  program_description?: string;

  @IsBoolean()
  @IsOptional()
  show_on_landing?: boolean;
}

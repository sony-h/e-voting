import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateCandidateDto {
  @IsUUID()
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
}

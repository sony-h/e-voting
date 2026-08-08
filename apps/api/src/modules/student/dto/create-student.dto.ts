import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  nis!: string;

  @IsString()
  @IsOptional()
  nisn?: string;

  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @IsString()
  @IsNotEmpty()
  class_name!: string;

  @IsString()
  @IsOptional()
  major?: string;

  @IsString()
  @IsOptional()
  grade?: string;

  @IsString()
  @IsNotEmpty()
  election_id!: string;
}

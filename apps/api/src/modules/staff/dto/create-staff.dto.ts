import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StaffRole } from '@prisma/client';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  election_id!: string;

  @IsString()
  @IsOptional()
  nip?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @IsEnum(StaffRole)
  @IsOptional()
  role?: StaffRole;
}

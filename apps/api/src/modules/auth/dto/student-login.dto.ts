import { IsNotEmpty, IsString } from 'class-validator';

export class StudentLoginDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  token!: string;
}

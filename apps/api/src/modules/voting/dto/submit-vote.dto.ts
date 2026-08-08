import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitVoteDto {
  @IsString()
  @IsNotEmpty()
  candidateId!: string;
}

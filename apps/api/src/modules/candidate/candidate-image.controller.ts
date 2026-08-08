import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CandidateService } from './candidate.service';

@Controller('candidate-images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CandidateImageController {
  constructor(private readonly candidateService: CandidateService) {}

  @Delete(':imageId')
  removeImage(@Param('imageId') imageId: string) {
    return this.candidateService.removeImage(imageId);
  }
}

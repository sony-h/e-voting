import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CandidateService } from './candidate.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get()
  findAll(@Query('electionId') electionId?: string) {
    return this.candidateService.findAll(electionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.candidateService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCandidateDto) {
    return this.candidateService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.candidateService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.candidateService.remove(id);
  }

  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'candidate-photo'),
        filename: (_req, file, cb) =>
          cb(
            null,
            `${Date.now()}-${randomUUID()}${extname(file.originalname)}`,
          ),
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        cb(
          null,
          ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype),
        ),
    }),
  )
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.candidateService.updatePhoto(
      id,
      `/uploads/candidate-photo/${file.filename}`,
    );
  }

  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'candidate-image'),
        filename: (_req, file, cb) =>
          cb(
            null,
            `${Date.now()}-${randomUUID()}${extname(file.originalname)}`,
          ),
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        cb(
          null,
          ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype),
        ),
    }),
  )
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.candidateService.addImages(id, files);
  }
}

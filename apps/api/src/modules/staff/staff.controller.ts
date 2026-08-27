import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll(@Query('electionId') electionId?: string) {
    return this.staffService.findAll(electionId);
  }

  @Get('export')
  async export(@Query('electionId') electionId: string, @Res() res: Response) {
    const { buffer, filename } =
      await this.staffService.exportStaff(electionId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }

  @Post(':id/reset-token')
  resetToken(@Param('id') id: string) {
    return this.staffService.resetToken(id);
  }

  @Post(':id/reset-vote')
  resetVote(@Param('id') id: string) {
    return this.staffService.resetVote(id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  import(
    @Query('electionId') electionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.staffService.importStaff(electionId, file.buffer);
  }
}

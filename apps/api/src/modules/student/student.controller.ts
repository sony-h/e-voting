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
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('students')
  findAll(@Query('electionId') electionId?: string) {
    return this.studentService.findAll(electionId);
  }

  @Get('students/:id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @Post('students')
  create(@Body() dto: CreateStudentDto) {
    return this.studentService.create(dto);
  }

  @Patch('students/:id')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentService.update(id, dto);
  }

  @Delete('students/:id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }

  @Patch('student-elections/:id/reset')
  resetVote(@Param('id') id: string) {
    return this.studentService.resetVote(id);
  }

  @Post('student-elections/:id/token/reset')
  resetToken(@Param('id') id: string) {
    return this.studentService.resetToken(id);
  }

  @Post('students/import')
  @UseInterceptors(FileInterceptor('file'))
  importStudents(
    @Query('electionId') electionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentService.importStudents(electionId, file.buffer);
  }

  @Post('students/export')
  async exportStudents(
    @Query('electionId') electionId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.studentService.exportStudents(electionId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}

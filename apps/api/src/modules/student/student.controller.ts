import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
}

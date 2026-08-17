import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { ReportService } from './report.service';

@Controller('results')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  getResults(@Query('electionId') electionId: string) {
    return this.reportService.getResults(electionId);
  }

  @Post('publish')
  publish(@Body() body: { electionId: string; visible: boolean }) {
    return this.reportService.setResultsPublic(body.electionId, body.visible);
  }

  @Get('export/excel')
  async exportExcel(
    @Query('electionId') electionId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.reportService.exportExcel(electionId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('export/pdf')
  async exportPdf(
    @Query('electionId') electionId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.reportService.exportPdf(electionId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}

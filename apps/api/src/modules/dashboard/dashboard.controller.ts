import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(@Query('electionId') electionId: string) {
    return this.dashboardService.summary(electionId);
  }

  @Get('classes')
  byClass(@Query('electionId') electionId: string) {
    return this.dashboardService.byClass(electionId);
  }

  @Get('majors')
  byMajor(@Query('electionId') electionId: string) {
    return this.dashboardService.byMajor(electionId);
  }
}

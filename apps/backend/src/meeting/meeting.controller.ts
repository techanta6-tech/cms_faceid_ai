import { Body, Controller, Delete, Get, Param, Post, Put, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import {
  CreateMeetingDto,
  MeetingService,
  UpdateMeetingDto,
} from './meeting.service';

@Controller('meeting')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Get()
  async findAll() {
    return this.meetingService.findAll();
  }

  @Get('event-logs')
  async getEventLogs(
    @Query('page')      page?:      string,
    @Query('limit')     limit?:     string,
    @Query('search')    search?:    string,
    @Query('zone')      zone?:      string,
    @Query('startDate') startDate?: string,
    @Query('endDate')   endDate?:   string,
    @Query('startTime') startTime?: string,
    @Query('endTime')   endTime?:   string,
    @Query('group')     group?:     string,
    @Query('eventType') eventType?: string,
    @Query('noImages')  noImages?:  string,
  ) {
    return this.meetingService.getEventLogs({
      page:      page      ? parseInt(page,  10) : 1,
      limit:     limit     ? parseInt(limit, 10) : 10,
      search,
      zone,
      startDate,
      endDate,
      startTime,
      endTime,
      group,
      eventType,
      noImages:  noImages === 'true',
    });
  }

  @Get('event-logs/ids')
  async getEventLogIds(
    @Query('page')      page?:      string,
    @Query('limit')     limit?:     string,
    @Query('search')    search?:    string,
    @Query('zone')      zone?:      string,
    @Query('startDate') startDate?: string,
    @Query('endDate')   endDate?:   string,
    @Query('startTime') startTime?: string,
    @Query('endTime')   endTime?:   string,
    @Query('group')     group?:     string,
    @Query('eventType') eventType?: string,
  ) {
    return this.meetingService.getEventLogIds({
      page:      page      ? parseInt(page,  10) : 1,
      limit:     limit     ? parseInt(limit, 10) : 10,
      search,
      zone,
      startDate,
      endDate,
      startTime,
      endTime,
      group,
      eventType,
    });
  }

  @Get('attendance/daily-report')
  async getDailyAttendanceReport(
    @Query('date') date: string,
    @Query('areas') areas?: string,
    @Query('groupId') groupId?: string,
    @Query('shiftStart') shiftStart?: string,
    @Query('shiftEnd') shiftEnd?: string,
    @Query('bufferHours') bufferHours?: string,
  ) {
    const areaList = areas ? areas.split(',') : [];
    const bufferNum = bufferHours ? parseInt(bufferHours, 10) : undefined;
    return this.meetingService.getDailyAttendanceReport(date, areaList, groupId || 'All', shiftStart, shiftEnd, bufferNum);
  }

  @Get('attendance/range-report')
  async getRangeAttendanceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('areas') areas?: string,
    @Query('groupId') groupId?: string,
  ) {
    const areaList = areas ? areas.split(',') : [];
    return this.meetingService.getRangeAttendanceReport(startDate, endDate, areaList, groupId || 'All');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.meetingService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateMeetingDto) {
    return this.meetingService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMeetingDto) {
    return this.meetingService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.meetingService.remove(id);
  }

  @Get(':id/attendance-report')
  async getAttendanceReport(@Param('id') id: string) {
    return this.meetingService.getAttendanceReport(id);
  }

  @Post('export-excel')
  async exportExcel(@Body('data') data: any[], @Res() res: Response) {
    return this.meetingService.exportExcel(data, res);
  }
}

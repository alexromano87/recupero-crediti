import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { StudiService } from './studi.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CreateStudioDto } from './dto/create-studio.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';

@Controller('studi')
@UseGuards(JwtAuthGuard)
export class StudiController {
  constructor(private readonly studiService: StudiService) {}

  @Get()
  async findAll() {
    return this.studiService.findAll();
  }

  @Get('active')
  async findAllActive() {
    return this.studiService.findAllActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.studiService.findOne(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() createStudioDto: CreateStudioDto) {
    return this.studiService.create(createStudioDto);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() updateStudioDto: UpdateStudioDto,
  ) {
    return this.studiService.update(id, updateStudioDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(@Param('id') id: string) {
    return this.studiService.remove(id);
  }

  @Put(':id/toggle-active')
  @UseGuards(AdminGuard)
  async toggleActive(@Param('id') id: string) {
    return this.studiService.toggleActive(id);
  }

  @Get(':id/stats')
  @UseGuards(AdminGuard)
  async getStudioStats(@Param('id') id: string) {
    return this.studiService.getStudioStats(id);
  }
}

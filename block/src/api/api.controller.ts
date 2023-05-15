import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiService } from './api.service';
import { BlockDTO } from './api.dto';
import { Block } from 'src/listener/entities/block.entity';

@Controller('block')
@ApiTags('Api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('/forked')
  @ApiResponse({ status: 200, type: BlockDTO })
  async getToken(): Promise<Block[]> {
    return this.apiService.getTransaction();
  }
}

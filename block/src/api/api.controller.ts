import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiService } from './api.service';
import { BlockDTO } from './api.dto';

@Controller('block')
@ApiTags('Api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('/forked')
  @ApiResponse({ status: 200, type: BlockDTO })
  async getToken(): Promise<BlockDTO[]> {
    return this.apiService.getTransaction();
  }
}

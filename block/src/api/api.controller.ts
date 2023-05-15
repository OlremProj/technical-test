import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiService } from './api.service';
import { BlockDTO } from './api.dto';
import { Block } from '@/listener/entities/block.entity';
import { TransactionError } from '@/listener/entities/transactionError.entity';

@Controller('block')
@ApiTags('Api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('/forked')
  @ApiResponse({ status: 200, type: BlockDTO })
  async getForkedBlocks(): Promise<Block[]> {
    return this.apiService.getForkedBlocks();
  }

  @Get('/count')
  @ApiResponse({ status: 200, type: Number })
  async getBlockCount(): Promise<number> {
    return this.apiService.getBlockCount();
  }

  @Get('/transaction/count')
  @ApiResponse({ status: 200, type: Number })
  async getTransactionCount(): Promise<number> {
    return this.apiService.getTransactionCount();
  }

  @Get('/transaction/error')
  @ApiResponse({ status: 200, type: Number })
  async getTransactionErrors(): Promise<TransactionError[]> {
    return this.apiService.getTransactionsError();
  }
}

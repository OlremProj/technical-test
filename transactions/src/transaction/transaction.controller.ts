import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { TransactionService } from './transaction.service';
import { TransactionsDTO } from './dto/transactions.dto';

@Controller()
export class TransactionController {
  constructor(private readonly transcationService: TransactionService) {}

  @EventPattern({ cmd: 'transactions' })
  async transcations(data: TransactionsDTO): Promise<void> {
    this.transcationService.transactions(data);
  }
}

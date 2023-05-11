import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ListenerService } from './listener.service';
import { TransactionsDTO } from './dto/transactions.dto';

@Controller()
export class ListenerController {
  constructor(private readonly listenerService: ListenerService) {}

  @MessagePattern({ cmd: 'transactions' })
  async transcations(data: TransactionsDTO): Promise<void> {
    this.listenerService.transactions(data);
  }
}

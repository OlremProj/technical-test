import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ListenerService } from './listener.service';

@Controller()
export class ListenerController {
  constructor(private readonly appService: ListenerService) {}

  @MessagePattern('transactions')
  async transcations(data: any): Promise<void> {
    console.log('=================data');
    console.log(data);
    console.log('=================data');
    // return this.appService.sum(data);
  }
}

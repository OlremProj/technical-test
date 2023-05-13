import { Test, TestingModule } from '@nestjs/testing';
import { ListenerService } from './listener.service';
import { ConfigService } from '@nestjs/config';
import { AlchemyWebSocketProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { EntityManager } from '@mikro-orm/core';
import { ClientProxy } from '@nestjs/microservices';
import { EntityRepository } from '@mikro-orm/nestjs';
import { Block } from './entities/block.entity';

describe('ListenerService', () => {
  let listenerService: ListenerService;
  let em: EntityManager;
  let blockRepository: EntityRepository<Block>;
  let client: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListenerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: AlchemyWebSocketProvider,
          useValue: {
            _subscribe: jest.fn(),
            getBlock: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            findOne: jest.fn(),
            persistAndFlush: jest.fn(),
          },
        },
        {
          provide: EntityRepository,
          useValue: {
            findOne: jest.fn(),
            upsert: jest.fn(),
          },
        },
        {
          provide: ClientProxy,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    listenerService = module.get<ListenerService>(ListenerService);
    em = module.get<EntityManager>(EntityManager);
    blockRepository = module.get<EntityRepository<Block>>(EntityRepository);
    client = module.get<ClientProxy>(ClientProxy);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('flagForkBlock', () => {
    it('should flag forked blocks', async () => {
      const parentHash = '0xabc';
      const blockNumber = 123;

      jest.spyOn(blockRepository, 'findOne').mockResolvedValueOnce({
        number: blockNumber,
      } as Block);

      jest.spyOn(blockRepository, 'upsert').mockImplementation();

      jest.spyOn(blockRepository, 'findOne').mockResolvedValueOnce({
        hash: '0xdef',
      } as Block);

      const result = await listenerService.flagForkBlock({
        parentHash,
        blockNumber,
      });

      expect(blockRepository.findOne).toHaveBeenCalledTimes(2);
      expect(blockRepository.upsert).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });

  describe('onNewBlock', () => {
    it('should save new block and emit transaction hashes', async () => {
      const number = '0xabc';
      const parentHash = '0xdef';
      const hash = '0xghi';
      const blockNumber = 123;

      const blockOnChain = {
        transactions: ['0x123', '0x456'],
        baseFeePerGas: '1',
      };

      const block = new Block({
        ...blockOnChain,
        number: blockNumber,
        hash,
        parentHash,
        baseFeePerGas: Number(blockOnChain.baseFeePerGas),
      });

      jest.spyOn(listenerService, 'flagForkBlock').mockImplementation();

      jest
        .spyOn(em, 'findOne')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ hash: '0xjkl' } as Block);

      jest.spyOn(em, 'persistAndFlush').mockImplementation;
    });
  });
});

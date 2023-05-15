import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ListenerService } from './listener.service';
import { ClientProxy } from '@nestjs/microservices';
import { EntityManager } from '@mikro-orm/postgresql';
import { Block } from './entities/block.entity';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { LockedBlock } from './entities/lockedBlock.entity';

const blockOnChain = {
  number: 123,
  hash: 'hash',
  parentHash: 'parent',
  transactions: ['tx1', 'tx2'],
  baseFeePerGas: '123',
};
class MockProvider {
  async getBlock(blockNumber) {
    // return a mock block object
    return blockOnChain;
  }
}
class MockEntityManager {
  async findOne(...args: any) {
    // return a mock block object
    return {
      ...blockOnChain,
      hash: 'oldHash',
      parentHash: 'parentHash',
    };
  }
  async persistAndFlush(...args: any) {
    // return a mock block object
    return null;
  }
  async upsert(...args: any) {
    // return a mock block object
    return null;
  }
}
describe('ListenerService', () => {
  let service: ListenerService;
  let configService: ConfigService;

  let blockRepositoryMock: any;
  let lockedRepositoryMock: any;
  let client: ClientProxy;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ListenerService,
        {
          provide: getRepositoryToken(Block),
          useValue: {
            persistAndFlush: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LockedBlock),
          useValue: {
            persistAndFlush: jest.fn(),
            findOne: jest.fn(),
          },
        },

        {
          provide: ClientProxy,
          useValue: {},
        },
        {
          provide: 'TRANSACTIONS_COMPUTATION',
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('wss://alchemy_key'),
          },
        },
      ],
    }).compile();

    jest.mock('../helpers/lock.helpers', () => {
      return { aquiringLockBlock: jest.fn().mockResolvedValue(true) };
    });

    service = module.get<ListenerService>(ListenerService);
    blockRepositoryMock = module.get(getRepositoryToken(Block));
    lockedRepositoryMock = module.get(getRepositoryToken(LockedBlock));

    client = module.get<ClientProxy>(ClientProxy);
    configService = module.get(ConfigService);
  });

  // afterEach(() => {
  //   jest.clearAllMocks();
  // });

  describe('onNewBLock', () => {
    it('should save the block in the database and emit transaction hashes to the worker', async () => {
      const blockNumber = 123;

      jest.spyOn(configService, 'get').mockReturnValueOnce('url');

      const mockProvider = new MockProvider();
      service.provider = mockProvider as any;
      blockRepositoryMock.findOne = jest.fn().mockResolvedValueOnce(null);
      blockRepositoryMock.persistAndFlush = jest
        .fn()
        .mockResolvedValueOnce(null);
      client.emit = jest.fn();

      await service.onNewBlock(
        blockNumber,
        blockRepositoryMock,
        lockedRepositoryMock,
        client,
      );

      expect(blockRepositoryMock.persistAndFlush).toHaveBeenCalledWith(
        new Block({
          ...blockOnChain,
          baseFeePerGas: 123,
        } as unknown as Block),
      );

      expect(client.emit).toHaveBeenCalledWith(
        { cmd: 'transactions' },
        {
          blockHash: blockOnChain.hash,
          blockNumber: blockOnChain.number,
          transactionHashes: blockOnChain.transactions,
        },
      );
    });

    it('should escape work if block already exist', async () => {
      const blockNumber = 123;

      jest.spyOn(configService, 'get').mockReturnValueOnce('url');

      const mockProvider = new MockProvider();
      service.provider = mockProvider as any;

      blockRepositoryMock.findOne = jest
        .fn()
        .mockResolvedValueOnce(blockOnChain);
      blockRepositoryMock.persistAndFlush = jest
        .fn()
        .mockResolvedValueOnce(null);
      client.emit = jest.fn();

      await service.onNewBlock(
        blockNumber,
        blockRepositoryMock,
        lockedRepositoryMock,
        client,
      );

      expect(blockRepositoryMock.persistAndFlush).not.toHaveBeenCalled();

      expect(client.emit).not.toHaveBeenCalled();
    });
  });
  describe('onNewBLock with forked block', () => {
    it('should flag fock block in the database and emit transaction hashes to the worker', async () => {
      const blockNumber = 123;
      jest.spyOn(configService, 'get').mockReturnValueOnce('url');
      (blockRepositoryMock.findOne as jest.Mock).mockResolvedValue({
        ...blockOnChain,
        hash: 'parent',
        parentHash: 'parentHash',
      });

      blockRepositoryMock.persistAndFlush = jest
        .fn()
        .mockResolvedValueOnce(null);
      blockRepositoryMock.upsert = jest.fn();
      client.emit = jest.fn();
      const mockProvider = new MockProvider();
      service.provider = mockProvider as any;

      await service.onNewBlock(
        blockNumber,
        blockRepositoryMock,
        lockedRepositoryMock,
        client,
      );

      expect(blockRepositoryMock.upsert).toHaveBeenCalledWith({
        ...blockOnChain,
        hash: 'parent',
        parentHash: 'parentHash',
        isForked: true,
      });

      expect(blockRepositoryMock.persistAndFlush).toHaveBeenCalledWith(
        new Block({
          ...blockOnChain,
          baseFeePerGas: 123,
        } as unknown as Block),
      );

      expect(client.emit).toHaveBeenCalledWith(
        { cmd: 'transactions' },
        {
          blockHash: blockOnChain.hash,
          blockNumber: blockOnChain.number,
          transactionHashes: blockOnChain.transactions,
        },
      );
    });
  });
});

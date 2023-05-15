import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ListenerService } from './listener.service';
import { ClientProxy } from '@nestjs/microservices';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Block } from './entities/block.entity';

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
describe('ListenerService', () => {
  let service: ListenerService;
  let configService: ConfigService;
  let em: EntityManager;
  let client: ClientProxy;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ListenerService,
        {
          provide: EntityManager,
          useValue: { persistAndFlush: jest.fn() },
        },
        {
          provide: EntityRepository,
          useValue: {
            findOne: jest.fn(),
            persistAndFlush: jest.fn(),
            upsert: jest.fn(),
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

    service = module.get<ListenerService>(ListenerService);
    em = module.get<EntityManager>(EntityManager);
    client = module.get<ClientProxy>(ClientProxy);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onNewBLock', () => {
    it('should save the block in the database and emit transaction hashes to the worker', async () => {
      const blockNumber = 123;

      jest.spyOn(configService, 'get').mockReturnValueOnce('url');

      const mockProvider = new MockProvider();
      service.provider = mockProvider as any;

      em.findOne = jest.fn().mockResolvedValueOnce(null);
      em.persistAndFlush = jest.fn().mockResolvedValueOnce(null);
      client.emit = jest.fn();

      await service.onNewBlock(blockNumber, em, client);

      expect(em.persistAndFlush).toHaveBeenCalledWith(
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
    it('should flag fock block in the database and emit transaction hashes to the worker', async () => {
      const blockNumber = 123;

      jest.spyOn(configService, 'get').mockReturnValueOnce('url');

      const mockProvider = new MockProvider();
      service.provider = mockProvider as any;

      em.findOne = jest.fn().mockReturnValue({
        ...blockOnChain,
        hash: 'oldHash',
        parentHash: 'parentHash',
      });

      em.persistAndFlush = jest.fn().mockResolvedValueOnce(null);
      em.upsert = jest.fn();
      client.emit = jest.fn();

      await service.onNewBlock(blockNumber, em, client);

      expect(em.upsert).toHaveBeenCalledWith({
        ...blockOnChain,
        hash: 'parent',
        parentHash: 'parentHash',
        flag: 'FORKED',
      });

      expect(em.persistAndFlush).toHaveBeenCalledWith(
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

      em.findOne = jest.fn().mockResolvedValueOnce(blockOnChain);
      em.persistAndFlush = jest.fn().mockResolvedValueOnce(null);
      client.emit = jest.fn();

      await service.onNewBlock(blockNumber, em, client);

      expect(em.persistAndFlush).not.toHaveBeenCalled();

      expect(client.emit).not.toHaveBeenCalled();
    });
  });
});

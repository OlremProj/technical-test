import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SynchronisationService } from './synchronisation.service';
import { Block } from './entities/block.entity';
import { ClientProxy } from '@nestjs/microservices';
import { EntityRepository } from '@mikro-orm/postgresql';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { LockedSynchronisationBlock } from './entities/lockedSynchronisation.entity';

const blockOnChain = {
  number: 106,
  hash: 'hash',
  parentHash: 'parent',
  transactions: ['tx1', 'tx2'],
  baseFeePerGas: '123',
};

jest.mock('ethers', () => ({
  ethers: {
    ...jest.requireActual('ethers'),
    AlchemyProvider: jest.fn().mockReturnValue({
      getBlock: jest.fn().mockImplementation((blockNumber: number) => {
        return blockOnChain;
      }),
    }),
  },
}));
describe('SynchronisationService', () => {
  let service: SynchronisationService;
  let blockRepository: EntityRepository<Block>;
  let client: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SynchronisationService,
        {
          provide: getRepositoryToken(Block),
          useValue: {
            upsert: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LockedSynchronisationBlock),
          useValue: {
            upsert: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockReturnValue('wss://polygon-mainnet.g.alchemy.com/v2/123'),
          },
        },
        {
          provide: 'TRANSACTIONS_COMPUTATION',
          useValue: {
            emit: jest.fn(),
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

    service = module.get<SynchronisationService>(SynchronisationService);
    blockRepository = module.get(getRepositoryToken(Block));
    client = module.get<ClientProxy>('TRANSACTIONS_COMPUTATION');

    jest.mock('../helpers/lock.helpers', () => {
      return { aquiringLockSynchro: jest.fn().mockResolvedValue(true) };
    });
  });

  describe('dbSynchronisation', () => {
    it('should synchronize the database with the latest blocks on the blockchain', async () => {
      // Mock the return values of the dependencies
      const latestDbBlock = new Block({ number: 100 } as Block);
      blockRepository.find = jest.fn().mockResolvedValue([latestDbBlock]);
      client.emit = jest.fn();

      await service.dbSynchronisation();

      // Check that the correct functions were called
      expect(blockRepository.find).toHaveBeenCalled();
      expect(blockRepository.upsert).toHaveBeenCalledTimes(6);
      expect(client.emit).toHaveBeenCalledTimes(6);
      expect(client.emit).toHaveBeenCalledWith(
        { cmd: 'transactions' },
        {
          blockHash: blockOnChain.hash,
          blockNumber: blockOnChain.number,
          transactionHashes: blockOnChain.transactions,
        },
      );
    });
    it('should skip synchronisation latest block is already up to date', async () => {
      // Mock the return values of the dependencies
      const latestDbBlock = new Block({ number: 106 } as Block);
      blockRepository.find = jest.fn().mockResolvedValue([latestDbBlock]);
      client.emit = jest.fn();

      await service.dbSynchronisation();

      // Check that the correct functions were called
      expect(blockRepository.find).toHaveBeenCalled();
      expect(blockRepository.upsert).not.toHaveBeenCalled();
      expect(client.emit).not.toHaveBeenCalled();
    });
  });
});

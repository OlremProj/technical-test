import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ListenerService } from './listener.service';
import { ClientProxy } from '@nestjs/microservices';
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

jest.mock('ethers', () => ({
  ethers: {
    ...jest.requireActual('ethers'),
    WebSocketProvider: jest.fn().mockReturnValue({
      on: jest.fn(),
      removeListener: jest.fn(),
      getBlock: jest.fn().mockImplementation((blockNumber: number) => {
        return blockOnChain;
      }),
    }),
  },
}));
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
            upsert: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LockedBlock),
          useValue: {
            upsert: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: 'TRANSACTIONS_COMPUTATION',
          useValue: {},
        },
        {
          provide: ClientProxy,
          useValue: { emit: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockReturnValue('wss://polygon-mainnet.g.alchemy.com/v2/123'),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onNewBLock', () => {
    it('should save the block in the database and emit transaction hashes to the worker', async () => {
      const blockNumber = 123;

      jest.spyOn(configService, 'get').mockReturnValueOnce('url');
      blockRepositoryMock.findOne = jest.fn().mockResolvedValueOnce(null);
      blockRepositoryMock.upsert = jest.fn().mockResolvedValueOnce(null);

      await service.onNewBlock(
        blockNumber,
        blockRepositoryMock,
        lockedRepositoryMock,
        client,
      );

      expect(blockRepositoryMock.upsert).toHaveBeenCalledWith(
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
      blockRepositoryMock.findOne = jest
        .fn()
        .mockResolvedValueOnce(blockOnChain);
      blockRepositoryMock.upsert = jest.fn().mockResolvedValueOnce(null);

      await service.onNewBlock(
        blockNumber,
        blockRepositoryMock,
        lockedRepositoryMock,
        client,
      );

      expect(blockRepositoryMock.upsert).not.toHaveBeenCalled();

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

      blockRepositoryMock.upsert = jest.fn().mockResolvedValueOnce(null);

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

      expect(blockRepositoryMock.upsert).toHaveBeenCalledWith(
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

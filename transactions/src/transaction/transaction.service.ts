import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebSocketProvider, ethers } from 'ethers';
import { TransactionsDTO } from './dto/transactions.dto';
import { Transaction } from './entities/transaction.entity';
import { LockedTransactions } from './entities/lockedTransactions.entity';
import { TransactionError } from './entities/transactionError.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private readonly provider: WebSocketProvider;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Transaction)
    private readonly transactionRepository: EntityRepository<Transaction>,
    @InjectRepository(TransactionError)
    private readonly transactionErrorRepository: EntityRepository<TransactionError>,
    @InjectRepository(LockedTransactions)
    private readonly lockRepository: EntityRepository<LockedTransactions>,
  ) {
    this.provider = new ethers.WebSocketProvider(
      this.configService.get<string>('ALCHEMY_BASE_WS') +
        this.configService.get<string>('ALCHEMY_API_KEY'),
    );
  }

  /**
   * Fetches a transaction from the Ethereum network using its hash.
   * @param {string} transactionHash - The hash of the transaction to fetch.
   * @param {number} retry - The number of times to retry if an error occurs. Start to 0.
   * @returns {Promise<any>} - A Promise that resolves to the transaction object, or undefined if it could not be fetched.
   */
  async getTransaction(transactionHash: string, retry = 0): Promise<any> {
    try {
      const transactionOnChain = await this.provider.getTransaction(
        transactionHash,
      );
      return transactionOnChain;
    } catch (error) {
      if (retry < 5) return await this.getTransaction(transactionHash, retry++);
      return;
    }
  }

  /**
   * Processes an array of transaction hashes for a specific block hash.
   * @param {TransactionsDTO} dto - A DTO containing the block hash and array of transaction hashes.
   * @returns {Promise<void>} - A Promise that resolves when all transactions have been processed.
   */
  async transactions({
    blockHash,
    transactionHashes,
  }: TransactionsDTO): Promise<void> {
    //Check if data isn't already processed by another instance
    if (
      !!(await this.lockRepository.findOne({
        hash: blockHash,
      }))
    )
      return;

    //Lock block hash ref for txs in process
    try {
      const lock = new LockedTransactions({ hash: blockHash });
      await this.lockRepository.upsert(lock);
    } catch {
      this.logger.log('Lock undetected but already on process');
      return;
    }

    for (const transactionHash of transactionHashes) {
      const transactionOnChain = await this.getTransaction(transactionHash);
      const transaction = new Transaction({
        ...transactionOnChain,
        gasPrice: transactionOnChain.gasPrice
          ? Number(transactionOnChain.gasPrice)
          : null,
        gasLimit: transactionOnChain.gasLimit
          ? Number(transactionOnChain.gasLimit)
          : null,
        value: transactionOnChain.value
          ? Number(transactionOnChain.value)
          : null,
        blockHash,
      } as unknown as Transaction);

      try {
        await this.transactionRepository.upsert(transaction);
      } catch (error) {
        /**
         * I make the choice to store the transaction error to put in place a mecanism to handle all the error correctly
         */
        const transactionError = new TransactionError({
          hash: transactionHash,
          cause: error.toString(),
        });
        this.transactionErrorRepository.upsert(transactionError);

        this.logger.error(
          `error append : ${error}, on transaction : ${transactionHash}`,
        );
      }
    }
  }
}

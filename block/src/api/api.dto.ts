import { ApiProperty } from '@nestjs/swagger';

export class BlockDTO {
  @ApiProperty({
    type: Number,
    description: 'Block number',
  })
  number: number;

  @ApiProperty({
    type: String,
    description: 'Block hash',
  })
  hash: string;

  @ApiProperty({
    type: Number,
    description: 'Block Timestamp',
  })
  timestamp: number;

  @ApiProperty({
    type: String,
    description: 'Block parent hash',
  })
  parentHash: string;

  @ApiProperty({
    type: String,
    description: 'Block nonce',
  })
  nonce: string;

  @ApiProperty({
    type: Number,
    description: 'Block difficulty',
  })
  difficulty: number;

  @ApiProperty({
    type: Number,
    description: 'Block gasLimit',
  })
  gasLimit: number;

  @ApiProperty({
    type: Number,
    description: 'Block gasUsed',
  })
  gasUsed: number;

  @ApiProperty({
    type: String,
    description: 'Block miner',
  })
  miner: string;

  @ApiProperty({
    type: String,
    description: 'Block extraData',
  })
  extraData: string;

  @ApiProperty({
    type: String,
    description: 'Block baseFeePerGas',
  })
  baseFeePerGas: number;

  @ApiProperty({
    type: String,
    description: "flag to known if it's forked block",
  })
  flag: string;
}

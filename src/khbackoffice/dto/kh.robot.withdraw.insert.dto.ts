import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class KhRobotWithdrawInsertDto {

  @ApiProperty({ example: 'MRT855' })
  @IsString()
  @IsNotEmpty()
  downlineCode: string;

  @ApiProperty({ example: 'Phors Somoun' })
  @IsString()
  @IsOptional()
  bankAccount?: string;

  @ApiProperty({ example: '855kh' })
  @IsString()
  @IsOptional()
  relatedUser?: string;

  @ApiProperty({ example: '7.00' })
  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;

  @ApiProperty({ example: '??????' })
  @IsString()
  @IsOptional()
  payoutBankName?: string;

  @ApiProperty({ example: 'CHOEM LITA' })
  @IsString()
  @IsOptional()
  payoutAccount?: string;

  @ApiProperty({ example: '090 3333 40' })
  @IsString()
  @IsOptional()
  payoutBankNo?: string;

  @ApiProperty({ example: '116.212.139.248' })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiProperty({ example: '2025-12-17 10:49:18' })
  @IsString()
  @IsOptional()
  confirmTime?: string;

  @ApiProperty({ example: 'ops01' })
  @IsString()
  @IsNotEmpty()
  operator: string;

  @ApiProperty({ example: '35985656' })
  @IsString()
  @IsNotEmpty()
  noId: string;

  @ApiProperty({ example: 'Manual' })
  @IsString()
  @IsOptional()
  categoryType?: string;

  @ApiProperty({ example: 'ACLEDA' })
  @IsString()
  @IsOptional()
  userBankName?: string;

  @ApiProperty({ example: 'WITHDRAW' })
  @IsIn(['WITHDRAW'])
  action: string;

  @ApiProperty({ example: '2025-12-17 10:49:11' })
  @IsString()
  @IsOptional()
  createdTime?: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: '014403550' })
  @IsString()
  @IsOptional()
  userBankNo?: string;

  @ApiProperty({ example: 'Finish' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'lyhav50' })
  @IsString()
  @IsNotEmpty()
  username: string;
}

// {
//    "downlineCode": "MRT855",
//    "bankAccount":"Phors Somoun",
//    "relatedUser":"855kh",
//    "amount":"7.00",
//    "payoutBankName":"??????",
//    "ip":"116.212.139.248",
//    "payoutAccount":"CHOEM LITA",
//    "payoutBankNo":"090 3333 40",
//    "confirmTime":"2025-12-17 10:49:18",
//    "operator":"ops01",
//    "noId":"35985656",
//    "categoryType":"Manual",
//    "userBankName":"ACLEDA",
//    "action":"WITHDRAW",
//    "createdTime":"2025-12-17 10:49:11",
//    "currency":"USD",
//    "userBankNo":"014403550",
//    "status":"Finish",
//    "username":"lyhav50"
// }

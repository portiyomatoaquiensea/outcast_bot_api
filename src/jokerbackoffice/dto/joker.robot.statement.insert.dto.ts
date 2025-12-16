import { IsDate, IsDateString, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from 'class-transformer';

ValidateNested()
export class jokerRobotStatementInsertDto {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    downlineCode: string;

    @ApiProperty({
        example: '2025-12-16 13:46:53',
    })
    @IsNotEmpty()
    @IsDateString()
    dateTime: string;

    @ApiProperty({ example: '9.40' })
    @IsNotEmpty()
    @Transform(({ value }) => Number(value))
    @IsNumber({ maxDecimalPlaces: 2 })
    amount: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    requestId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    relatedUsername: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    action: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    currency: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    requestBy: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    username: string;

}


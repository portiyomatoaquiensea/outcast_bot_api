
import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  data: any; // You can specify the type of data based on your API response structure
  
  constructor(message: string, statusCode: number, data: any) {
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResponseDto } from './common/response.dto';
import { Message, StatusCode } from './common/response.enum';

@ApiTags('welcome')
@Controller()
export class AppController {
  @Get()
  async getHello(): Promise<ResponseDto> {
    return new ResponseDto(
      Message.Success,
      StatusCode.Success,
      []);
  }
}

// auth/auth.controller.ts
import { Body, Controller, UseGuards, Request, Post, ValidationPipe, Put, Delete, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiBadRequestResponse, ApiBody, } from '@nestjs/swagger';
import { LocalAuthGuard } from '../auth/localAuth.guard';
import { ResponseDto } from '../common/response.dto';
import { JokerService } from './joker.service';
import { JokerRobotMemberDto } from './dto/joker.robot.member.dto';
import { Message, StatusCode } from '../common/response.enum';
import { JokerRobotMemberUpdateDto } from './dto/joker.robot.member.update.dto';
import { jokerRobotStatementInsertDto } from './dto/joker.robot.statement.insert.dto';

@ApiTags('Joker Pending Members List')
@Controller('joker')
export class JokerController {
  constructor(
    private readonly jokerService: JokerService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('/robot/insert/statement')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async insertStatement(
    @Body(new ValidationPipe()) jokerRobotStatementInsertDto: jokerRobotStatementInsertDto
  ): Promise<ResponseDto> {

    const date_time = jokerRobotStatementInsertDto.dateTime;
    const amount = jokerRobotStatementInsertDto.amount;
    const request_id = jokerRobotStatementInsertDto.requestId;
    const related_uername = jokerRobotStatementInsertDto.relatedUsername;
    const action = jokerRobotStatementInsertDto.action;
    const currency = jokerRobotStatementInsertDto.currency;
    const request_by = jokerRobotStatementInsertDto.requestBy;
    const username = jokerRobotStatementInsertDto.username?.trim();

    const date = this.jokerService.getRegisterDate(date_time);

    const findStatement = await this.jokerService.findStatement({
      requestId: request_id,
      requestBy: request_by,
    });
    
    if (findStatement) {
      return new ResponseDto(
        'This transaction already exist',
        StatusCode.Failed,
        []);
    }

    const findActiveBoAccountSetting = await this.jokerService.findActiveBoAccountSetting(
      'JOKER123',
      request_by
    );
  
    if (!findActiveBoAccountSetting) {
      return new ResponseDto(
        'User Backoffice not found',
        StatusCode.Failed,
        []);
    }

    const downline_wb_id = findActiveBoAccountSetting.wb_id;
    const downline_wb_code = findActiveBoAccountSetting.wb_code;
    const downline_id = findActiveBoAccountSetting.downline_id;
    const downline_code = findActiveBoAccountSetting.downlineCode;

    const insertedJkBackofficeStatement = await this.jokerService.insertedJkBackofficeStatement({
      dateTime: date_time,
      amount: amount,
      requestId: request_id,
      relatedUsername: related_uername,
      action: action,
      currency: currency,
      requestBy: request_by,
      username: username,
    });

    if (!insertedJkBackofficeStatement) {
      return new ResponseDto(
        'Failed to inserted Jk bBackoffice statement',
        StatusCode.Failed,
        []);
    }

    const newRobotStatement = Object.assign({}, {
      wb_id: downline_wb_id,
      wb_code: downline_wb_code,
      user_id: null,
      user_lock: '',
      downline_id: downline_id,
      downline_code: downline_code,
      player_status: 'NEW_PLAYER',
      player_account_id: null,
      player_code: '',
      player_name: username,
      player_bank_account_id: null,
      player_deposit_bank_account: '',
      operator_bank_account_id: null,
      operator_deposit_bank_account: '',
      operator_bank_id: null,
      amount: Math.abs(amount || null),
      transaction_type: action.toUpperCase() !== 'WITHDRAW' ? 'DEPOSIT' : 'WITHDRAW',
      transaction_status: 'PENDING',
      transaction_reference: request_id,
      transaction_belong: 'IS_MEMBER',
      is_locked: false,
      transaction_date: date_time,
    });

    const findMember = await this.jokerService.findMember({
        wb_id: downline_wb_id,
        wb_code: downline_wb_code,
        downline_id: downline_id,
        downline_code: downline_code,
        username: username
    });

    if (findMember) {
      newRobotStatement.player_bank_account_id = findMember.id;
      newRobotStatement.player_code = findMember.player_code;
      newRobotStatement.player_status = 'OLD_PLAYER';
    }

    const backoffice_account_type = findActiveBoAccountSetting.backoffice_account_type;
    
    // for bonus transaction
    if (['CASHBACK', 'BONUS'].includes(backoffice_account_type)) {
      if (!findMember) {
        return new ResponseDto(
          `Bonus but member not found: ${username}`,
          StatusCode.Failed,
          []);
      }
      
      const player_balance = parseFloat(findMember.balance);
      const end_player_balance = player_balance + Math.abs(amount || 0);

      newRobotStatement.transaction_type = backoffice_account_type;
      newRobotStatement.transaction_status = "APPROVED";
      const ROBOTUSERID = 41;
      const findSystemBalance = await this.jokerService.findSystemBalance({
        wb_id: downline_wb_id,
        wb_code: downline_wb_code,
        downline_id: downline_id,
        downline_code: downline_code,
      });

      if (!findSystemBalance) {
        return new ResponseDto(
          'System Balance not found Bonus',
          StatusCode.Failed,
          []);
      }

      const available_system_balance = parseFloat(findSystemBalance.available_balance);
      const end_system_balance = available_system_balance - Math.abs(amount || 0);
      const newSystemBalanceTransaction = Object.assign({}, {
        system_balance_id: findSystemBalance.id,
        wb_id: downline_wb_id,
        wb_code: downline_wb_code,
        user_id: ROBOTUSERID,
        downline_id: downline_id,
        downline_code: downline_code,
        amount: Math.abs(amount || 0),
        transaction_type: findActiveBoAccountSetting.backoffice_account_type,
        begin_balance: available_system_balance,
        last_balance: end_system_balance,
        transaction_date: date
      });

      const insertSystemBalanceTransaction = await this.jokerService.insertSystemBalanceTransaction(newSystemBalanceTransaction);
      if (!insertSystemBalanceTransaction) {
        return new ResponseDto(
          'Failed to insert systemBalance transaction',
          StatusCode.Failed,
          []);
      }

      const newPlayerAccountTransaction = Object.assign({}, {
        wb_id: downline_wb_id,
        wb_code: downline_wb_code,
        user_id: ROBOTUSERID,
        downline_id: downline_id,
        downline_code: downline_code,
        player_account_id: findMember.id,
        player_code: findMember.player_code,
        player_name: findMember.player_name,
        amount: Math.abs(amount || 0),
        begin_balance: player_balance,
        last_balance: end_player_balance,
        transaction_type: findActiveBoAccountSetting.backoffice_account_type,
        transaction_action: "APPROVED",
        transaction_date: date
      });

      const insertPlayerAccountTransaction = await this.jokerService.insertPlayerAccountTransaction(newPlayerAccountTransaction);
      if (!insertPlayerAccountTransaction) {
        return new ResponseDto(
          'Failed to insert player account transaction',
          StatusCode.Failed,
          []);
      }

      const updatePlayerAccountBalance = this.jokerService.updatePlayerAccountBalance(
        findMember.id,
        end_player_balance);
      if(!updatePlayerAccountBalance) {
        return new ResponseDto(
          'Failed to update player account balance',
          StatusCode.Failed,
          []);
      }
      
      const updateSystemBalanceById = this.jokerService.updateSystemBalanceById(
        findSystemBalance.id,
        end_system_balance);
      if(!updateSystemBalanceById) {
        return new ResponseDto(
          'Failed to update player account balance',
          StatusCode.Failed,
          []);
      }

      const playerDashboard = await this.jokerService.findPlayerDashboard({
        wb_id: downline_wb_id,
        wb_code: downline_wb_code,
        downline_id,
        downline_code,
        historical_date: date,
      });

      if (playerDashboard) {
        const total_bonus_amount = parseFloat(playerDashboard.total_bonus_amount);
        const last_total_bonus_amount = total_bonus_amount + Math.abs(amount || 0);
        const updatedDashboard = await this.jokerService.updatePlayerDashboardBonus(
          playerDashboard.id,
          last_total_bonus_amount
        );

        if (!updatedDashboard) {
          return new ResponseDto(
          'Failed to update player dashboard',
          StatusCode.Failed,
          []);
        } else {
          const newPlayerDashboard = Object.assign({}, {
            wb_id: downline_wb_id,
            wb_code: downline_wb_code,
            downline_id: downline_id,
            downline_code: downline_code,
            report_date: date,
            total_bonus_amount: Math.abs(amount || 0)
          });
          const newDashboard = await this.jokerService.insertPlayerDashboard(newPlayerDashboard);
          if (!newDashboard) {
            return new ResponseDto(
            'Failed to add new player dashboard',
            StatusCode.Failed,
            []);
          }
        }
      }
    }

    // End bonus
    const insertRobotStatement = this.jokerService.insertRobotStatement(newRobotStatement);
    if (!insertRobotStatement) {
      return new ResponseDto(
        'Failed to insert robot statement',
        StatusCode.Failed,
        []);
    }

    return new ResponseDto(
      Message.Success,
      StatusCode.Success,
      newRobotStatement);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/robot/get/member')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async memberList(
    @Body(new ValidationPipe()) jokerRobotMemberDto: JokerRobotMemberDto
  ): Promise<ResponseDto> {

    const request_by = jokerRobotMemberDto.downlineCode;
    
    const findActiveBoAccountSetting = await this.jokerService.findActiveBoAccountSetting(
      'JOKER123',
      request_by
    );
    
    if (!findActiveBoAccountSetting) {
      return new ResponseDto(
        'User Backoffice not found',
        StatusCode.Failed,
        []);
    }
    const downline_code = findActiveBoAccountSetting.downline_code;
    const pendingNewMember = await this.jokerService.pendingNewMember(
      downline_code,
      false
    );

    return new ResponseDto(
      Message.Success,
      StatusCode.Success,
      pendingNewMember ?? []);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/robot/update/member')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async memberUpdate(
    @Body(new ValidationPipe()) jokerRobotMemberUpdateDto: JokerRobotMemberUpdateDto
  ): Promise<ResponseDto> {

    const request_by = jokerRobotMemberUpdateDto.downlineCode;
    const robot_member_id = jokerRobotMemberUpdateDto.member_id;
    const username = jokerRobotMemberUpdateDto.username?.trim();
    const nickname = jokerRobotMemberUpdateDto.nickname;
    const member_type = jokerRobotMemberUpdateDto.type;
    const first_name = jokerRobotMemberUpdateDto.firstName;
    const last_name = jokerRobotMemberUpdateDto.lastName;
    const created_time = jokerRobotMemberUpdateDto.createdTime;
    const last_login = jokerRobotMemberUpdateDto.lastLogin;
    const login_ip = jokerRobotMemberUpdateDto.loginIP;

    const findActiveBoAccountSetting = await this.jokerService.findActiveBoAccountSetting(
      'JOKER123',
      request_by,
    );
    
    if (!findActiveBoAccountSetting) {
      return new ResponseDto(
        'User Backoffice not found',
        StatusCode.Failed,
        []);
    }

    const findMemberRobotById = await this.jokerService.findMemberRobotById(robot_member_id);
    if (!findMemberRobotById) {
      return new ResponseDto(
        'Robot member not found',
        StatusCode.Failed,
        []);
    }

    const updateMemberRobot = Object.assign({}, {
        nickname: nickname,
        firstname: first_name,
        lastname: last_name,
        type: member_type,
        created_time: this.jokerService.parseDateTime(created_time),
        last_login: this.jokerService.parseDateTime(last_login),
        login_ip: login_ip,
        robot_status: true,
    });

    const updateMemberRobotById = this.jokerService.updateMemberRobotById(robot_member_id, updateMemberRobot);
    if (!updateMemberRobotById) {
      return new ResponseDto(
        'Failed to update robot member',
        StatusCode.Failed,
        []
      );
    }

    const wb_id = findMemberRobotById.wb_id;
    const wb_code = findMemberRobotById.wb_code;
    const downline_id = findMemberRobotById.downline_id;
    const downline_code = findMemberRobotById.downline_code;
    const user_id = findMemberRobotById.user_id;

    const findMember = await this.jokerService.findMember({
        wb_id: wb_id,
        wb_code: wb_code,
        downline_id: downline_id,
        downline_code: downline_code,
        username: username
    });
    
    if (findMember) {
      return new ResponseDto(
        'Member already exist',
        StatusCode.Failed,
        []);
    }

    const player_code = await this.jokerService.generatePlayerCode(downline_code);
    const register_date = this.jokerService.getRegisterDate(created_time);

    const newMember = Object.assign({}, {
        wb_id: wb_id,
        wb_code: wb_code,
        downline_id: downline_id,
        downline_code: downline_code,
        player_code: player_code,
        player_name: username,
        phone_number: '',
        balance: 0.00,
        deleted: false,
        active: true,
        register_date: register_date,
        nickname: nickname,
    });
    
    const insertPlayerAccount = await this.jokerService.insertPlayerAccount(newMember);
    if (!insertPlayerAccount) {
      return new ResponseDto(
        'Failed to insert member',
        StatusCode.Failed,
        []);
    }
    const new_member_account_id = insertPlayerAccount.id;

    const historicalTransaction = await this.jokerService.findHistoricalTransaction({
      wb_id,
      wb_code,
      downline_id,
      downline_code,
      player_account_id: new_member_account_id,
      player_code,
      player_name: username,
    });
    
    if (historicalTransaction) {
        return new ResponseDto(
          'Member already exist in historical transaction',
          StatusCode.Success,
          []);
    }

    const insertHistoricalTransaction = await this.jokerService.insertHistoricalTransaction({
      wb_id,
      wb_code,
      user_id,
      downline_id,
      downline_code,
      player_account_id: new_member_account_id,
      player_code,
      player_name: username,
      historical_type: 'REGISTER',
      historical_date: register_date,
      amount: 0.00,
    });
    if (!insertHistoricalTransaction) {
      return new ResponseDto(
        'Failed to insert historical transaction',
        StatusCode.Failed,
        []);
    }

    const playerDashboard = await this.jokerService.findPlayerDashboard({
      wb_id,
      wb_code,
      downline_id,
      downline_code,
      historical_date: register_date,
    });
    
    if (!playerDashboard) {
      const insertPlayerDashboard = await this.jokerService.insertPlayerDashboard({
        wb_id,
        wb_code,
        downline_id,
        downline_code,
        historical_date: register_date,
        total_register: 1,
      });

      if (!insertPlayerDashboard) {
        return new ResponseDto(
          'Failed to insert player dashboard',
          StatusCode.Failed,
          []);
      }
    } else {
      const total_register = parseInt(playerDashboard.total_register);
      const incrementTotalRegister = await this.jokerService.incrementTotalRegister(
        playerDashboard.id,
        total_register + 1,
      );
      
      if (!incrementTotalRegister) {
        return new ResponseDto(
          'Failed to increment Total Register',
          StatusCode.Failed,
          []);
      }
    }

    return new ResponseDto(
      Message.Success,
      StatusCode.Success,
      []);
  }

}


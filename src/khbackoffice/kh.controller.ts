// auth/auth.controller.ts
import { Body, Controller, UseGuards, Request, Post, ValidationPipe, Put, Delete, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiBadRequestResponse, ApiBody, } from '@nestjs/swagger';
import { LocalAuthGuard } from '../auth/localAuth.guard';
import { ResponseDto } from '../common/response.dto';
import { KhService } from './kh.service';
import { KhRobotMemberDto } from './dto/kh.robot.member.dto';
import { Message, StatusCode } from '../common/response.enum';
import { KhRobotMemberUpdateDto } from './dto/kh.robot.member.update.dto';
import { KhRobotDepositInsertDto } from './dto/kh.robot.deposit.insert.dto';
import { KhRobotWithdrawInsertDto } from './dto/kh.robot.withdraw.insert.dto';

@ApiTags('855Kh backoffice api')
@Controller('kh')
export class KhController {
  constructor(
    private readonly khService: KhService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('/robot/insert/withdraw')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async insertWithdrawStatement(
    @Body(new ValidationPipe()) khRobotWithdrawInsertDto: KhRobotWithdrawInsertDto
  ): Promise<ResponseDto> {

    const bankAccount = khRobotWithdrawInsertDto.bankAccount;
    const relatedUser = khRobotWithdrawInsertDto.relatedUser;
    const amount = khRobotWithdrawInsertDto.amount;
    const payoutBankName = khRobotWithdrawInsertDto.payoutBankName;
    const payoutAccount = khRobotWithdrawInsertDto.payoutAccount;
    const payoutBankNo = khRobotWithdrawInsertDto.payoutBankNo;
    const ip = khRobotWithdrawInsertDto.ip;
    const confirmTime = khRobotWithdrawInsertDto.confirmTime;
    const operator = khRobotWithdrawInsertDto.operator;
    const noId = khRobotWithdrawInsertDto.noId;
    const categoryType = khRobotWithdrawInsertDto.categoryType;
    const userBankName = khRobotWithdrawInsertDto.userBankName;
    const action = khRobotWithdrawInsertDto.action;
    const createdTime = khRobotWithdrawInsertDto.createdTime;
    const currency = khRobotWithdrawInsertDto.currency;
    const userBankNo = khRobotWithdrawInsertDto.userBankNo;
    const status = khRobotWithdrawInsertDto.status;
    
    const username = khRobotWithdrawInsertDto.username?.trim();
    const date = this.khService.getRegisterDate(createdTime);

    const findStatement = await this.khService.findStatement({
      noId: noId,
      operator: operator,
    });
    
    if (findStatement) {
      return new ResponseDto(
        'This transaction already exist',
        StatusCode.Failed,
        []);
    }

    const findActiveBoAccountSetting = await this.khService.findActiveBoAccountSetting(
      '855KH',
      operator
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
    const downline_code = findActiveBoAccountSetting.downline_code;

    const insertKhRobotTransaction = await this.khService.insertKhRobotTransaction({
      relatedUser: relatedUser,
      amount: amount,
      currency: currency,
      ip: ip,
      action: action,
      categoryType: categoryType,
      operator: operator,
      noId: noId,
      status: status,
      username: username,
      confirmTime: confirmTime,
      createdTime: createdTime,

      // deposit
      bankAccountTranslate: null,
      bankAccountType: null,
      transferId: null,
      transferType: null,
      userBankName: userBankName,
      userBankAccountName: null,
      userBankNo: userBankNo,

      // withdraw
      bankAccount: bankAccount,
      payoutBankName: payoutBankName,
      payoutAccount: payoutAccount,
      payoutBankNo: payoutBankNo
    });

    if (!insertKhRobotTransaction) {
      return new ResponseDto(
        'Failed to inserted Kh bBackoffice statement',
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
      transaction_reference: noId,
      transaction_belong: 'IS_MEMBER',
      is_locked: false,
      transaction_date: createdTime,
    });

    const findMember = await this.khService.findMember({
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
      const findSystemBalance = await this.khService.findSystemBalance({
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

      const insertSystemBalanceTransaction = await this.khService.insertSystemBalanceTransaction(newSystemBalanceTransaction);
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

      const insertPlayerAccountTransaction = await this.khService.insertPlayerAccountTransaction(newPlayerAccountTransaction);
      if (!insertPlayerAccountTransaction) {
        return new ResponseDto(
          'Failed to insert player account transaction',
          StatusCode.Failed,
          []);
      }

      const updatePlayerAccountBalance = this.khService.updatePlayerAccountBalance(
        findMember.id,
        end_player_balance);
      if(!updatePlayerAccountBalance) {
        return new ResponseDto(
          'Failed to update player account balance',
          StatusCode.Failed,
          []);
      }
      
      const updateSystemBalanceById = this.khService.updateSystemBalanceById(
        findSystemBalance.id,
        end_system_balance);
      if(!updateSystemBalanceById) {
        return new ResponseDto(
          'Failed to update player account balance',
          StatusCode.Failed,
          []);
      }

      const playerDashboard = await this.khService.findPlayerDashboard({
        wb_id: downline_wb_id,
        wb_code: downline_wb_code,
        downline_id,
        downline_code,
        historical_date: date,
      });

      if (playerDashboard) {
        const total_bonus_amount = parseFloat(playerDashboard.total_bonus_amount);
        const last_total_bonus_amount = total_bonus_amount + Math.abs(amount || 0);
        const updatedDashboard = await this.khService.updatePlayerDashboardBonus(
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
          const newDashboard = await this.khService.insertPlayerDashboard(newPlayerDashboard);
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
    const insertRobotStatement = this.khService.insertRobotStatement(newRobotStatement);
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
  @Post('/robot/insert/deposit')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async insertDepositStatement(
    @Body(new ValidationPipe()) khRobotDepositInsertDto: KhRobotDepositInsertDto
  ): Promise<ResponseDto> {

    const relatedUser = khRobotDepositInsertDto.relatedUser;
    const amount = khRobotDepositInsertDto.amount;
    const bankAccountTranslate = khRobotDepositInsertDto.bankAccountTranslate;
    const ip = khRobotDepositInsertDto.ip;
    const confirmTime = khRobotDepositInsertDto.confirmTime;
    const transferId = khRobotDepositInsertDto.transferId;
    const operator = khRobotDepositInsertDto.operator;
    const noId = khRobotDepositInsertDto.noId;
    const categoryType = khRobotDepositInsertDto.categoryType;
    const bankAccountType = khRobotDepositInsertDto.bankAccountType;
    const userBankName = khRobotDepositInsertDto.userBankName;
    const action = khRobotDepositInsertDto.action;
    const transferType = khRobotDepositInsertDto.transferType;
    const createdTime = khRobotDepositInsertDto.createdTime;
    const currency = khRobotDepositInsertDto.currency;
    const userBankAccountName = khRobotDepositInsertDto.userBankAccountName;
    const userBankNo = khRobotDepositInsertDto.userBankNo;
    const status = khRobotDepositInsertDto.status;
    
    const username = khRobotDepositInsertDto.username?.trim();
    const date = this.khService.getRegisterDate(createdTime);

    const findStatement = await this.khService.findStatement({
      noId: noId,
      operator: operator,
    });
    
    if (findStatement) {
      return new ResponseDto(
        'This transaction already exist',
        StatusCode.Failed,
        []);
    }

    const findActiveBoAccountSetting = await this.khService.findActiveBoAccountSetting(
      '855KH',
      operator
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
    const downline_code = findActiveBoAccountSetting.downline_code;

    const insertKhRobotTransaction = await this.khService.insertKhRobotTransaction({
      relatedUser: relatedUser,
      amount: amount,
      currency: currency,
      ip: ip,
      action: action,
      categoryType: categoryType,
      operator: operator,
      noId: noId,
      status: status,
      username: username,
      confirmTime: confirmTime,
      createdTime: createdTime,

      // deposit
      bankAccountTranslate: bankAccountTranslate,
      bankAccountType: bankAccountType,
      transferId: transferId,
      transferType: transferType,
      userBankName: userBankName,
      userBankAccountName: userBankAccountName,
      userBankNo: userBankNo,

      // withdraw
      bankAccount: null,
      payoutBankName: null,
      payoutAccount: null,
      payoutBankNo: null
    });

    if (!insertKhRobotTransaction) {
      return new ResponseDto(
        'Failed to inserted Kh bBackoffice statement',
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
      transaction_reference: noId,
      transaction_belong: 'IS_MEMBER',
      is_locked: false,
      transaction_date: createdTime,
    });

    const findMember = await this.khService.findMember({
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
      const findSystemBalance = await this.khService.findSystemBalance({
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

      const insertSystemBalanceTransaction = await this.khService.insertSystemBalanceTransaction(newSystemBalanceTransaction);
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

      const insertPlayerAccountTransaction = await this.khService.insertPlayerAccountTransaction(newPlayerAccountTransaction);
      if (!insertPlayerAccountTransaction) {
        return new ResponseDto(
          'Failed to insert player account transaction',
          StatusCode.Failed,
          []);
      }

      const updatePlayerAccountBalance = this.khService.updatePlayerAccountBalance(
        findMember.id,
        end_player_balance);
      if(!updatePlayerAccountBalance) {
        return new ResponseDto(
          'Failed to update player account balance',
          StatusCode.Failed,
          []);
      }
      
      const updateSystemBalanceById = this.khService.updateSystemBalanceById(
        findSystemBalance.id,
        end_system_balance);
      if(!updateSystemBalanceById) {
        return new ResponseDto(
          'Failed to update player account balance',
          StatusCode.Failed,
          []);
      }

      const playerDashboard = await this.khService.findPlayerDashboard({
        wb_id: downline_wb_id,
        wb_code: downline_wb_code,
        downline_id,
        downline_code,
        historical_date: date,
      });

      if (playerDashboard) {
        const total_bonus_amount = parseFloat(playerDashboard.total_bonus_amount);
        const last_total_bonus_amount = total_bonus_amount + Math.abs(amount || 0);
        const updatedDashboard = await this.khService.updatePlayerDashboardBonus(
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
          const newDashboard = await this.khService.insertPlayerDashboard(newPlayerDashboard);
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
    const insertRobotStatement = this.khService.insertRobotStatement(newRobotStatement);
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
    @Body(new ValidationPipe()) khRobotMemberDto: KhRobotMemberDto
  ): Promise<ResponseDto> {

    const request_by = khRobotMemberDto.downlineCode;
    
    const findActiveBoAccountSetting = await this.khService.findActiveBoAccountSetting(
      '855KH',
      request_by
    );
    
    if (!findActiveBoAccountSetting) {
      return new ResponseDto(
        'User Backoffice not found',
        StatusCode.Failed,
        []);
    }

    const downline_code = findActiveBoAccountSetting.downline_code;
    const pendingNewMember = await this.khService.pendingNewMember(
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
    @Body(new ValidationPipe()) khRobotMemberUpdateDto: KhRobotMemberUpdateDto
  ): Promise<ResponseDto> {

    const request_by = khRobotMemberUpdateDto.downlineCode;
    const robot_member_id = khRobotMemberUpdateDto.memberId;
    const bankAccount = khRobotMemberUpdateDto.bankAccount;
    const agent = khRobotMemberUpdateDto.agent;
    const totalReferral = khRobotMemberUpdateDto.totalReferral;
    const registerTime = khRobotMemberUpdateDto.registerTime;
    const totalDeposit = khRobotMemberUpdateDto.totalDeposit;
    const ip = khRobotMemberUpdateDto.ip;
    const lastRefer = khRobotMemberUpdateDto.lastRefer;
    const remark = khRobotMemberUpdateDto.remark;
    const noId = khRobotMemberUpdateDto.noId;
    const lastDepositTime = khRobotMemberUpdateDto.lastDepositTime;
    const lastLoginTime = khRobotMemberUpdateDto.lastLoginTime;
    const balance = khRobotMemberUpdateDto.balance;
    const userBankName = khRobotMemberUpdateDto.userBankName;
    const currency = khRobotMemberUpdateDto.currency;
    const lastDeposit = khRobotMemberUpdateDto.lastDeposit;
    const userBankNo = khRobotMemberUpdateDto.userBankNo;
    const username = khRobotMemberUpdateDto.username?.trim();
    const status = khRobotMemberUpdateDto.status;
   
    const findActiveBoAccountSetting = await this.khService.findActiveBoAccountSetting(
      '855KH',
      request_by,
    );
    
    if (!findActiveBoAccountSetting) {
      return new ResponseDto(
        'User Backoffice not found',
        StatusCode.Failed,
        []);
    }

    const findMemberRobotById = await this.khService.findMemberRobotById(robot_member_id);
    if (!findMemberRobotById) {
      return new ResponseDto(
        'Robot member not found',
        StatusCode.Failed,
        []);
    }

    const updateMemberRobot = Object.assign({}, {
        nickname: username || bankAccount || '',
        firstname: username,
        lastname: username,
        type: remark,
        created_time: this.khService.parseDateTime(registerTime),
        last_login: this.khService.parseDateTime(lastLoginTime),
        login_ip: ip,
        robot_status: true,
    });

    const updateMemberRobotById = this.khService.updateMemberRobotById(robot_member_id, updateMemberRobot);
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
    
    if (!username) {
      return new ResponseDto(
        'username invalid',
        StatusCode.Failed,
        []
      );
    }

    const findMember = await this.khService.findMember({
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

    const player_code = await this.khService.generatePlayerCode(downline_code);
    const register_date = this.khService.getRegisterDate(registerTime);

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
        nickname: username,
    });
    
    const insertPlayerAccount = await this.khService.insertPlayerAccount(newMember);
    if (!insertPlayerAccount) {
      return new ResponseDto(
        'Failed to insert member',
        StatusCode.Failed,
        []);
    }
    const new_member_account_id = insertPlayerAccount.id;

    const historicalTransaction = await this.khService.findHistoricalTransaction({
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

    const insertHistoricalTransaction = await this.khService.insertHistoricalTransaction({
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

    const playerDashboard = await this.khService.findPlayerDashboard({
      wb_id,
      wb_code,
      downline_id,
      downline_code,
      historical_date: register_date,
    });
    
    if (!playerDashboard) {
      const insertPlayerDashboard = await this.khService.insertPlayerDashboard({
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
      const incrementTotalRegister = await this.khService.incrementTotalRegister(
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


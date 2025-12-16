import { Inject, Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/typeorm";
import { Connection } from "typeorm";
import { CONNDATAPLAYER, CONNREALTIME } from "../connection.decorator";
import dayjs from 'dayjs';

@Injectable()
export class JokerService {
  constructor(
    @InjectConnection(CONNDATAPLAYER()) private readonly dwConnection: Connection,
    @InjectConnection(CONNREALTIME()) private readonly realTimeConnection: Connection,
  ) {}

  async pendingNewMember(
    downlineCode: string,
    robotStatus?: boolean,
  ): Promise<any[]> {
    const params: any[] = [downlineCode];
    let query = `
      SELECT 
        id,
        username,
        nickname,
        firstname,
        lastname,
        type,
        created_time,
        last_login,
        login_ip,
        created_at,
        modified_at,
        robot_status,
        wb_id,
        wb_code,
        user_id,
        downline_id,
        downline_code
      FROM dw_robot_backoffice_members
      WHERE downline_code = $1
    `;

    // Add robot_status filter **only if provided**
    if (robotStatus !== undefined && robotStatus !== null) {
      params.push(robotStatus);
      query += ` AND robot_status = $${params.length}`;
    }

    const rawResult = await this.dwConnection.query(query, params);

    return rawResult;
  }

  async findMemberRobotById(id: number): Promise<any | null> {
    const query = `
      SELECT 
        id,
        username,
        nickname,
        firstname,
        lastname,
        type,
        created_time,
        last_login,
        login_ip,
        created_at,
        modified_at,
        robot_status,
        wb_id,
        wb_code,
        user_id,
        downline_id,
        downline_code
      FROM dw_robot_backoffice_members
      WHERE id = $1
      LIMIT 1
    `;

    const result = await this.dwConnection.query(query, [id]);

    return result[0] || null; // return a single row
  }

  async updateMemberRobotById(id: number, data: any): Promise<boolean> {
    const query = `
      UPDATE dw_robot_backoffice_members
      SET 
        nickname = $1,
        firstname = $2,
        lastname = $3,
        type = $4,
        created_time = $5,
        last_login = $6,
        login_ip = $7,
        robot_status = $8,
        modified_at = NOW()
      WHERE id = $9
    `;

    const params = [
      data.nickname,
      data.firstname,
      data.lastname,
      data.type,
      data.created_time,
      data.last_login,
      data.login_ip,
      data.robot_status,
      id
    ];

    const result = await this.dwConnection.query(query, params);

    return result.rowCount > 0; // true = updated
  }

  async findActiveBoAccountSetting(
    downlineCode: string,
    backofficeType: string,
    backofficeUser?: string,
  ): Promise<any | null> {
    const conditions: string[] = [
      'downline_code = $1',
      'backoffice_type = $2',
      'active = TRUE',
    ];

    const params: any[] = [downlineCode, backofficeType];

    if (backofficeUser) {
      conditions.push(`backoffice_user = $${params.length + 1}`);
      params.push(backofficeUser);
    }

    const query = `
      SELECT 
        id,
        wb_id,
        wb_code,
        downline_id,
        downline_code,
        backoffice_user,
        active,
        created,
        modified,
        backoffice_type,
        backoffice_account_type
      FROM dw_bonus_settings
      WHERE ${conditions.join(' AND ')}
      LIMIT 1
    `;

    const result = await this.dwConnection.query(query, params);
    return result[0] ?? null;
  }

  async findMember(data: any): Promise<any | null> {
    const query = `
      SELECT 
        id,
        wb_id,
        wb_code,
        downline_id,
        downline_code,
        player_code,
        player_name,
        phone_number,
        balance,
        deleted,
        active,
        register_date,
        created,
        modified,
        nickname
      FROM dw_player_accounts
      WHERE 
        wb_id = $1
        AND wb_code = $2
        AND downline_id = $3
        AND downline_code = $4
        AND player_name = $5
      LIMIT 1
    `;

    const params = [
      data.wb_id,
      data.wb_code,
      data.downline_id,
      data.downline_code,
      data.username,         // player_name = username
    ];

    const result = await this.dwConnection.query(query, params);

    return result[0] || null;
  }

  async insertPlayerAccount(data: any): Promise<any> {
    const query = `
      INSERT INTO dw_player_accounts (
        wb_id,
        wb_code,
        downline_id,
        downline_code,
        player_code,
        player_name,
        phone_number,
        balance,
        deleted,
        active,
        register_date,
        nickname
      )
      VALUES (
        $1, $2, $3, $4, $5, 
        $6, $7, $8, $9, $10,
        $11, $12
      )
      RETURNING *
    `;

    const params = [
      data.wb_id,
      data.wb_code,
      data.downline_id,
      data.downline_code,
      data.player_code,
      data.player_name,
      data.phone_number ?? null,
      data.balance,
      data.deleted,
      data.active,
      data.register_date,
      data.nickname ?? null,
    ];

    const result = await this.dwConnection.query(query, params);
    return result[0] || null;
  }

  async findPlayerDashboard(data: {
    wb_id: number;
    wb_code: string;
    downline_id: number;
    downline_code: string;
    historical_date: string | Date;
  }): Promise<any | null> {
    const query = `
      SELECT *
      FROM dw_player_dashboards
      WHERE 
        wb_id = $1
        AND wb_code = $2
        AND downline_id = $3
        AND downline_code = $4
        AND historical_date = $5
      LIMIT 1
    `;

    const params = [
      data.wb_id,
      data.wb_code,
      data.downline_id,
      data.downline_code,
      data.historical_date,
    ];

    const result = await this.dwConnection.query(query, params);

    return result[0] || null;
  }

  async findHistoricalTransaction(data: {
    wb_id: number;
    wb_code: string;
    downline_id: number;
    downline_code: string;
    player_account_id: number;
    player_code: string;
    player_name: string;
  }): Promise<any | null> {
    const query = `
      SELECT *
      FROM dw_player_historical_transactions
      WHERE
        wb_id = $1
        AND wb_code = $2
        AND downline_id = $3
        AND downline_code = $4
        AND player_account_id = $5
        AND player_code = $6
        AND player_name = $7
        AND historical_type = 'REGISTER'
      LIMIT 1
    `;

    const params = [
      data.wb_id,
      data.wb_code,
      data.downline_id,
      data.downline_code,
      data.player_account_id,
      data.player_code,
      data.player_name,
    ];

    const result = await this.dwConnection.query(query, params);
    return result[0] || null;
  }

  async incrementTotalRegister(
    dashboardId: number,
    currentTotal: number,
  ): Promise<boolean> {
    const query = `
      UPDATE dw_player_dashboards
      SET total_register = $1,
          modified = NOW()
      WHERE id = $2
      RETURNING id
    `;

    const result = await this.dwConnection.query(query, [
      currentTotal,
      dashboardId,
    ]);

    return result[0]?.length > 0;
  }

  async insertHistoricalTransaction(data: {
    wb_id: number;
    wb_code: string;
    user_id: number;
    downline_id: number;
    downline_code: string;
    player_account_id: number;
    player_code: string;
    player_name: string;
    historical_type: string;
    historical_date: string | Date;
    amount?: number;
  }): Promise<any> {
    const query = `
      INSERT INTO dw_player_historical_transactions (
        wb_id,
        wb_code,
        user_id,
        downline_id,
        downline_code,
        player_account_id,
        player_code,
        player_name,
        historical_type,
        historical_date,
        amount,
        created,
        modified
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
      RETURNING *
    `;
    const params = [
      data.wb_id,
      data.wb_code,
      data.user_id,
      data.downline_id,
      data.downline_code,
      data.player_account_id,
      data.player_code,
      data.player_name,
      data.historical_type,
      data.historical_date,
      data.amount || 0,
    ];
    const result = await this.dwConnection.query(query, params);
    return result[0] || null;
  }

  async findStatement(dto: { requestId: string; requestBy: string }): Promise<any | null> {
    const query = `
      SELECT *
      FROM dw_jk_backoffice_statements
      WHERE request_id = $1
        AND request_by = $2
      LIMIT 1
    `;

    const params = [dto.requestId, dto.requestBy];

    const result = await this.dwConnection.query(query, params);
    return result[0] || null; // return single row or null
  }

  async insertedJkBackofficeStatement(dto: {
    dateTime: string;
    amount: number;
    requestId: string;
    relatedUsername: string;
    action: string;
    currency: string;
    requestBy: string;
    username: string;
  }): Promise<any> {
    const query = `
      INSERT INTO dw_jk_backoffice_statements (
        date_time,
        amount,
        request_id,
        related_username,
        action,
        currency,
        request_by,
        username,
        created_at,
        modified_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const params = [
      dto.dateTime,
      dto.amount,
      dto.requestId,
      dto.relatedUsername,
      dto.action,
      dto.currency,
      dto.requestBy,
      dto.username,
    ];

    const result = await this.dwConnection.query(query, params);
    return result[0] || null; // return the inserted record
  }

  async insertRobotStatement(params: Partial<{
    wb_id: number;
    wb_code: string;
    user_id: number;
    user_lock: string;
    downline_id: number;
    downline_code: string;
    player_status: string;
    player_account_id: number;
    player_code: string;
    player_name: string;
    player_bank_account_id: number;
    player_deposit_bank_account: string;
    operator_bank_account_id: number;
    operator_deposit_bank_account: string;
    operator_bank_id: number;
    amount: number;
    transaction_type: string;
    transaction_status: string;
    transaction_reference: string;
    transaction_belong: string;
    is_locked: boolean;
    transaction_date: string;
  }>): Promise<any | null> {

    const query = `
      INSERT INTO dw_robot_statements (
        wb_id,
        wb_code,
        user_id,
        user_lock,
        downline_id,
        downline_code,
        player_status,
        player_account_id,
        player_code,
        player_name,
        player_bank_account_id,
        player_deposit_bank_account,
        operator_bank_account_id,
        operator_deposit_bank_account,
        operator_bank_id,
        amount,
        transaction_type,
        transaction_status,
        transaction_reference,
        transaction_belong,
        is_locked,
        transaction_date,
        created,
        modified
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,NOW(),NOW()
      )
      RETURNING *
    `;

    const values = [
      params.wb_id ?? null,
      params.wb_code ?? null,
      params.user_id ?? null,
      params.user_lock ?? null,
      params.downline_id ?? null,
      params.downline_code ?? null,
      params.player_status ?? 'NEW_PLAYER',
      params.player_account_id ?? null,
      params.player_code ?? null,
      params.player_name ?? null,
      params.player_bank_account_id ?? null,
      params.player_deposit_bank_account ?? null,
      params.operator_bank_account_id ?? null,
      params.operator_deposit_bank_account ?? null,
      params.operator_bank_id ?? null,
      params.amount != null ? Math.abs(params.amount) : 0,
      params.transaction_type ?? 'DEPOSIT',
      params.transaction_status ?? 'PENDING',
      params.transaction_reference ?? null,
      params.transaction_belong ?? 'IS_MEMBER',
      params.is_locked ?? false,
      params.transaction_date ?? null,
    ];

    const result = await this.realTimeConnection.query(query, values);
    return result[0] ?? null;
  }

  async callRandomString(length: number): Promise<string> {
    const query = `SELECT random_string($1) AS value`;
    const result = await this.dwConnection.query(query, [length]);
    return result[0]?.value || "";
  }

  async callGenerateUid(size: number): Promise<string> {
    const query = `SELECT generate_uid($1) AS value`;
    const result = await this.dwConnection.query(query, [size]);
    return result[0]?.value || "";
  }

  async generatePlayerCode(downlineCode: string): Promise<string> {
    const randomPart = await this.callRandomString(6);
    const uidPart = await this.callGenerateUid(2);

    return `${downlineCode}${randomPart}${uidPart}`;
  }

  async findSystemBalance(data: {
    wb_id: number;
    wb_code: string;
    downline_id: number;
    downline_code: string;
  }): Promise<any | null> {
    const query = `
      SELECT
        id,
        wb_id,
        wb_code,
        downline_id,
        downline_code,
        available_balance,
        created,
        modified
      FROM dw_system_balances
      WHERE
        wb_id = $1
        AND wb_code = $2
        AND downline_id = $3
        AND downline_code = $4
      LIMIT 1
    `;

    const params = [
      data.wb_id,
      data.wb_code,
      data.downline_id,
      data.downline_code,
    ];

    const result = await this.dwConnection.query(query, params);
    return result[0] ?? null;
  }

  async insertSystemBalanceTransaction(data: {
    system_balance_id: number;
    wb_id: number;
    wb_code: string;
    user_id: number;
    downline_id: number;
    downline_code: string;
    amount: number;
    transaction_type: string;
    begin_balance: number;
    last_balance: number;
    transaction_date: string | Date;
  }): Promise<any> {
    const query = `
      INSERT INTO dw_system_balance_transactions (
        system_balance_id,
        wb_id,
        wb_code,
        user_id,
        downline_id,
        downline_code,
        amount,
        transaction_type,
        begin_balance,
        last_balance,
        transaction_date,
        created,
        modified
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
      RETURNING *
    `;

    const params = [
      data.system_balance_id,
      data.wb_id,
      data.wb_code,
      data.user_id,
      data.downline_id,
      data.downline_code,
      data.amount,
      data.transaction_type,
      data.begin_balance,
      data.last_balance,
      data.transaction_date,
    ];

    const result = await this.dwConnection.query(query, params);
    return result[0] ?? null;
  }

  async insertPlayerAccountTransaction(data: {
    wb_id: number;
    wb_code: string;
    user_id: number;
    downline_id: number;
    downline_code: string;
    player_account_id: number;
    player_code: string;
    player_name: string;
    amount: number;
    begin_balance: number;
    last_balance: number;
    transaction_type: string;
    transaction_action: string;
    transaction_date: string | Date;
    player_bank_account_id?: number;
    player_deposit_bank_account?: string;
    operator_bank_account_id?: number;
    operator_deposit_bank_account?: string;
    operator_bank_id?: number;
  }): Promise<any> {
    const query = `
      INSERT INTO dw_player_account_transactions (
        wb_id,
        wb_code,
        user_id,
        downline_id,
        downline_code,
        player_account_id,
        player_code,
        player_name,
        amount,
        begin_balance,
        last_balance,
        transaction_type,
        transaction_action,
        transaction_date,
        player_bank_account_id,
        player_deposit_bank_account,
        operator_bank_account_id,
        operator_deposit_bank_account,
        operator_bank_id,
        created,
        modified
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW(),NOW())
      RETURNING *
    `;

    const params = [
      data.wb_id,
      data.wb_code,
      data.user_id,
      data.downline_id,
      data.downline_code,
      data.player_account_id,
      data.player_code,
      data.player_name,
      data.amount,
      data.begin_balance,
      data.last_balance,
      data.transaction_type,
      data.transaction_action,
      data.transaction_date,
      data.player_bank_account_id ?? null,
      data.player_deposit_bank_account ?? null,
      data.operator_bank_account_id ?? null,
      data.operator_deposit_bank_account ?? null,
      data.operator_bank_id ?? null,
    ];

    const result = await this.dwConnection.query(query, params);
    return result[0] ?? null;
  }

  async updatePlayerAccountBalance(
    accountId: number,
    newBalance: number,
  ): Promise<any> {
    const query = `
      UPDATE dw_player_accounts
      SET balance = $1,
          modified = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const params = [newBalance, accountId];

    const result = await this.dwConnection.query(query, params);
    return result[0] ?? null;
  }

  async updateSystemBalanceById(
    systemBalanceId: number,
    newBalance: number,
  ): Promise<any> {
    const query = `
      UPDATE dw_system_balances
      SET available_balance = $1,
          modified = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const params = [newBalance, systemBalanceId];

    const result = await this.dwConnection.query(query, params);
    return result[0] ?? null;
  }

  async updatePlayerDashboardBonus(
    dashboardId: number,
    newBonusAmount: number,
  ): Promise<any | null> {
    const query = `
      UPDATE dw_player_dashboards
      SET total_bonus_amount = $1,
          modified = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const params = [newBonusAmount, dashboardId];

    const result = await this.dwConnection.query(query, params);
    return result[0] ?? null;
  }
  

  async insertPlayerDashboard(data: Partial<{
    wb_id: number;
    wb_code: string;
    downline_id: number;
    downline_code: string;
    historical_date: string | Date;
    total_register: number;
    total_play: number;
    total_player_active: number;
    total_player_deposit: number;
    total_player_withdraw: number;
    total_deposit_amount: number;
    total_withdraw_amount: number;
    total_disbursement_amount: number;
    total_deposit_adjustment_amount: number;
    total_withdraw_adjustment_amount: number;
    daily_available_balance: number;
    daily_available_balance_previous_day: number;
    total_topup_amount: number;
    total_credit_amount: number;
    total_debit_amount: number;
    total_expense_amount: number;
    total_bonus_amount: number;
  }>): Promise<any | null> {

    const query = `
      INSERT INTO dw_player_dashboards (
        wb_id,
        wb_code,
        downline_id,
        downline_code,
        total_register,
        total_play,
        total_player_active,
        total_player_deposit,
        total_player_withdraw,
        total_deposit_amount,
        total_withdraw_amount,
        total_disbursement_amount,
        total_deposit_adjustment_amount,
        total_withdraw_adjustment_amount,
        daily_available_balance,
        daily_available_balance_previous_day,
        historical_date,
        total_topup_amount,
        total_credit_amount,
        total_debit_amount,
        total_expense_amount,
        total_bonus_amount,
        created,
        modified
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,NOW(),NOW()
      )
      RETURNING *
    `;

    const params = [
      data.wb_id,
      data.wb_code,
      data.downline_id,
      data.downline_code,
      data.total_register ?? 0,
      data.total_play ?? 0,
      data.total_player_active ?? 0,
      data.total_player_deposit ?? 0,
      data.total_player_withdraw ?? 0,
      data.total_deposit_amount ?? 0.0,
      data.total_withdraw_amount ?? 0.0,
      data.total_disbursement_amount ?? 0.0,
      data.total_deposit_adjustment_amount ?? 0.0,
      data.total_withdraw_adjustment_amount ?? 0.0,
      data.daily_available_balance ?? 0.0,
      data.daily_available_balance_previous_day ?? 0.0,
      data.historical_date ?? new Date(),
      data.total_topup_amount ?? 0.0,
      data.total_credit_amount ?? 0.0,
      data.total_debit_amount ?? 0.0,
      data.total_expense_amount ?? 0.0,
      data.total_bonus_amount ?? 0.0,
    ];

    const result = await this.dwConnection.query(query, params);
    return result[0] ?? null;
  }

  getRegisterDate(created_time: string | Date): string {
    // If created_time is a string
    if (typeof created_time === 'string') {
      return dayjs(created_time, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD');
    }

    // If created_time is a Date object
    return dayjs(created_time).format('YYYY-MM-DD');
  }

  parseDateTime(value: string): Date | null {
    if (value && value.trim() !== "") {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date; // validate date
    }
    return null;
  }


}
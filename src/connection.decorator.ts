import * as dotenv from 'dotenv';
dotenv.config();
export function Connection(name: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('connection', name, target);
  };
}

export function CONNDATAPLAYER(): string {
  return process.env.CONN_DTAPL_NAME;
}

export function CONNREALTIME(): string {
  return process.env.CONN_REALTIME_NAME;
}

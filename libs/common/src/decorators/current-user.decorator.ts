import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  _id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export const getCurrentUserByContext = (
  context: ExecutionContext,
): CurrentUser => {
  if (context.getType() === 'http') {
    return context.switchToHttp().getRequest().user;
  }
  if (context.getType() === 'rpc') {
    return context.switchToRpc().getData().user;
  }
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentUserByContext(context),
); 
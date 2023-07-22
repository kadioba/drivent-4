import { ApplicationError } from '@/protocols';

export function forbiddenError(text: string): ApplicationError {
  return {
    name: 'ForbiddenError',
    message: `Forbidden! ${text}`,
  };
}

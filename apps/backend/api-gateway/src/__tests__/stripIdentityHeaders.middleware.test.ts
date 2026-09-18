import { Request, Response } from 'express';
import { stripClientIdentityHeaders } from '../middleware/stripIdentityHeaders.middleware';

describe('stripClientIdentityHeaders (INC-016)', () => {
  it('removes every client-supplied x-user-* header and keeps the rest', () => {
    const req = {
      headers: {
        'x-user-id': 'forged',
        'x-user-type': 'admin',
        'x-user-email': 'x@y.z',
        authorization: 'Bearer abc',
        'x-request-id': 'r1',
      },
    } as unknown as Request;
    const next = jest.fn();

    stripClientIdentityHeaders(req, {} as Response, next);

    expect(req.headers).toEqual({ authorization: 'Bearer abc', 'x-request-id': 'r1' });
    expect(next).toHaveBeenCalledTimes(1);
  });
});

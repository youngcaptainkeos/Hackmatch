import { ZodError } from 'zod';
export function problem(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
// Shared HTTP error handling only; database operations remain in each route.
export function endpoint(handler) {
  return async (request) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        const expected = process.env.APP_ORIGIN;
        if (!expected || request.headers.get('origin') !== expected)
          problem('Request origin is not allowed.', 403);
      }
      const result = await handler(request);
      return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      if (error instanceof SyntaxError)
        return Response.json({ error: 'Invalid JSON request.' }, { status: 400 });
      if (error instanceof ZodError)
        return Response.json(
          { error: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') },
          { status: 400 }
        );
      if (error.status) return Response.json({ error: error.message }, { status: error.status });
      if (error.code === 'ER_DUP_ENTRY' || error.code === 11000)
        return Response.json(
          { error: 'This email, team name, membership, or application already exists.' },
          { status: 409 }
        );
      if (
        [
          'ER_CHECK_CONSTRAINT_VIOLATED',
          'ER_NO_REFERENCED_ROW_2',
          'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD',
        ].includes(error.code) ||
        error.code === 121
      )
        return Response.json(
          { error: 'The data does not meet database validation rules.' },
          { status: 400 }
        );
      if (error.code === 'ER_SIGNAL_EXCEPTION')
        return Response.json({ error: error.sqlMessage }, { status: 409 });
      if (['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error.code))
        return Response.json(
          { error: 'Another team action happened at the same time. Refresh and retry.' },
          { status: 409 }
        );
      console.error('Request failed:', error.code || error.name);
      return Response.json(
        { error: 'The service is unavailable. Please try again shortly.' },
        { status: 503 }
      );
    }
  };
}

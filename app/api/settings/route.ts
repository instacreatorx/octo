import { getSettingsDTO, updateSettings } from '@/lib/services/settings';
import { requireRole } from '@/lib/auth/auth';

export const GET = requireRole(['ADMIN'])(async () => {
  try {
    const dto = await getSettingsDTO();
    return Response.json(dto);
  } catch (e) {
    console.error('Failed to load settings', e);
    return new Response('Failed to load settings', { status: 500 });
  }
});

export const PATCH = requireRole(['ADMIN'])(async (request) => {
  try {
    const body = await request.json();
    const { openaiBaseUrl, openaiApiKey, postgresUrl, mssqlUrl } = body ?? {};
    await updateSettings({ openaiBaseUrl, openaiApiKey, postgresUrl, mssqlUrl });
    const dto = await getSettingsDTO();
    return Response.json(dto);
  } catch (e) {
    console.error('Failed to update settings', e);
    return new Response('Failed to update settings', { status: 500 });
  }
});



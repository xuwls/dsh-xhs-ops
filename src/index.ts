import type { Context } from '@deepseek-ai/cordis';
import { z } from 'zod';
import { XhsOpsService } from './service.js';

export const name = 'xhs-ops';

export const Config = z.object({}).strict();

export type Config = z.infer<typeof Config>;

/** 插件入口只负责装配；小红书运营逻辑集中在 XhsOpsService。 */
export function apply(ctx: Context, rawConfig: unknown): void {
  const config = Config.parse(rawConfig ?? {});
  const service = new XhsOpsService(ctx, config);

  void ctx.effect(async () => {
    await service.start();
    return () => service.dispose();
  }, 'xhs-ops: host service');
}

export { XhsOpsService } from './service.js';

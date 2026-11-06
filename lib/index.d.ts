import type { Context } from '@deepseek-ai/cordis';
import { z } from 'zod';
export declare const name = "xhs-ops";
export declare const Config: z.ZodObject<{}, z.core.$strict>;
export type Config = z.infer<typeof Config>;
/** 插件入口只负责装配；小红书运营逻辑集中在 XhsOpsService。 */
export declare function apply(ctx: Context, rawConfig: unknown): void;
export { XhsOpsService } from './service.js';

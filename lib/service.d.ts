import type { Context } from '@deepseek-ai/cordis';
import type { Config } from './index.js';
export interface XhsOpsStatus {
    readonly name: 'xhs-ops';
    readonly ready: boolean;
}
/** 宿主侧核心服务：持有插件生命周期，后续运营能力在此装配。 */
export declare class XhsOpsService {
    readonly ctx: Context;
    readonly config: Config;
    private ready;
    constructor(ctx: Context, config: Config);
    start(): Promise<void>;
    status(): XhsOpsStatus;
    dispose(): Promise<void>;
}

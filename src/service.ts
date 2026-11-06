import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Context } from '@deepseek-ai/cordis';
import type { Config } from './index.js';

const requiredResources = [
  'SKILL.md',
  'config/persona.md',
  'config/knowledge-base/README.md',
  'references/xhs-runtime-rules.md',
  'references/xhs-comment-ops.md',
  'references/xhs-publish-flows.md',
  'references/xhs-knowledge-base.md',
  'references/xhs-eval-patterns.md',
] as const;

export interface XhsOpsStatus {
  readonly name: 'xhs-ops';
  readonly ready: boolean;
}

/** 宿主侧核心服务：持有插件生命周期，后续运营能力在此装配。 */
export class XhsOpsService {
  private ready = false;

  constructor(
    readonly ctx: Context,
    readonly config: Config,
  ) {}

  async start(): Promise<void> {
    await Promise.all(requiredResources.map(async (relativePath) => {
      const resourceUrl = new URL(`../${relativePath}`, import.meta.url);
      try {
        await access(fileURLToPath(resourceUrl));
      } catch {
        throw new Error(`xhs-ops: missing bundled resource: ${relativePath}`);
      }
    }));
    this.ready = true;
  }

  status(): XhsOpsStatus {
    return { name: 'xhs-ops', ready: this.ready };
  }

  async dispose(): Promise<void> {
    this.ready = false;
  }
}

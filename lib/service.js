import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const requiredResources = [
    'SKILL.md',
    'config/persona.md',
    'config/knowledge-base/README.md',
    'references/xhs-runtime-rules.md',
    'references/xhs-comment-ops.md',
    'references/xhs-publish-flows.md',
    'references/xhs-knowledge-base.md',
    'references/xhs-eval-patterns.md',
];
/** 宿主侧核心服务：持有插件生命周期，后续运营能力在此装配。 */
export class XhsOpsService {
    ctx;
    config;
    ready = false;
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
    }
    async start() {
        await Promise.all(requiredResources.map(async (relativePath) => {
            const resourceUrl = new URL(`../${relativePath}`, import.meta.url);
            try {
                await access(fileURLToPath(resourceUrl));
            }
            catch {
                throw new Error(`xhs-ops: missing bundled resource: ${relativePath}`);
            }
        }));
        this.ready = true;
    }
    status() {
        return { name: 'xhs-ops', ready: this.ready };
    }
    async dispose() {
        this.ready = false;
    }
}

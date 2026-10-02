import { defineReactTests } from '../../tooling/config/vitest.ts';
import { uiSourceAliases } from '../../tooling/config/ui-source.ts';
const config = defineReactTests();
export default { ...config, resolve: { alias: uiSourceAliases() } };

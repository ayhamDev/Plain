import { coreBlocks } from './core';
import { dataBlocks } from './data';
import { workflowBlocks } from './workflows';
import { personalBlocks } from './personal';

export const blockSeeds = [...coreBlocks, ...dataBlocks, ...workflowBlocks, ...personalBlocks];
export const blockSeedById = new Map(blockSeeds.map((item) => [item.id, item]));

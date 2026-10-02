import { templateRegistry } from '../compositions/template-registry';
import { templateCategories } from '../compositions/types';
import { CompositionBrowser } from './BlocksPage';

export default function TemplatesPage() {
  return (
    <CompositionBrowser kind="templates" items={templateRegistry} categories={templateCategories} />
  );
}

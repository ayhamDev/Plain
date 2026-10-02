import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Box, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Kbd,
} from '@plain/ui';
import { components, guideLinks } from './catalog';

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="search-dialog" showClose={false}>
        <DialogTitle className="sr-only">Search documentation</DialogTitle>
        <DialogDescription className="sr-only">
          Find a component or a documentation page.
        </DialogDescription>
        <Command label="Search documentation">
          <CommandInput placeholder="What are you looking for?" aria-label="Search documentation" />
          <CommandList>
            <CommandEmpty>
              <Search className="search-empty-icon" aria-hidden="true" />
              No results found.
            </CommandEmpty>
            <CommandGroup heading="Getting started">
              {[
                ...guideLinks,
                { slug: 'customization', title: 'Customization' },
                { slug: 'rtl', title: 'Right to left' },
              ].map((guide) => (
                <CommandItem
                  key={guide.slug}
                  value={guide.title}
                  onSelect={() => go(`/docs/${guide.slug}`)}
                >
                  <BookOpen aria-hidden="true" />
                  {guide.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Components">
              {components.map((component) => (
                <CommandItem
                  key={component.slug}
                  value={component.name}
                  keywords={[component.category, component.slug]}
                  onSelect={() => go(`/components/${component.slug}`)}
                >
                  <Box aria-hidden="true" />
                  {component.name}
                  <span className="search-item-category">{component.category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="search-footer">
            <span>
              <Kbd>Enter</Kbd>to select
            </span>
            <span>
              <Kbd>Esc</Kbd>to close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

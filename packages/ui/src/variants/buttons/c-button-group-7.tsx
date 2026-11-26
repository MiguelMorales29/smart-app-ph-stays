import { Button } from '@smartapp/ui/components/button';
import { ButtonGroup, ButtonGroupText } from '@smartapp/ui/components/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@smartapp/ui/components/dropdown-menu';
import {
  GitMergeIcon,
  ChevronDownIcon,
  GitBranchIcon,
  CheckIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
} from 'lucide-react';

export function Pattern() {
  return (
    <ButtonGroup>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="gap-2">
              <GitMergeIcon aria-hidden="true" />
              <span>main</span>
              <ChevronDownIcon aria-hidden="true" className="size-3.5 opacity-60" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Switch Branch</DropdownMenuLabel>
            <DropdownMenuItem>
              <GitBranchIcon aria-hidden="true" />
              <span>main</span>
              <CheckIcon aria-hidden="true" className="text-primary ml-auto size-3.5" />
            </DropdownMenuItem>
            <DropdownMenuItem>
              <GitBranchIcon aria-hidden="true" />
              <span>develop</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <GitBranchIcon aria-hidden="true" />
              <span>feature/auth</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ButtonGroupText className="bg-transparent">
        <div className="size-1.5 animate-pulse rounded-full bg-success" />
        <span>Production</span>
      </ButtonGroupText>

      <Button variant="outline" size="icon">
        <RefreshCwIcon aria-hidden="true" />
      </Button>

      <Button variant="outline" size="icon">
        <ExternalLinkIcon aria-hidden="true" />
      </Button>
    </ButtonGroup>
  );
}

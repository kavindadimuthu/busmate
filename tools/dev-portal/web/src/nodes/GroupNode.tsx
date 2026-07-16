import { memo } from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import type { GroupNodeData } from '../types';

function GroupNodeImpl({ data }: NodeProps<Node<GroupNodeData>>) {
  return (
    <div className="group-box" style={{ ['--gc' as string]: data.color }}>
      <div className="group-head">
        <span className="group-dot" />
        {data.label}
        <span className="group-count">
          {data.up}/{data.total} up
        </span>
      </div>
    </div>
  );
}

export const GroupNode = memo(GroupNodeImpl);

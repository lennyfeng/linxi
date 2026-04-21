import { Table } from 'antd';
import type { TableProps } from 'antd';

/**
 * VirtualProTable – a thin wrapper around Ant Design Table that enables
 * `virtual` scroll mode when the row count exceeds the given threshold.
 *
 * Usage:
 *   <VirtualProTable dataSource={rows} columns={cols} rowKey="id" />
 *
 * For datasets >500 rows the component automatically sets the `virtual`
 * prop and constrains the scroll area so the browser does not render all
 * rows at once.
 */

const VIRTUAL_THRESHOLD = 500;
const DEFAULT_SCROLL_Y = 600;

function VirtualProTable<T extends object>(
  props: TableProps<T> & { virtualThreshold?: number; scrollY?: number },
) {
  const {
    virtualThreshold = VIRTUAL_THRESHOLD,
    scrollY = DEFAULT_SCROLL_Y,
    dataSource,
    scroll,
    ...rest
  } = props;

  const rowCount = Array.isArray(dataSource) ? dataSource.length : 0;
  const useVirtual = rowCount > virtualThreshold;

  const mergedScroll = useVirtual
    ? { ...scroll, y: scroll?.y ?? scrollY }
    : scroll;

  return (
    <Table<T>
      {...rest}
      dataSource={dataSource}
      scroll={mergedScroll}
      virtual={useVirtual}
    />
  );
}

export default VirtualProTable;

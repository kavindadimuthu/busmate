// libs/ui/src/patterns/dialogs/use-dialog.ts

import { useState, useCallback } from "react";

export function useDialog<TData = undefined>() {
  const [state, setState] = useState<{
    open: boolean;
    data?: TData;
  }>({ open: false });

  const open = useCallback((data?: TData) => {
    setState({ open: true, data });
  }, []);

  const close = useCallback(() => {
    setState({ open: false, data: undefined });
  }, []);

  const setOpen = useCallback(
    (open: boolean) => {
      if (!open) close();
      else setState((prev) => ({ ...prev, open }));
    },
    [close]
  );

  return {
    isOpen: state.open,
    data: state.data,
    open,
    close,
    setOpen,
  };
}

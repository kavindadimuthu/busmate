import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/** A new page opens at its top, as in a normal website. Going back or forward is left alone, so the browser can put the passenger where they were. */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const type = useNavigationType();
  useEffect(() => {
    if (type !== "POP") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, type]);
  return null;
}

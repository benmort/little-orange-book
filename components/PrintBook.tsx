import { PRINT_PAGES } from "@/lib/content";
import styles from "./PrintBook.module.css";

/**
 * The paper edition. Hidden on screen; `@media print` in globals.css swaps it
 * in for the reader and sets the sheet to 105 × 148 mm, one page per leaf.
 */
export default function PrintBook() {
  return (
    <div className="printbook">
      {PRINT_PAGES.map((page, n) => (
        <div key={n} className={`printpage ${styles.page}`}>
          <div className={styles.kicker}>{page.kicker}</div>
          <div className={styles.heading}>{page.heading}</div>
          <div className={styles.body}>{page.body}</div>
          <div className={styles.cite}>{page.cite}</div>
        </div>
      ))}
    </div>
  );
}

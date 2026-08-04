import Book from "@/components/Book";
import ContentWarning from "@/components/ContentWarning";
import PrintBook from "@/components/PrintBook";
import { bookConfig } from "@/lib/config";

export default function Home() {
  return (
    <>
      <ContentWarning />
      <Book config={bookConfig} />
      <PrintBook />
    </>
  );
}

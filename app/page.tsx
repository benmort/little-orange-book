import Book from "@/components/Book";
import PrintBook from "@/components/PrintBook";
import { bookConfig } from "@/lib/config";

export default function Home() {
  return (
    <>
      <Book config={bookConfig} />
      <PrintBook />
    </>
  );
}

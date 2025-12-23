import { redirect } from "next/navigation";

export default function Home() {
  // đá thẳng sang trang Users luôn
  redirect("/users");
}
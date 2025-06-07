import React from "react";
import SignIn from "@/components/signin";

export default function Home(): React.JSX.Element {
  return (
    <main className="py-5">
      <section className="w-full mt-8">
        {/* 新增 SignIn 登入元件 */}
        <div className="flex justify-center mt-8">
          <SignIn />
        </div>
      </section>
    </main>
  );
}
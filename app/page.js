"use client";

import { useRouter } from "next/navigation";
import React from "react";

const Page = () => {
  const router = useRouter();

  React.useEffect(() => {
    router.push("/login");
  }, [router]);

  return <div></div>;
};

export default Page;
